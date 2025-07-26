const express = require('express');
const matchingEngine = require('../services/matchingEngine');
const db = require('../config/database');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const findMatchesSchema = Joi.object({
  gigId: Joi.number().integer().positive().required(),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

const feedbackSchema = Joi.object({
  matchId: Joi.number().integer().positive().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  feedback: Joi.string().max(1000).optional()
});

/**
 * POST /api/matching/find-matches
 * Find talent matches for a specific gig
 */
router.post('/find-matches', async (req, res) => {
  try {
    const { error, value } = findMatchesSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const { gigId, limit } = value;

    // Check if gig exists
    const gigResult = await db.query('SELECT * FROM gigs WHERE id = $1', [gigId]);
    if (gigResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    const gig = gigResult.rows[0];
    const matches = await matchingEngine.findMatches(gigId, limit);

    res.json({
      success: true,
      gig: {
        id: gig.id,
        title: gig.title,
        category: gig.category,
        location: gig.location,
        budget: `₹${gig.min_budget?.toLocaleString()} - ₹${gig.max_budget?.toLocaleString()}`,
        requiredSkills: gig.required_skills
      },
      totalMatches: matches.length,
      matches: matches.map(match => ({
        talent: {
          id: match.talent.id,
          name: match.talent.name,
          city: match.talent.city,
          categories: match.talent.categories,
          skills: match.talent.skills,
          experienceYears: match.talent.experience_years,
          rating: parseFloat(match.talent.rating || 0),
          portfolioLinks: match.talent.portfolio_links,
          instagramHandle: match.talent.instagram_handle,
          bio: match.talent.bio
        },
        overallScore: match.overallScore,
        scores: {
          skills: Math.round(match.scores.skills * 100),
          location: Math.round(match.scores.location * 100),
          budget: Math.round(match.scores.budget * 100),
          experience: Math.round(match.scores.experience * 100),
          availability: Math.round(match.scores.availability * 100),
          semantic: Math.round(match.scores.semantic * 100)
        },
        explanation: match.explanation,
        rank: matches.indexOf(match) + 1
      }))
    });

  } catch (error) {
    console.error('Error finding matches:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to find matches'
    });
  }
});

/**
 * GET /api/matching/matches/:gigId
 * Get saved matches for a gig
 */
router.get('/matches/:gigId', async (req, res) => {
  try {
    const gigId = parseInt(req.params.gigId);
    if (isNaN(gigId)) {
      return res.status(400).json({ error: 'Invalid gig ID' });
    }

    const matches = await matchingEngine.getSavedMatches(gigId);

    res.json({
      success: true,
      gigId,
      totalMatches: matches.length,
      matches: matches.map((match, index) => ({
        matchId: match.matchId,
        talent: match.talent,
        scores: {
          overall: Math.round(match.scores.overall * 100),
          skills: Math.round(match.scores.skills * 100),
          location: Math.round(match.scores.location * 100),
          budget: Math.round(match.scores.budget * 100),
          experience: Math.round(match.scores.experience * 100),
          availability: Math.round(match.scores.availability * 100),
          semantic: Math.round(match.scores.semantic * 100)
        },
        explanation: match.explanation,
        status: match.status,
        rank: index + 1
      }))
    });

  } catch (error) {
    console.error('Error getting matches:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get matches'
    });
  }
});

/**
 * POST /api/matching/feedback
 * Submit feedback on a match
 */
router.post('/feedback', async (req, res) => {
  try {
    const { error, value } = feedbackSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const { matchId, rating, feedback } = value;

    // Check if match exists
    const matchResult = await db.query(`
      SELECT m.*, g.client_id 
      FROM matches m 
      JOIN gigs g ON m.gig_id = g.id 
      WHERE m.id = $1
    `, [matchId]);

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];

    // Insert feedback
    await db.query(`
      INSERT INTO feedback (match_id, client_id, rating, feedback_text)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (match_id) DO UPDATE SET
        rating = EXCLUDED.rating,
        feedback_text = EXCLUDED.feedback_text,
        created_at = CURRENT_TIMESTAMP
    `, [matchId, match.client_id, rating, feedback]);

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to submit feedback'
    });
  }
});

/**
 * GET /api/matching/algorithm-info
 * Get information about the matching algorithm
 */
router.get('/algorithm-info', (req, res) => {
  res.json({
    success: true,
    algorithm: {
      name: 'BreadButter Advanced Talent Matching Engine',
      version: '1.0.0',
      description: 'Multi-factor scoring algorithm combining rule-based logic with AI-powered semantic matching',
      scoringCriteria: {
        skills: {
          weight: '25%',
          description: 'Matches required skills with talent expertise, including partial and semantic matches'
        },
        location: {
          weight: '15%',
          description: 'Geographic compatibility, with higher scores for exact matches and regional proximity'
        },
        budget: {
          weight: '20%',
          description: 'Budget range compatibility between client requirements and talent expectations'
        },
        experience: {
          weight: '15%',
          description: 'Years of experience, project count, and client ratings'
        },
        availability: {
          weight: '10%',
          description: 'Current availability status of the talent'
        },
        semantic: {
          weight: '15%',
          description: 'AI-powered semantic similarity between gig requirements and talent profiles'
        }
      },
      features: [
        'Advanced skill matching with partial keyword support',
        'Location-aware scoring with regional intelligence',
        'Budget compatibility analysis',
        'Experience and reputation scoring',
        'Real-time availability checking',
        'AI-powered semantic similarity (when available)',
        'Detailed match explanations',
        'Feedback loop integration'
      ]
    }
  });
});

module.exports = router;

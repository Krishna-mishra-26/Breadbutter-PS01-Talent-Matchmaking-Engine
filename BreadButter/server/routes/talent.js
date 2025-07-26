const express = require('express');
const db = require('../config/database');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const talentSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-()]+$/).optional(),
  city: Joi.string().min(2).max(100).required(),
  categories: Joi.array().items(Joi.string()).min(1).required(),
  skills: Joi.array().items(Joi.string()).min(1).required(),
  experienceYears: Joi.number().integer().min(0).max(50).default(0),
  minBudget: Joi.number().integer().min(0).optional(),
  maxBudget: Joi.number().integer().min(0).optional(),
  portfolioLinks: Joi.array().items(Joi.string().uri()).optional(),
  bio: Joi.string().max(1000).optional(),
  instagramHandle: Joi.string().max(255).optional(),
  linkedinUrl: Joi.string().uri().optional(),
  websiteUrl: Joi.string().uri().optional()
});

/**
 * GET /api/talent
 * Get all talents with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { category, city, minExperience, maxBudget, skills } = req.query;
    
    let query = 'SELECT * FROM talents WHERE availability_status = $1';
    let params = ['available'];
    let paramIndex = 2;

    // Add filters
    if (category) {
      query += ` AND $${paramIndex} = ANY(categories)`;
      params.push(category);
      paramIndex++;
    }

    if (city) {
      query += ` AND LOWER(city) = LOWER($${paramIndex})`;
      params.push(city);
      paramIndex++;
    }

    if (minExperience) {
      query += ` AND experience_years >= $${paramIndex}`;
      params.push(parseInt(minExperience));
      paramIndex++;
    }

    if (maxBudget) {
      query += ` AND (min_budget IS NULL OR min_budget <= $${paramIndex})`;
      params.push(parseInt(maxBudget));
      paramIndex++;
    }

    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query += ` AND skills && $${paramIndex}`;
      params.push(skillsArray);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      totalTalents: result.rows.length,
      talents: result.rows.map(talent => ({
        id: talent.id,
        name: talent.name,
        email: talent.email,
        city: talent.city,
        categories: talent.categories,
        skills: talent.skills,
        experienceYears: talent.experience_years,
        budgetRange: talent.min_budget && talent.max_budget 
          ? `₹${talent.min_budget.toLocaleString()} - ₹${talent.max_budget.toLocaleString()}`
          : 'Negotiable',
        rating: parseFloat(talent.rating || 0),
        totalProjects: talent.total_projects || 0,
        portfolioLinks: talent.portfolio_links || [],
        bio: talent.bio,
        instagramHandle: talent.instagram_handle,
        availabilityStatus: talent.availability_status
      }))
    });

  } catch (error) {
    console.error('Error fetching talents:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch talents'
    });
  }
});

/**
 * GET /api/talent/:id
 * Get a specific talent by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const talentId = parseInt(req.params.id);
    if (isNaN(talentId)) {
      return res.status(400).json({ error: 'Invalid talent ID' });
    }

    const result = await db.query('SELECT * FROM talents WHERE id = $1', [talentId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Talent not found' });
    }

    const talent = result.rows[0];

    res.json({
      success: true,
      talent: {
        id: talent.id,
        name: talent.name,
        email: talent.email,
        phone: talent.phone,
        city: talent.city,
        categories: talent.categories,
        skills: talent.skills,
        experienceYears: talent.experience_years,
        budgetRange: {
          min: talent.min_budget,
          max: talent.max_budget
        },
        rating: parseFloat(talent.rating || 0),
        totalProjects: talent.total_projects || 0,
        portfolioLinks: talent.portfolio_links || [],
        bio: talent.bio,
        instagramHandle: talent.instagram_handle,
        linkedinUrl: talent.linkedin_url,
        websiteUrl: talent.website_url,
        availabilityStatus: talent.availability_status,
        createdAt: talent.created_at,
        updatedAt: talent.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching talent:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch talent'
    });
  }
});

/**
 * POST /api/talent
 * Create a new talent profile
 */
router.post('/', async (req, res) => {
  try {
    const { error, value } = talentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const {
      name, email, phone, city, categories, skills, experienceYears,
      minBudget, maxBudget, portfolioLinks, bio, instagramHandle,
      linkedinUrl, websiteUrl
    } = value;

    // Check if email already exists
    const existingTalent = await db.query('SELECT id FROM talents WHERE email = $1', [email]);
    if (existingTalent.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const result = await db.query(`
      INSERT INTO talents (
        name, email, phone, city, categories, skills, experience_years,
        min_budget, max_budget, portfolio_links, bio, instagram_handle,
        linkedin_url, website_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      name, email, phone, city, categories, skills, experienceYears,
      minBudget, maxBudget, portfolioLinks, bio, instagramHandle,
      linkedinUrl, websiteUrl
    ]);

    const newTalent = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Talent profile created successfully',
      talent: {
        id: newTalent.id,
        name: newTalent.name,
        email: newTalent.email,
        city: newTalent.city,
        categories: newTalent.categories,
        skills: newTalent.skills
      }
    });

  } catch (error) {
    console.error('Error creating talent:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create talent profile'
    });
  }
});

/**
 * GET /api/talent/categories/stats
 * Get statistics about talent categories
 */
router.get('/categories/stats', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        unnest(categories) as category,
        COUNT(*) as talent_count
      FROM talents 
      WHERE availability_status = 'available'
      GROUP BY category
      ORDER BY talent_count DESC
    `);

    res.json({
      success: true,
      categories: result.rows
    });

  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch category statistics'
    });
  }
});

/**
 * GET /api/talent/cities/stats
 * Get statistics about talent cities
 */
router.get('/cities/stats', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        city,
        COUNT(*) as talent_count,
        AVG(experience_years) as avg_experience,
        AVG(rating) as avg_rating
      FROM talents 
      WHERE availability_status = 'available'
      GROUP BY city
      ORDER BY talent_count DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      cities: result.rows.map(row => ({
        city: row.city,
        talentCount: parseInt(row.talent_count),
        avgExperience: parseFloat(row.avg_experience || 0).toFixed(1),
        avgRating: parseFloat(row.avg_rating || 0).toFixed(1)
      }))
    });

  } catch (error) {
    console.error('Error fetching city stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch city statistics'
    });
  }
});

module.exports = router;

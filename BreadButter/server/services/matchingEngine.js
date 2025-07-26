const db = require('../config/database');
const openai = require('../config/openai');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

class MatchingEngine {
  constructor() {
    this.weights = {
      skills: 0.25,
      location: 0.15,
      budget: 0.20,
      experience: 0.15,
      availability: 0.10,
      semantic: 0.15
    };
  }

  /**
   * Main method to find matches for a gig
   * @param {number} gigId - The gig ID to find matches for
   * @param {number} limit - Maximum number of matches to return
   * @returns {Array} Array of matched talents with scores
   */
  async findMatches(gigId, limit = 10) {
    try {
      logger.info(`🔍 Finding matches for gig ${gigId}`);

      // Get gig details
      const gigResult = await db.query('SELECT * FROM gigs WHERE id = $1', [gigId]);
      if (gigResult.rows.length === 0) {
        throw new Error('Gig not found');
      }
      const gig = gigResult.rows[0];

      // Get all available talents
      const talentsResult = await db.query(`
        SELECT * FROM talents 
        WHERE availability_status = 'available'
        ORDER BY created_at DESC
      `);
      const talents = talentsResult.rows;

      if (talents.length === 0) {
        return [];
      }

      // Calculate scores for each talent
      const matches = [];
      for (const talent of talents) {
        const scores = await this.calculateScores(gig, talent);
        const overallScore = this.calculateOverallScore(scores);
        
        if (overallScore >= 0.3) { // Minimum threshold
          matches.push({
            talent,
            scores,
            overallScore,
            explanation: this.generateExplanation(gig, talent, scores)
          });
        }
      }

      // Sort by overall score and return top matches
      matches.sort((a, b) => b.overallScore - a.overallScore);
      const topMatches = matches.slice(0, limit);

      // Save matches to database
      await this.saveMatches(gigId, topMatches);

      logger.info(`✅ Found ${topMatches.length} matches for gig ${gigId}`);
      return topMatches;

    } catch (error) {
      logger.error('❌ Error finding matches:', error);
      throw error;
    }
  }

  /**
   * Calculate individual scores for different criteria
   */
  async calculateScores(gig, talent) {
    const scores = {
      skills: this.calculateSkillScore(gig, talent),
      location: this.calculateLocationScore(gig, talent),
      budget: this.calculateBudgetScore(gig, talent),
      experience: this.calculateExperienceScore(gig, talent),
      availability: this.calculateAvailabilityScore(gig, talent),
      semantic: await this.calculateSemanticScore(gig, talent)
    };

    return scores;
  }

  /**
   * Calculate skill match score based on required skills vs talent skills
   */
  calculateSkillScore(gig, talent) {
    const requiredSkills = gig.required_skills || [];
    const talentSkills = talent.skills || [];
    const talentCategories = talent.categories || [];
    
    if (requiredSkills.length === 0) return 0.5;

    let matchedSkills = 0;
    let totalWeight = 0;

    requiredSkills.forEach(requiredSkill => {
      totalWeight += 1;
      
      // Direct skill match
      const directMatch = talentSkills.some(skill => 
        skill.toLowerCase().includes(requiredSkill.toLowerCase()) ||
        requiredSkill.toLowerCase().includes(skill.toLowerCase())
      );
      
      if (directMatch) {
        matchedSkills += 1;
        return;
      }

      // Category match (partial credit)
      const categoryMatch = talentCategories.some(category =>
        category.toLowerCase().includes(requiredSkill.toLowerCase()) ||
        requiredSkill.toLowerCase().includes(category.toLowerCase())
      );
      
      if (categoryMatch) {
        matchedSkills += 0.7;
        return;
      }

      // Partial keyword match
      const keywords = requiredSkill.toLowerCase().split(' ');
      const talentSkillsStr = talentSkills.join(' ').toLowerCase();
      const partialMatch = keywords.some(keyword => talentSkillsStr.includes(keyword));
      
      if (partialMatch) {
        matchedSkills += 0.3;
      }
    });

    return Math.min(matchedSkills / totalWeight, 1.0);
  }

  /**
   * Calculate location compatibility score
   */
  calculateLocationScore(gig, talent) {
    if (gig.is_remote) return 1.0;
    
    const gigLocation = (gig.location || '').toLowerCase();
    const talentCity = (talent.city || '').toLowerCase();
    
    if (!gigLocation || !talentCity) return 0.5;

    // Exact city match
    if (gigLocation.includes(talentCity) || talentCity.includes(gigLocation)) {
      return 1.0;
    }

    // Same state/region logic (simplified)
    const locationMapping = {
      'mumbai': 'maharashtra',
      'pune': 'maharashtra',
      'bangalore': 'karnataka',
      'hyderabad': 'telangana',
      'chennai': 'tamil nadu',
      'delhi': 'delhi',
      'gurgaon': 'delhi',
      'noida': 'delhi',
      'goa': 'goa'
    };

    const gigState = locationMapping[gigLocation] || gigLocation;
    const talentState = locationMapping[talentCity] || talentCity;

    if (gigState === talentState) return 0.7;

    // Major metro cities have better connectivity
    const majorCities = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'pune'];
    if (majorCities.includes(gigLocation) && majorCities.includes(talentCity)) {
      return 0.4;
    }

    return 0.2;
  }

  /**
   * Calculate budget compatibility score
   */
  calculateBudgetScore(gig, talent) {
    const gigMin = gig.min_budget || 0;
    const gigMax = gig.max_budget || Infinity;
    const talentMin = talent.min_budget || 0;
    const talentMax = talent.max_budget || Infinity;

    // Perfect match - budgets overlap
    if (gigMax >= talentMin && gigMin <= talentMax) {
      const overlapStart = Math.max(gigMin, talentMin);
      const overlapEnd = Math.min(gigMax, talentMax);
      const overlapSize = overlapEnd - overlapStart;
      const gigRange = gigMax - gigMin;
      const talentRange = talentMax - talentMin;
      
      if (gigRange === 0 && talentRange === 0) return 1.0;
      
      const overlapRatio = overlapSize / Math.max(gigRange, talentRange);
      return Math.min(overlapRatio * 2, 1.0); // Boost overlap score
    }

    // Partial compatibility
    if (gigMax < talentMin) {
      const gap = talentMin - gigMax;
      const talentRange = talentMax - talentMin;
      return Math.max(0, 1 - (gap / Math.max(talentRange, gigMax)) * 2);
    }

    if (gigMin > talentMax) {
      const gap = gigMin - talentMax;
      const gigRange = gigMax - gigMin;
      return Math.max(0, 1 - (gap / Math.max(gigRange, talentMax)) * 2);
    }

    return 0.3;
  }

  /**
   * Calculate experience relevance score
   */
  calculateExperienceScore(gig, talent) {
    const experience = talent.experience_years || 0;
    const totalProjects = talent.total_projects || 0;
    const rating = parseFloat(talent.rating || 0);

    // Base experience score
    let expScore = 0;
    if (experience >= 5) expScore = 1.0;
    else if (experience >= 3) expScore = 0.8;
    else if (experience >= 1) expScore = 0.6;
    else expScore = 0.3;

    // Project count bonus
    const projectBonus = Math.min(totalProjects * 0.05, 0.2);
    
    // Rating bonus
    const ratingBonus = rating > 0 ? (rating / 5) * 0.2 : 0;

    return Math.min(expScore + projectBonus + ratingBonus, 1.0);
  }

  /**
   * Calculate availability score
   */
  calculateAvailabilityScore(gig, talent) {
    if (talent.availability_status === 'available') return 1.0;
    if (talent.availability_status === 'partially_available') return 0.6;
    if (talent.availability_status === 'busy') return 0.2;
    return 0.0;
  }

  /**
   * Calculate semantic similarity using AI embeddings
   */
  async calculateSemanticScore(gig, talent) {
    try {
      // For now, return a placeholder semantic score
      // In a real implementation, this would use OpenAI embeddings
      const gigText = `${gig.title} ${gig.description} ${(gig.style_preferences || []).join(' ')}`;
      const talentText = `${talent.bio || ''} ${(talent.skills || []).join(' ')} ${(talent.categories || []).join(' ')}`;
      
      // Simple keyword-based semantic scoring as fallback
      const gigWords = gigText.toLowerCase().split(/\W+/).filter(w => w.length > 3);
      const talentWords = talentText.toLowerCase().split(/\W+/).filter(w => w.length > 3);
      
      const commonWords = gigWords.filter(word => talentWords.includes(word));
      const similarity = commonWords.length / Math.max(gigWords.length, talentWords.length, 1);
      
      return Math.min(similarity * 2, 1.0); // Boost the score
      
    } catch (error) {
      logger.warn('Semantic scoring failed, using fallback:', error.message);
      return 0.5;
    }
  }

  /**
   * Calculate weighted overall score
   */
  calculateOverallScore(scores) {
    let totalScore = 0;
    for (const [criterion, weight] of Object.entries(this.weights)) {
      totalScore += (scores[criterion] || 0) * weight;
    }
    return Math.round(totalScore * 1000) / 1000; // Round to 3 decimal places
  }

  /**
   * Generate human-readable explanation for the match
   */
  generateExplanation(gig, talent, scores) {
    const explanations = [];
    
    // Skills explanation
    if (scores.skills > 0.8) {
      explanations.push(`🎯 Excellent skill match (${Math.round(scores.skills * 100)}%) - has most required skills`);
    } else if (scores.skills > 0.6) {
      explanations.push(`✅ Good skill match (${Math.round(scores.skills * 100)}%) - covers key requirements`);
    } else if (scores.skills > 0.3) {
      explanations.push(`🔶 Partial skill match (${Math.round(scores.skills * 100)}%) - some relevant skills`);
    }

    // Location explanation
    if (scores.location === 1.0) {
      explanations.push(`📍 Perfect location match - based in ${talent.city}`);
    } else if (scores.location > 0.6) {
      explanations.push(`📍 Good location compatibility - same region`);
    } else if (scores.location > 0.3) {
      explanations.push(`📍 Moderate location match - travel may be needed`);
    }

    // Budget explanation
    if (scores.budget > 0.8) {
      explanations.push(`💰 Budget aligns well with requirements (₹${talent.min_budget?.toLocaleString()}-₹${talent.max_budget?.toLocaleString()})`);
    } else if (scores.budget > 0.5) {
      explanations.push(`💰 Budget partially compatible`);
    }

    // Experience explanation
    if (scores.experience > 0.8) {
      explanations.push(`⭐ Strong experience (${talent.experience_years} years, ${talent.total_projects} projects)`);
    } else if (scores.experience > 0.5) {
      explanations.push(`⭐ Moderate experience (${talent.experience_years} years)`);
    }

    return explanations.join(' • ');
  }

  /**
   * Save matches to database
   */
  async saveMatches(gigId, matches) {
    try {
      // Clear existing matches for this gig
      await db.query('DELETE FROM matches WHERE gig_id = $1', [gigId]);

      // Insert new matches
      for (const match of matches) {
        await db.query(`
          INSERT INTO matches (
            gig_id, talent_id, overall_score, skill_score, location_score, 
            budget_score, experience_score, availability_score, semantic_score, explanation
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          gigId,
          match.talent.id,
          match.overallScore,
          match.scores.skills,
          match.scores.location,
          match.scores.budget,
          match.scores.experience,
          match.scores.availability,
          match.scores.semantic,
          match.explanation
        ]);
      }

      logger.info(`💾 Saved ${matches.length} matches for gig ${gigId}`);
    } catch (error) {
      logger.error('❌ Error saving matches:', error);
      throw error;
    }
  }

  /**
   * Get saved matches for a gig
   */
  async getSavedMatches(gigId) {
    try {
      const result = await db.query(`
        SELECT 
          m.*,
          t.name, t.email, t.city, t.categories, t.skills, t.portfolio_links,
          t.bio, t.experience_years, t.rating, t.instagram_handle
        FROM matches m
        JOIN talents t ON m.talent_id = t.id
        WHERE m.gig_id = $1
        ORDER BY m.overall_score DESC
      `, [gigId]);

      return result.rows.map(row => ({
        matchId: row.id,
        talent: {
          id: row.talent_id,
          name: row.name,
          email: row.email,
          city: row.city,
          categories: row.categories,
          skills: row.skills,
          portfolioLinks: row.portfolio_links,
          bio: row.bio,
          experienceYears: row.experience_years,
          rating: parseFloat(row.rating),
          instagramHandle: row.instagram_handle
        },
        scores: {
          overall: parseFloat(row.overall_score),
          skills: parseFloat(row.skill_score),
          location: parseFloat(row.location_score),
          budget: parseFloat(row.budget_score),
          experience: parseFloat(row.experience_score),
          availability: parseFloat(row.availability_score),
          semantic: parseFloat(row.semantic_score)
        },
        explanation: row.explanation,
        status: row.status
      }));
    } catch (error) {
      logger.error('❌ Error getting saved matches:', error);
      throw error;
    }
  }
}

module.exports = new MatchingEngine();

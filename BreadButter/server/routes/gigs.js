const express = require('express');
const db = require('../config/database');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const gigSchema = Joi.object({
  clientId: Joi.number().integer().positive().required(),
  title: Joi.string().min(5).max(255).required(),
  description: Joi.string().min(10).max(2000).required(),
  category: Joi.string().min(2).max(100).required(),
  requiredSkills: Joi.array().items(Joi.string()).min(1).required(),
  location: Joi.string().max(255).optional(),
  isRemote: Joi.boolean().default(false),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  durationDays: Joi.number().integer().min(1).max(365).optional(),
  minBudget: Joi.number().integer().min(0).optional(),
  maxBudget: Joi.number().integer().min(0).optional(),
  stylePreferences: Joi.array().items(Joi.string()).optional(),
  additionalRequirements: Joi.string().max(1000).optional(),
  urgencyLevel: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
});

const clientSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  company: Joi.string().max(255).optional(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-()]+$/).optional(),
  city: Joi.string().max(100).optional(),
  industry: Joi.string().max(100).optional()
});

/**
 * GET /api/gigs
 * Get all gigs with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { status, category, location, minBudget, maxBudget } = req.query;
    
    let query = `
      SELECT g.*, c.name as client_name, c.company as client_company
      FROM gigs g
      LEFT JOIN clients c ON g.client_id = c.id
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;

    // Add filters
    if (status) {
      query += ` AND g.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    } else {
      query += ` AND g.status = $${paramIndex}`;
      params.push('open');
      paramIndex++;
    }

    if (category) {
      query += ` AND LOWER(g.category) = LOWER($${paramIndex})`;
      params.push(category);
      paramIndex++;
    }

    if (location) {
      query += ` AND (g.is_remote = true OR LOWER(g.location) LIKE LOWER($${paramIndex}))`;
      params.push(`%${location}%`);
      paramIndex++;
    }

    if (minBudget) {
      query += ` AND (g.max_budget IS NULL OR g.max_budget >= $${paramIndex})`;
      params.push(parseInt(minBudget));
      paramIndex++;
    }

    if (maxBudget) {
      query += ` AND (g.min_budget IS NULL OR g.min_budget <= $${paramIndex})`;
      params.push(parseInt(maxBudget));
      paramIndex++;
    }

    query += ' ORDER BY g.created_at DESC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      totalGigs: result.rows.length,
      gigs: result.rows.map(gig => ({
        id: gig.id,
        title: gig.title,
        description: gig.description,
        category: gig.category,
        requiredSkills: gig.required_skills,
        location: gig.is_remote ? 'Remote' : gig.location,
        isRemote: gig.is_remote,
        duration: gig.duration_days ? `${gig.duration_days} days` : 'Flexible',
        budget: gig.min_budget && gig.max_budget 
          ? `₹${gig.min_budget.toLocaleString()} - ₹${gig.max_budget.toLocaleString()}`
          : 'Negotiable',
        urgencyLevel: gig.urgency_level,
        status: gig.status,
        client: {
          name: gig.client_name,
          company: gig.client_company
        },
        createdAt: gig.created_at,
        startDate: gig.start_date
      }))
    });

  } catch (error) {
    console.error('Error fetching gigs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch gigs'
    });
  }
});

/**
 * GET /api/gigs/:id
 * Get a specific gig by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const gigId = parseInt(req.params.id);
    if (isNaN(gigId)) {
      return res.status(400).json({ error: 'Invalid gig ID' });
    }

    const result = await db.query(`
      SELECT g.*, c.name as client_name, c.email as client_email, 
             c.company as client_company, c.phone as client_phone
      FROM gigs g
      LEFT JOIN clients c ON g.client_id = c.id
      WHERE g.id = $1
    `, [gigId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    const gig = result.rows[0];

    res.json({
      success: true,
      gig: {
        id: gig.id,
        title: gig.title,
        description: gig.description,
        category: gig.category,
        requiredSkills: gig.required_skills,
        location: gig.location,
        isRemote: gig.is_remote,
        startDate: gig.start_date,
        endDate: gig.end_date,
        durationDays: gig.duration_days,
        budget: {
          min: gig.min_budget,
          max: gig.max_budget
        },
        stylePreferences: gig.style_preferences || [],
        additionalRequirements: gig.additional_requirements,
        urgencyLevel: gig.urgency_level,
        status: gig.status,
        client: {
          id: gig.client_id,
          name: gig.client_name,
          email: gig.client_email,
          company: gig.client_company,
          phone: gig.client_phone
        },
        createdAt: gig.created_at,
        updatedAt: gig.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching gig:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch gig'
    });
  }
});

/**
 * POST /api/gigs
 * Create a new gig
 */
router.post('/', async (req, res) => {
  try {
    const { error, value } = gigSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const {
      clientId, title, description, category, requiredSkills, location,
      isRemote, startDate, endDate, durationDays, minBudget, maxBudget,
      stylePreferences, additionalRequirements, urgencyLevel
    } = value;

    // Check if client exists
    const clientResult = await db.query('SELECT id FROM clients WHERE id = $1', [clientId]);
    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const result = await db.query(`
      INSERT INTO gigs (
        client_id, title, description, category, required_skills, location,
        is_remote, start_date, end_date, duration_days, min_budget, max_budget,
        style_preferences, additional_requirements, urgency_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      clientId, title, description, category, requiredSkills, location,
      isRemote, startDate, endDate, durationDays, minBudget, maxBudget,
      stylePreferences, additionalRequirements, urgencyLevel
    ]);

    const newGig = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Gig created successfully',
      gig: {
        id: newGig.id,
        title: newGig.title,
        category: newGig.category,
        location: newGig.is_remote ? 'Remote' : newGig.location,
        status: newGig.status
      }
    });

  } catch (error) {
    console.error('Error creating gig:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create gig'
    });
  }
});

/**
 * POST /api/gigs/clients
 * Create a new client
 */
router.post('/clients', async (req, res) => {
  try {
    const { error, value } = clientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const { name, email, company, phone, city, industry } = value;

    // Check if email already exists
    const existingClient = await db.query('SELECT id FROM clients WHERE email = $1', [email]);
    if (existingClient.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const result = await db.query(`
      INSERT INTO clients (name, email, company, phone, city, industry)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, email, company, phone, city, industry]);

    const newClient = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      client: {
        id: newClient.id,
        name: newClient.name,
        email: newClient.email,
        company: newClient.company
      }
    });

  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create client'
    });
  }
});

/**
 * GET /api/gigs/categories/stats
 * Get statistics about gig categories
 */
router.get('/categories/stats', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        category,
        COUNT(*) as gig_count,
        AVG(COALESCE(min_budget, max_budget, 0)) as avg_budget,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_gigs
      FROM gigs 
      GROUP BY category
      ORDER BY gig_count DESC
    `);

    res.json({
      success: true,
      categories: result.rows.map(row => ({
        category: row.category,
        gigCount: parseInt(row.gig_count),
        avgBudget: parseFloat(row.avg_budget || 0).toFixed(0),
        openGigs: parseInt(row.open_gigs)
      }))
    });

  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch category statistics'
    });
  }
});

module.exports = router;

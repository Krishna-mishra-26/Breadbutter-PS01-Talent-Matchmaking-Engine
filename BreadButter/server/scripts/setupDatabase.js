const db = require('../config/database');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

// Database schema setup
const setupDatabase = async () => {
  try {
    logger.info('🏗️  Setting up database schema...');

    // Create talents table
    await db.query(`
      CREATE TABLE IF NOT EXISTS talents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        city VARCHAR(100) NOT NULL,
        categories TEXT[] NOT NULL,
        skills TEXT[] NOT NULL,
        experience_years INTEGER DEFAULT 0,
        min_budget INTEGER,
        max_budget INTEGER,
        portfolio_links TEXT[],
        bio TEXT,
        instagram_handle VARCHAR(255),
        linkedin_url VARCHAR(255),
        website_url VARCHAR(255),
        availability_status VARCHAR(50) DEFAULT 'available',
        rating DECIMAL(3,2) DEFAULT 0.0,
        total_projects INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        embedding_text TEXT -- For storing embedding metadata
      );
    `);

    // Create clients table
    await db.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        company VARCHAR(255),
        phone VARCHAR(20),
        city VARCHAR(100),
        industry VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create gigs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS gigs (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        required_skills TEXT[] NOT NULL,
        location VARCHAR(255),
        is_remote BOOLEAN DEFAULT false,
        start_date DATE,
        end_date DATE,
        duration_days INTEGER,
        min_budget INTEGER,
        max_budget INTEGER,
        style_preferences TEXT[],
        additional_requirements TEXT,
        status VARCHAR(50) DEFAULT 'open',
        urgency_level VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        embedding_text TEXT -- For storing embedding metadata
      );
    `);

    // Create matches table
    await db.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        gig_id INTEGER REFERENCES gigs(id),
        talent_id INTEGER REFERENCES talents(id),
        overall_score DECIMAL(5,3) NOT NULL,
        skill_score DECIMAL(5,3),
        location_score DECIMAL(5,3),
        budget_score DECIMAL(5,3),
        experience_score DECIMAL(5,3),
        availability_score DECIMAL(5,3),
        semantic_score DECIMAL(5,3),
        explanation TEXT,
        status VARCHAR(50) DEFAULT 'suggested',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(gig_id, talent_id)
      );
    `);

    // Create feedback table
    await db.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES matches(id),
        client_id INTEGER REFERENCES clients(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        feedback_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await db.query('CREATE INDEX IF NOT EXISTS idx_talents_categories ON talents USING GIN(categories);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_talents_skills ON talents USING GIN(skills);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_talents_city ON talents(city);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_gigs_category ON gigs(category);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_matches_gig_id ON matches(gig_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_matches_talent_id ON matches(talent_id);');

    logger.info('✅ Database schema setup completed successfully');

    // Insert sample data
    await insertSampleData();

  } catch (error) {
    logger.error('❌ Error setting up database:', error);
    throw error;
  }
};

// Insert sample data for testing
const insertSampleData = async () => {
  try {
    logger.info('📊 Inserting sample data...');

    // Sample clients
    await db.query(`
      INSERT INTO clients (name, email, company, city, industry) VALUES
      ('Arjun Sharma', 'arjun@sustainablefashion.com', 'EcoStyle Brand', 'Mumbai', 'Fashion'),
      ('Priya Patel', 'priya@techstartup.com', 'InnovateTech', 'Bangalore', 'Technology'),
      ('Rahul Verma', 'rahul@foodbrand.com', 'Organic Delights', 'Delhi', 'Food & Beverage')
      ON CONFLICT (email) DO NOTHING;
    `);

    // Sample talents
    await db.query(`
      INSERT INTO talents (name, email, city, categories, skills, experience_years, min_budget, max_budget, portfolio_links, bio, instagram_handle) VALUES
      ('Kavya Menon', 'kavya@photographer.com', 'Goa', 
       ARRAY['Photography', 'Travel'], 
       ARRAY['Portrait Photography', 'Travel Photography', 'Natural Light', 'Candid Shots', 'Sustainable Fashion'], 
       3, 50000, 100000, 
       ARRAY['https://instagram.com/kavyalens', 'https://kavyamenon.com'],
       'Passionate travel photographer specializing in sustainable fashion and natural portraits. Based in Goa with 3+ years experience.',
       '@kavyalens'),
      
      ('Rohan Singh', 'rohan@designer.com', 'Mumbai',
       ARRAY['Design', 'UI/UX'],
       ARRAY['UI Design', 'Brand Identity', 'Mobile App Design', 'Figma', 'Adobe Creative Suite'],
       4, 75000, 150000,
       ARRAY['https://behance.net/rohansingh', 'https://rohandesigns.com'],
       'Senior UI/UX designer with expertise in mobile apps and brand identity. 4 years of startup experience.',
       '@rohandesigns'),
       
      ('Anisha Reddy', 'anisha@videographer.com', 'Hyderabad',
       ARRAY['Videography', 'Film'],
       ARRAY['Corporate Videos', 'Product Photography', 'Video Editing', 'Drone Photography', 'Commercial Shoots'],
       2, 60000, 120000,
       ARRAY['https://vimeo.com/anishareddy', 'https://anishacreates.com'],
       'Creative videographer specializing in corporate and product content. Drone certified with 2+ years experience.',
       '@anishacreates')
      ON CONFLICT (email) DO NOTHING;
    `);

    // Sample gigs
    await db.query(`
      INSERT INTO gigs (client_id, title, description, category, required_skills, location, is_remote, start_date, duration_days, min_budget, max_budget, style_preferences, additional_requirements) VALUES
      (1, 'Sustainable Fashion Campaign Shoot', 
       'Looking for a travel photographer in Goa for 3 days in November for a sustainable fashion brand. Need pastel tones and candid portraits.',
       'Photography',
       ARRAY['Travel Photography', 'Fashion Photography', 'Portrait Photography', 'Natural Light'],
       'Goa', false, '2024-11-15', 3, 70000, 90000,
       ARRAY['Pastel Tones', 'Candid Portraits', 'Natural Light', 'Sustainable Fashion'],
       'Must have experience with sustainable fashion brands. Portfolio review required.'),
       
      (2, 'Mobile App UI Design',
       'Need a UI/UX designer to create modern mobile app interface for a fintech startup. Clean, minimal design preferred.',
       'Design',
       ARRAY['UI Design', 'Mobile App Design', 'Figma', 'User Experience'],
       'Remote', true, '2024-12-01', 14, 80000, 120000,
       ARRAY['Minimal Design', 'Modern UI', 'Fintech Style'],
       'Must have fintech or financial app experience. Figma proficiency required.'),
       
      (3, 'Product Video Campaign',
       'Create engaging product videos for organic food brand launch. Need someone who can handle both shooting and editing.',
       'Videography',
       ARRAY['Product Photography', 'Video Editing', 'Commercial Shoots'],
       'Delhi', false, '2024-11-30', 5, 65000, 85000,
       ARRAY['Clean Aesthetics', 'Natural Lighting', 'Food Styling'],
       'Experience with food photography/videography essential. Should provide editing services.')
      ON CONFLICT DO NOTHING;
    `);

    logger.info('✅ Sample data inserted successfully');

  } catch (error) {
    logger.error('❌ Error inserting sample data:', error);
    throw error;
  }
};

// Run setup if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      logger.info('🎉 Database setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };

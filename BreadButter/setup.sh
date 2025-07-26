#!/bin/bash

echo "==============================================="
echo "🍞 BreadButter Talent Matchmaking Engine Setup"
echo "==============================================="
echo ""

echo "📦 Installing dependencies..."
echo ""

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install server dependencies  
echo "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "Installing client dependencies..."
cd client  
npm install
cd ..

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

echo "🔧 Setting up environment variables..."
# Copy .env.example to .env if it doesn't exist
if [ ! -f "server/.env" ]; then
    cp "server/.env.example" "server/.env"
    echo "✅ Created server/.env file from template"
    echo "⚠️  Please edit server/.env with your database credentials"
else
    echo "ℹ️  server/.env already exists"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Edit server/.env with your database credentials"
echo "2. Create PostgreSQL database: createdb breadbutter_db"
echo "3. Run: npm run setup:db"
echo "4. Run: npm run dev"
echo ""
echo "🚀 Setup complete! Happy coding!"
echo ""

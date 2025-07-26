@echo off
echo ===============================================
echo 🍞 BreadButter Talent Matchmaking Engine Setup
echo ===============================================
echo.

echo 📦 Installing dependencies...
echo.

REM Install root dependencies
echo Installing root dependencies...
call npm install

REM Install server dependencies  
echo Installing server dependencies...
cd server
call npm install
cd ..

REM Install client dependencies
echo Installing client dependencies...
cd client  
call npm install
cd ..

echo.
echo ✅ Dependencies installed successfully!
echo.

echo 🔧 Setting up environment variables...
REM Copy .env.example to .env if it doesn't exist
if not exist "server\.env" (
    copy "server\.env.example" "server\.env"
    echo ✅ Created server/.env file from template
    echo ⚠️  Please edit server/.env with your database credentials
) else (
    echo ℹ️  server/.env already exists
)

echo.
echo 📋 Next Steps:
echo 1. Edit server/.env with your database credentials
echo 2. Create PostgreSQL database: createdb breadbutter_db
echo 3. Run: npm run setup:db
echo 4. Run: npm run dev
echo.
echo 🚀 Setup complete! Happy coding!
echo.
pause

#!/bin/bash

echo "=================================="
echo "SafetyMindPro Full Stack Setup"
echo "=================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi
echo "✅ Python found: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16.x or higher."
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

echo ""
echo "Setting up Backend..."
echo "====================="

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt
pip3 install pyyaml

# Initialize database
echo "🗄️  Initializing database..."
cd backend
python3 -c "from database import Base, engine; Base.metadata.create_all(bind=engine)" 2>/dev/null || echo "Database already exists"
cd ..

echo ""
echo "Setting up Frontend..."
echo "======================"

# Install Node dependencies
cd frontend
echo "📦 Installing Node.js dependencies (this may take a few minutes)..."
npm install

cd ..

echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  uvicorn app:app --reload"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "The app will open at http://localhost:3000"
echo "API docs available at http://localhost:8000/docs"
echo ""

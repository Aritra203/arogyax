#!/bin/bash

echo "🚀 Arogya X Deployment Setup"
echo "============================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git branch -M main
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📁 Creating .gitignore..."
    cat > .gitignore << EOF
node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store
EOF
fi

echo "📦 Installing dependencies..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend && npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install
cd ..

# Install admin dependencies
echo "Installing admin dependencies..."
cd admin && npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env in each folder and fill in your values"
echo "2. Push your code to GitHub"
echo "3. Deploy to Render following the DEPLOYMENT.md guide"
echo ""
echo "📖 Check DEPLOYMENT.md for detailed deployment instructions"

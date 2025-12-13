#!/bin/bash

# Blood Donation App - Quick Start Script
# This script helps you set up and run the application quickly

echo "🩸 Blood Donation App - Quick Start"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${RED}⚠️  IMPORTANT: Edit .env and add your database credentials!${NC}"
    echo ""
    read -p "Press enter to continue after editing .env file..."
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Check if Prisma Client is generated
echo ""
echo -e "${BLUE}🔧 Generating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma Client generated${NC}"

# Ask if user wants to run migrations
echo ""
read -p "Do you want to run database migrations? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${BLUE}🗄️  Running database migrations...${NC}"
    npx prisma migrate dev --name initial_migration
    echo -e "${GREEN}✅ Migrations completed${NC}"
    
    # Ask if user wants to seed database
    echo ""
    read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        echo -e "${BLUE}🌱 Seeding database...${NC}"
        npm run prisma:seed
        echo -e "${GREEN}✅ Database seeded${NC}"
        echo ""
        echo -e "${BLUE}📝 Default Admin Credentials:${NC}"
        echo "Email: admin@student.sust.edu"
        echo "Password: admin123"
    fi
fi

# Start the development server
echo ""
echo -e "${GREEN}🚀 Starting development server...${NC}"
echo ""
echo "Your app will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev

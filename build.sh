#!/usr/bin/env bash

# Exit on any error
set -e

echo "Starting build process..."

# 1. Build the frontend
echo "Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Install backend dependencies
echo "Installing Backend Dependencies..."
cd backend
pip install -r requirements.txt
cd ..

echo "Build complete!"

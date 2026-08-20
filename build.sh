#!/usr/bin/env bash

# Exit on any error
set -e

echo "Starting build process..."

# 1. Build the frontend
echo "Building Frontend..."
cd Frontend
npm install
npm run build
cd ..

# 2. Install backend dependencies
echo "Installing Backend Dependencies..."
cd Backend
pip install -r requirements.txt
cd ..

echo "Build complete!"

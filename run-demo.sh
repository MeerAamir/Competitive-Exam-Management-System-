#!/bin/bash
echo "Starting Competitive Exam System Demo..."

# Seed Database
echo "Seeding Database..."
cd server
node seed.js
cd ..

# Start Server and Client
echo "Starting Server and Client..."
# Use concurrently if available, or simple backgrounding
# For simplicity in this script without extra deps:
(cd server && npm start) &
(cd client && npm start) &

wait

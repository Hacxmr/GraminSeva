#!/bin/bash

echo "Starting GraminSeva Application..."
echo ""

# Start Backend
echo "[1/2] Starting Backend Server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start Frontend
echo "[2/2] Starting Frontend Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "==================================="
echo "GraminSeva Started Successfully!"
echo "==================================="
echo "Backend:  http://localhost:5001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

#!/bin/bash

echo "=================================="
echo "🚀 SafetyMindPro Launcher"
echo "=================================="
echo ""

# Check if in correct directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the safetymindpro-main directory"
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Kill existing processes if needed
if check_port 8000; then
    echo "⚠️  Port 8000 is in use. Killing existing process..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 1
fi

if check_port 3000; then
    echo "⚠️  Port 3000 is in use. Killing existing process..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 1
fi

echo "🔧 Starting Backend Server..."
cd backend
python3 -m uvicorn app:app --reload --host 127.0.0.1 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "   Backend PID: $BACKEND_PID"
echo "   Waiting for backend to start..."
sleep 3

# Check if backend started
if check_port 8000; then
    echo "   ✅ Backend running at http://127.0.0.1:8000"
else
    echo "   ❌ Backend failed to start. Check backend.log"
    exit 1
fi

echo ""
echo "🎨 Starting Frontend Server..."
cd frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "   Frontend PID: $FRONTEND_PID"
echo "   Waiting for frontend to start..."
sleep 5

# Check if frontend started
if check_port 3000; then
    echo "   ✅ Frontend running at http://localhost:3000"
else
    echo "   ❌ Frontend failed to start. Check frontend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "=================================="
echo "✅ SafetyMindPro is running!"
echo "=================================="
echo ""
echo "📊 Backend API:  http://127.0.0.1:8000"
echo "📊 API Docs:     http://127.0.0.1:8000/docs"
echo "🎨 Frontend:     http://localhost:3000"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers..."
echo ""

# Save PIDs
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Wait for interrupt
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; echo '✅ Stopped'; exit 0" INT

# Keep script running
wait

#!/bin/bash

set -e

echo "🚀 Starting Redis..."
redis-server &
REDIS_PID=$!

echo "🐳 Starting Docker services..."
docker-compose up &
DOCKER_PID=$!

# echo "⚡ Starting FastAPI..."
# uvicorn backend.app:app \
#     --reload \
#     --host 127.0.0.1 \
#     --port 8000 &
# UVICORN_PID=$!

echo "📨 Starting Kafka consumers..."
python backend/kafka_jobs/run_consumers.py &
KAFKA_PID=$!

echo "🌐 Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Everything is running!"
echo "Press Ctrl+C to stop all services."

cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    # kill $UVICORN_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    kill $KAFKA_PID 2>/dev/null
    kill $DOCKER_PID 2>/dev/null
    kill $REDIS_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

wait
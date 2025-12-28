# Use an official Node.js runtime as a base image
FROM node:20

# Install system dependencies including gcc for C++ compilation and other utilities
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    dos2unix \
    supervisor \
    postgresql-client \
    redis-tools \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Define build-time variables for Backend
ARG PORT
ARG CORS_ORIGIN
ARG JWT_SECRET_KEY
ARG JUDGE0_URL
ARG DB_USERNAME
ARG DB_PASSWORD
ARG MONGODB_URI
ARG PING_BOT_DURATION
ARG MEMORY_LIMIT
ARG GEMINI_API_KEY

# Set environment variables using build-time variables
ENV PORT=${PORT:-8080}
ENV PORT=${PORT:-8080}
ENV CORS_ORIGIN=${CORS_ORIGIN}
ENV JWT_SECRET_KEY=${JWT_SECRET_KEY}
ENV JUDGE0_URL=${JUDGE0_URL}
ENV DB_USERNAME=${DB_USERNAME}
ENV DB_PASSWORD=${DB_PASSWORD}
ENV DB_PASS=${DB_PASSWORD}
ENV MONGODB_URI=${MONGODB_URI:-mongodb://root:mongoadmin@mongodb:27017/?authSource=admin}
ENV PING_BOT_DURATION=${PING_BOT_DURATION:-300000}
ENV MEMORY_LIMIT=${MEMORY_LIMIT:-31457280}
ENV GEMINI_API_KEY=${GEMINI_API_KEY}

# Judge0 Environment Variables
ENV REDIS_PASSWORD=judge0_redis_pass
ENV POSTGRES_USER=judge0
ENV POSTGRES_PASSWORD=judge0_db_pass
ENV POSTGRES_DB=judge0

# Set the working directory for backend
WORKDIR /app

# Copy Backend contents
COPY Backend/ .

# Copy Frontend Folder
COPY Frontend/ ./Frontend

# Build Frontend
WORKDIR /app/Frontend
RUN echo "REACT_APP_SERVER_URL=http://localhost:${PORT}" >> .env && \
    echo "REACT_APP_SERVER_WS_URL=ws://localhost:${PORT}" >> .env && \
    npm install && \
    npm run build && \
    cp -r /app/Frontend/build /app/build

# Setup Backend
WORKDIR /app
RUN rm -r /app/Frontend && \
    npm install && \
    mkdir -p public/TemporaryCodeBase && \
    dos2unix src/Code/script.sh && \
    chmod +x src/Code/script.sh

# Clone and setup Judge0 Worker
WORKDIR /judge0
RUN git clone --depth 1 --branch v1.13.1 https://github.com/judge0/judge0.git . && \
    # Install Ruby and dependencies for Judge0
    apt-get update && apt-get install -y \
    ruby \
    ruby-dev \
    build-essential \
    && gem install bundler && \
    bundle install && \
    rm -rf /var/lib/apt/lists/*

# Create supervisor configuration to run both backend and judge0 worker
RUN mkdir -p /var/log/supervisor

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose ports
# Backend API port
EXPOSE ${PORT:-8080}
# Judge0 server port (if needed)
EXPOSE 2358

# Start both services using supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
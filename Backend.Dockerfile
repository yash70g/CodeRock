FROM node:20

# Install gcc to compile C++ code
RUN apt-get update && \
    apt-get install -y gcc g++ && \
    apt-get install -y dos2unix

# Define build-time variables
ARG PORT=8080
ARG CORS_ORIGIN=http://localhost:3000
ARG DB_USERNAME
ARG DB_PASSWORD
ARG BackendHost
ARG JWT_SECRET_KEY
ARG GEMINI_API_KEY
ARG PingBotDuration
ARG MemoryLimitForOutputFileInBytes
ARG Server

# Set environment variables
ENV PORT=${PORT}
ENV CORS_ORIGIN=${CORS_ORIGIN}
ENV DB_USERNAME=${DB_USERNAME}
ENV DB_PASSWORD=${DB_PASSWORD}
ENV BackendHost=${BackendHost}
ENV JWT_SECRET_KEY=${JWT_SECRET_KEY}
ENV GEMINI_API_KEY=${GEMINI_API_KEY}
ENV PingBotDuration=${PingBotDuration}
ENV MemoryLimitForOutputFileInBytes=${MemoryLimitForOutputFileInBytes}
ENV Server=${Server}

# Set the working directory
WORKDIR /app

# Copy Backend code
COPY Backend/ .

# Install Node.js dependencies
RUN npm install

# Make public/TemporaryCodeBase folder
RUN mkdir -p public/TemporaryCodeBase

# Fix line ending issues
RUN dos2unix src/Code/script.sh

# Make script executable
RUN chmod +x src/Code/script.sh

# Expose the port
EXPOSE 8080

# Run the application
CMD ["npm", "start"]

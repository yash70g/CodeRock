# Docker Compose Setup

This Docker Compose configuration sets up the entire application stack with self-hosted Judge0 instance.

## Services

- **Frontend** (React) - Port 3000
- **Backend** (Node.js) - Port 8080
- **MongoDB** - Port 27017
- **Judge0 Server** - Port 2358 (code execution API)
- **PostgreSQL** - Judge0 database
- **Redis** - Judge0 queue/caching
- **Judge0 Worker** - Code execution worker

## Prerequisites

- Docker installed
- Docker Compose installed

## Setup Instructions

1. **Clone/Setup the repository**
   ```bash
   cd /path/to/project
   ```

2. **Create `.env` file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update with your actual values:
   ```env
   DB_USERNAME=your_mongo_username
   DB_PASSWORD=your_mongo_password
   BackendHost=mongodb://mongo:27017/yourdb
   JWT_SECRET_KEY=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   JUDGE0_DB_USER=judge0
   JUDGE0_DB_PASSWORD=judge0pass
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

   This will:
   - Build and start the backend service
   - Build and start the frontend service
   - Start MongoDB
   - Start PostgreSQL and Redis
   - Start Judge0 server and worker

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Judge0 API: http://localhost:2358

## Stopping the Application

```bash
docker-compose down
```

To also remove volumes (database data):
```bash
docker-compose down -v
```

## Environment Variables

### MongoDB
- `DB_USERNAME` - MongoDB root username
- `DB_PASSWORD` - MongoDB root password

### Backend
- `JWT_SECRET_KEY` - Secret key for JWT authentication
- `GEMINI_API_KEY` - Google Gemini API key for AI features
- `PingBotDuration` - Duration for ping bot (default: 300000ms)
- `MemoryLimitForOutputFileInBytes` - Memory limit (default: 52428800 bytes)
- `Server` - Environment (production/development)

### Judge0
- `JUDGE0_DB_USER` - PostgreSQL username for Judge0
- `JUDGE0_DB_PASSWORD` - PostgreSQL password for Judge0

## Backend Integration

The backend is configured to use the self-hosted Judge0 instance at:
```
http://judge0-server:2358
```

You can access the Judge0 API documentation at: http://localhost:2358/docs (when running)

## Useful Commands

### View logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f judge0-server
```

### Restart a specific service
```bash
docker-compose restart backend
```

### Scale Judge0 workers
To run multiple workers, modify the `docker-compose.yml` and add more worker services with different container names.

## Troubleshooting

### Judge0 connection errors
- Ensure postgres and redis containers are healthy before judge0-server starts
- Check Judge0 logs: `docker-compose logs judge0-server`

### MongoDB connection errors
- Verify `BackendHost` environment variable is correct
- Check MongoDB logs: `docker-compose logs mongo`

### Frontend API connection errors
- Verify backend is running: `docker-compose logs backend`
- Check `REACT_APP_SERVER_URL` is set correctly

## Database Persistence

- MongoDB data is stored in `mongo-data` volume
- PostgreSQL data is stored in `postgres-data` volume
- These persist across container restarts
- Use `docker-compose down -v` to delete all data

# 🐳 Docker Setup Guide for MCCS E-commerce Fraud Detection

This guide will help you set up and run the MCCS Fraud Detection application using Docker.

## 📋 Prerequisites

- Docker Desktop installed (Windows/Mac) or Docker Engine (Linux)
- Docker Compose (comes with Docker Desktop)
- Git (to clone the repository)

## 🏗️ Architecture Overview

The application consists of three main services:
1. **Frontend**: React + Vite application served by Nginx (Port 80)
2. **Backend**: Node.js + Express API with Socket.io (Port 9000)
3. **MongoDB**: Database for storing application data (Port 27017)

All services run in isolated containers and communicate through a Docker network.

## 🚀 Quick Start

### Step 1: Create Environment File

Create a `.env` file in the project root directory:

```bash
# Copy and paste this into a new file named .env
NODE_ENV=production
BACKEND_PORT=9000
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=YourSecurePasswordHere123!
MONGO_DATABASE=mccs_fraud_detection
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
FRONTEND_URL=http://localhost:80
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
```

**Important**: Replace the default values with secure credentials!

### Step 2: Build Docker Images

```bash
# Build all images
docker-compose build

# Or build specific services
docker-compose build backend
docker-compose build frontend
```

### Step 3: Start All Services

```bash
# Start in detached mode (background)
docker-compose up -d

# Or start with logs visible
docker-compose up
```

### Step 4: Verify Services are Running

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Step 5: Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:9000/mccs
- **MongoDB**: localhost:27017 (use MongoDB Compass or similar tools)

## 🛠️ Common Docker Commands

### Managing Services

```bash
# Stop all services
docker-compose stop

# Start stopped services
docker-compose start

# Restart services
docker-compose restart

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (WARNING: deletes database data)
docker-compose down -v
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# View last 100 lines
docker-compose logs --tail=100
```

### Rebuilding After Code Changes

```bash
# Rebuild and restart specific service
docker-compose up -d --build backend

# Rebuild all services
docker-compose up -d --build

# Force rebuild without cache
docker-compose build --no-cache
```

### Accessing Container Shell

```bash
# Access backend container
docker exec -it mccs-backend sh

# Access frontend container
docker exec -it mccs-frontend sh

# Access MongoDB container
docker exec -it mccs-mongodb mongosh
```

## 📊 Database Management

### Connect to MongoDB

```bash
# Using mongosh inside container
docker exec -it mccs-mongodb mongosh -u admin -p adminpassword --authenticationDatabase admin

# View databases
show dbs

# Use the application database
use mccs_fraud_detection

# View collections
show collections

# Query users
db.users.find()
```

### Backup Database

```bash
# Create backup
docker exec mccs-mongodb mongodump --uri="mongodb://admin:adminpassword@localhost:27017/mccs_fraud_detection?authSource=admin" --out=/data/backup

# Copy backup to host
docker cp mccs-mongodb:/data/backup ./mongodb_backup
```

### Restore Database

```bash
# Copy backup to container
docker cp ./mongodb_backup mccs-mongodb:/data/restore

# Restore database
docker exec mccs-mongodb mongorestore --uri="mongodb://admin:adminpassword@localhost:27017/mccs_fraud_detection?authSource=admin" /data/restore
```

## 🔧 Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Windows
netstat -ano | findstr :80
netstat -ano | findstr :9000
netstat -ano | findstr :27017

# Kill process by PID
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :80
lsof -i :9000
lsof -i :27017

# Kill process
kill -9 <PID>
```

Or change ports in `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Change host port to 8080
```

### Container Fails to Start

```bash
# View detailed logs
docker-compose logs <service-name>

# Check container status
docker ps -a

# Inspect container
docker inspect mccs-backend
```

### Database Connection Issues

1. Ensure MongoDB container is healthy:
   ```bash
   docker-compose ps
   ```

2. Check MongoDB logs:
   ```bash
   docker-compose logs mongodb
   ```

3. Verify connection string in `.env` matches MongoDB credentials

### Frontend Can't Connect to Backend

1. Check backend is running:
   ```bash
   curl http://localhost:9000/api/test
   ```

2. Check nginx configuration:
   ```bash
   docker exec mccs-frontend cat /etc/nginx/conf.d/default.conf
   ```

3. Verify backend logs for errors:
   ```bash
   docker-compose logs backend
   ```

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use strong passwords** - Especially for production
3. **Change JWT_SECRET** - Use a long, random string
4. **Update MongoDB credentials** - Don't use default passwords
5. **Use HTTPS in production** - Configure SSL/TLS certificates

## 📦 Volume Management

Docker volumes persist data even when containers are removed:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect mccs-e-commerce-fraud-detection_mongodb_data

# Remove unused volumes (WARNING: data loss!)
docker volume prune

# Backup volume
docker run --rm -v mccs-e-commerce-fraud-detection_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb_backup.tar.gz /data
```

## 🌐 Production Deployment

For production deployment:

1. **Use environment-specific `.env` file**
2. **Configure reverse proxy** (Nginx/Apache) on host
3. **Set up SSL certificates** (Let's Encrypt)
4. **Configure firewall rules**
5. **Set up monitoring** (Prometheus, Grafana)
6. **Configure backup strategy**
7. **Use Docker secrets** for sensitive data
8. **Enable Docker resource limits**

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 🐛 Development Mode

For development with hot-reload, you can override the docker-compose configuration:

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  backend:
    command: npm start  # Uses nodemon
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      NODE_ENV: development

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev  # Create this for development
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev
    ports:
      - "5173:5173"
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 📈 Monitoring

### Health Checks

All services have health checks configured. View health status:

```bash
docker-compose ps
```

### Resource Usage

```bash
# View resource usage
docker stats

# View specific container
docker stats mccs-backend
```

## 🔄 CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Docker Build and Push

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker images
        run: docker-compose build
      
      - name: Run tests
        run: docker-compose run backend npm test
      
      - name: Push to registry
        run: |
          docker-compose push
```

## 📞 Support

If you encounter issues:
1. Check this documentation
2. Review logs: `docker-compose logs -f`
3. Check GitHub issues
4. Contact the development team

## 🎉 Success!

Your MCCS Fraud Detection application should now be running in Docker containers!

Access the application at: http://localhost


# Backend Dockerfile with Node.js and Python support
FROM node:18-alpine

# Install Python, pip, and build dependencies for Python packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    python3-dev \
    openblas-dev \
    gfortran \
    lapack-dev \
    cmake

# Create Python virtual environment and install requirements
WORKDIR /app

# Copy Python requirements first
COPY requirements.txt ./

# Install Python dependencies
# Note: --break-system-packages is safe in Docker containers (isolated environment)
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy application code
COPY . .

# Ensure ml_models directory exists and has correct permissions
RUN mkdir -p /app/ml_models && chmod 755 /app/ml_models

# Expose the port your backend runs on (port 9000 based on your API_URL)
EXPOSE 9000

# Start the application using node (not nodemon for production)
CMD ["node", "index.js"]


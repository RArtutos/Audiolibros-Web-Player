# Stage 1: Build the Node.js app
FROM node:20-slim as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Set up Python and NGINX
FROM python:3.9-slim

# Install NGINX
RUN apt-get update && \
    apt-get install -y nginx && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python requirements and install dependencies
COPY server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python server code
COPY server/ ./server/
COPY public/data/ ./public/data/

# Copy built frontend from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create startup script
RUN echo '#!/bin/bash\n\
nginx &\n\
cd /app && uvicorn server.main:app --host 0.0.0.0 --port 8000\n\
' > /start.sh && chmod +x /start.sh

# Expose ports
EXPOSE 31110 8000

# Start NGINX and Python server
CMD ["/start.sh"]
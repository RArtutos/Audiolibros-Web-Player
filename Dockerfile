FROM node:20-slim as builder

# Increase Node.js memory limit
ENV NODE_OPTIONS="--max-old-space-size=8192"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Ensure data directory exists
RUN mkdir -p /app/public/data

# Move the large JSON to public directory before build
RUN if [ -f "/app/src/data/consolidated_data.json" ]; then \
    mv /app/src/data/consolidated_data.json /app/public/data/; \
    fi

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.25-alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public/data /usr/share/nginx/html/data

# Create cache directories and set permissions
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chmod -R 755 /var/cache/nginx

# Use non-root user
USER nginx

# Expose port 31110
EXPOSE 31110

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
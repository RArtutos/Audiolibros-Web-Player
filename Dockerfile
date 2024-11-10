FROM node:20-slim as builder

# Increase Node.js memory limit
ENV NODE_OPTIONS="--max-old-space-size=8192"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code EXCEPT large JSON
COPY . .

# Remove the large JSON from src to prevent bundling
RUN mkdir -p /app/public/data && \
    mv /app/src/data/consolidated_data.json /app/public/data/

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.25-alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public/data /usr/share/nginx/html/data

# Expose port 31110
EXPOSE 31110

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
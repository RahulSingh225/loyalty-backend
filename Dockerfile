# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json (if it exists)
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build the application
RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine

WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Copy package.json and package-lock.json (if it exists)
COPY package.json ./
COPY package-lock.json* ./

# Install production dependencies
RUN npm ci --production

# Copy environment file
COPY .env ./

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]
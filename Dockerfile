# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the frontend (Defaults to SERVER_BASED mode)
RUN npm run build

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built assets from stage 1
COPY --from=builder /app/dist ./dist
# Copy the server code
COPY --from=builder /app/server ./server

# Create data directory for SQLite
RUN mkdir -p data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4173

# Expose the port
EXPOSE 4173

# Start the server
CMD ["node", "server/app.js"]

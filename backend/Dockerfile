# Backend Dockerfile
FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy remaining files
COPY . .

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "server.js"]

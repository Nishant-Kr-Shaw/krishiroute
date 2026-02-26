# Frontend Dockerfile
# Stage 1: Build
FROM node:18-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy build files from stage 1
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx config if needed, or use default
# EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

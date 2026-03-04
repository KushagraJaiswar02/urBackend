# ── Stage: Production ─────────────────────────────────────────────────────────
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Expose backend port
EXPOSE 1234

# Start the server
CMD ["node", "app.js"]

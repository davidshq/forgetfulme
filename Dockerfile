FROM mcr.microsoft.com/playwright:v1.54.0-noble
WORKDIR /work

# Install dependencies first for caching
COPY package*.json ./
RUN npm ci && npx playwright install chromium

# Copy source files needed for tests
COPY src/ ./src/
COPY tests/ ./tests/
COPY playwright.config.js ./
COPY vitest.config.js ./
COPY scripts/ ./scripts/

# Generate Supabase bundle
RUN npm run bundle:supabase

# Default to shell for interactive use; CI can override CMD
CMD ["bash"]

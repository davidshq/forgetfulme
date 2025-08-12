FROM mcr.microsoft.com/playwright:v1.54.0-noble
WORKDIR /work

# Install dependencies first for caching
COPY package*.json ./
RUN npm ci && npx playwright install chromium

# Copy the rest of the repo
COPY . .

# Default to shell for interactive use; CI can override CMD
CMD ["bash"]

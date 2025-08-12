# Docker Testing Workflow

This project uses Docker for consistent testing across different environments. The Docker setup has been optimized for speed by pre-installing dependencies and browsers.

## Quick Start

### First Time Setup
```bash
# Build the Docker image with all dependencies pre-installed
npm run docker:build:ps
```

### Running Tests
```bash
# Run visual tests (fast - no dependency installation)
npm run docker:test:visual:ps

# Run unit tests
npm run docker:test:unit:ps

# Update visual test snapshots
npm run docker:test:visual:update:ps

# Generate test report
npm run docker:test:visual:report:ps
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run docker:build:ps` | Build the Docker image with dependencies |
| `npm run docker:rebuild:ps` | Rebuild Docker image without cache |
| `npm run docker:clean:ps` | Clean up Docker images and containers |
| `npm run docker:shell:ps` | Open interactive shell in container |
| `npm run docker:test:unit:ps` | Run unit tests |
| `npm run docker:test:visual:ps` | Run visual tests |
| `npm run docker:test:visual:update:ps` | Update visual test snapshots |
| `npm run docker:test:visual:report:ps` | Run tests and show report |

## Performance Benefits

- **Fast**: No dependency installation on each run
- **Consistent**: Same environment across all machines
- **Isolated**: Tests run in clean container environment
- **Cached**: Docker layers are cached for faster rebuilds

## When to Rebuild

Rebuild the Docker image when:
- `package.json` dependencies change
- `Dockerfile` is modified
- You want to ensure a clean environment

```bash
npm run docker:rebuild:ps
```

## Troubleshooting

### Clean up Docker resources
```bash
npm run docker:clean:ps
```

### Check Docker image
```bash
docker images | grep forgetfulme-test
```

### View container logs
```bash
docker logs <container-id>
```

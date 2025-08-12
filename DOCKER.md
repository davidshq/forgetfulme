# Docker Usage — ForgetfulMe v2

This repo includes Docker targets to run tests (including visual screenshots) without installing Node locally.

## Image
- Base image: `mcr.microsoft.com/playwright:v1.54.0-noble` (includes Node, npm, and browsers).

## Prerequisites
- Docker installed (Docker Desktop or similar).

## Common Commands
- PowerShell via npm (Windows):
  - Open shell: `npm run docker:shell:ps`
  - Install deps: `npm run docker:npm:ci:ps`
  - Unit tests: `npm run docker:test:unit:ps`
  - Visual tests: `npm run docker:test:visual:ps`
  - Update baselines: `npm run docker:test:visual:update:ps`
  - View report: `npm run docker:test:visual:report:ps`

Make targets (optional):
- Open shell: `make docker-shell`
- Install deps: `make docker-npm-ci`
- Unit tests: `make docker-test-unit`
- Visual tests: `make docker-test-visual`
- Update baselines: `make docker-test-visual-update`
- View report: `make docker-test-visual-report`

Notes
- Commands run as root inside the container for Windows volume mount compatibility.
- Tests run headless inside the container with a fixed viewport; baselines are stored in the repo (under `tests/visual/__screenshots__`).
- If you see font diffs across platforms, consider committing a deterministic font stack in CSS (we can add this if needed).

Advanced
- You can also build a local dev image with dependencies baked in: `docker build -t forgetfulme-dev -f Dockerfile .` then run `docker run --rm -it -v "$PWD":/work -w /work forgetfulme-dev bash`.

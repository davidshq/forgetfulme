IMAGE=mcr.microsoft.com/playwright:v1.54.0-noble
WORKDIR=/work
DOCKER_RUN=docker run --rm -it --user root -v "$(PWD)":$(WORKDIR) -w $(WORKDIR) $(IMAGE)

.PHONY: docker-shell docker-npm-ci docker-test-unit docker-test-visual docker-test-visual-update docker-test-visual-report

docker-shell:
	$(DOCKER_RUN) bash

docker-npm-ci:
	$(DOCKER_RUN) bash -lc "npm ci && npx playwright install chromium"

docker-test-unit:
	$(DOCKER_RUN) bash -lc "npm ci && npm test"

docker-test-visual:
	$(DOCKER_RUN) bash -lc "npm ci && npx playwright install chromium && npm run test:visual"

docker-test-visual-update:
	$(DOCKER_RUN) bash -lc "npm ci && npx playwright install chromium && npm run test:visual:update"

docker-test-visual-report:
	$(DOCKER_RUN) bash -lc "npm ci && npx playwright install chromium && npm run test:visual:report"

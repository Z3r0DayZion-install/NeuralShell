.PHONY: help install test lint build start dev clean docker-build docker-run

help:
	@echo "NeuralShell Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  install      - Install dependencies"
	@echo "  test         - Run all tests"
	@echo "  lint         - Run linter"
	@echo "  build        - Build project"
	@echo "  start        - Start production server"
	@echo "  dev          - Start development server"
	@echo "  clean        - Clean build artifacts"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run Docker container"

install:
	npm install

test:
	npm test

lint:
	npm run lint

build:
	npm run build

start:
	node production-server.js

dev:
	node enhanced-server.js

clean:
	rm -rf dist/
	rm -rf node_modules/

docker-build:
	docker build -t neuralshell:latest .

docker-run:
	docker-compose up

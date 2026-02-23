# Changelog

All notable changes to NeuralShell will be documented in this file.

## [2.0.0] - 2026-02-18

### Added
- **Mode-based routing**: strict, balanced, creative, and uncensored modes
- **12 LLM provider adapters**: OpenAI, Anthropic, Google, Cohere, Mistral, Azure, Bedrock, Ollama, LocalAI, TogetherAI, Groq, Perplexity
- **Production server** with all features integrated
- **Redis support** for caching and rate limiting
- **WebSocket support** for real-time communication
- **GraphQL API** for flexible queries
- **OAuth2/OIDC/JWT authentication**
- **Multitenancy support**
- **Cost tracking and billing**
- **Plugin system** for extensibility
- **Chaos engineering** for testing resilience
- **8 load balancing strategies**: round-robin, least-connections, weighted, random, ip-hash, least-response-time, health-based, priority, adaptive
- **SSE streaming** support
- **Prometheus metrics** exporter
- **OpenAPI spec** generator
- **TypeScript, Python, Go SDKs**
- **Kubernetes deployment** manifests

### Changed
- Modularized router architecture
- Improved circuit breaker implementation
- Enhanced connection pooling
- Better error handling and logging

### Fixed
- Numerous bug fixes and improvements

## [1.0.0] - 2024-01-01

### Added
- Initial release
- Basic AI router with failover
- OpenAI integration
- Rate limiting
- Admin API

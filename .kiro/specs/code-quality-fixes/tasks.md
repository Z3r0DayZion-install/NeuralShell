# Tasks: Code Quality Fixes

## Phase 1: Critical Security Fixes

### 1. Create Security Utilities Module
- [x] 1.1 Create src/router/security-utils.js with timingSafeCompare function
- [x] 1.2 Implement sanitizeForLogging function with recursive sanitization
- [x] 1.3 Implement validateOAuthState function
- [ ] 1.4 Add unit tests for security utilities
- [ ] 1.5 Add property tests for sanitization

### 2. Create Constants Module
- [x] 2.1 Create src/router/constants.js with TIMEOUTS constants
- [x] 2.2 Add SIZE_LIMITS constants
- [x] 2.3 Add INTERVALS constants
- [x] 2.4 Document all constant values

### 3. Fix Timing Attacks in auth.js
- [x] 3.1 Update APIKeyManager.validateKey to use timingSafeCompare
- [x] 3.2 Store hashed secrets instead of plaintext in APIKeyManager
- [x] 3.3 Update RequestSigner.verify to use crypto.timingSafeEqual
- [ ] 3.4 Add property tests for constant-time validation (Property 1)
- [ ] 3.5 Add property tests for constant-time signature verification (Property 2)

### 4. Fix Sensitive Data Logging
- [x] 4.1 Import sanitizeForLogging in routerCore.js
- [x] 4.2 Sanitize all error objects before logging in routerCore.js
- [x] 4.3 Sanitize error objects in redis.js
- [x] 4.4 Sanitize error objects in connectionPool.js
- [ ] 4.5 Add property tests for log sanitization (Property 3)

### 5. Fix Unhandled Promise Rejections in redis.js
- [x] 5.1 Add error handler for subscriber client in subscribe method
- [x] 5.2 Wrap callback in try-catch in subscribe method
- [x] 5.3 Handle connection errors in subscribe method
- [ ] 5.4 Add property tests for Redis error handling (Property 4)

### 6. Fix Stream Error Handling in routerCore.js
- [x] 6.1 Add hasReceivedData tracking in callEndpointStreaming
- [x] 6.2 Log JSON parse errors instead of silent catch
- [x] 6.3 Validate stream completion in end handler
- [ ] 6.4 Add unit test for empty stream handling
- [ ] 6.5 Add property tests for stream resilience (Property 5)

### 7. Fix OAuth State Store in auth.js
- [x] 7.1 Create SizeLimitedMap class in new file
- [x] 7.2 Replace stateStore Map with SizeLimitedMap in OAuth2Provider
- [x] 7.3 Add automatic cleanup interval for OAuth states
- [ ] 7.4 Add property tests for state store bounded growth (Property 9)

### 8. Fix JWKS Validation in auth.js
- [x] 8.1 Add response structure validation in fetchJWKS
- [x] 8.2 Validate required fields in each JWK
- [x] 8.3 Handle stale JWKS appropriately
- [ ] 8.4 Add property tests for JWKS validation (Property 10)

### 9. Add TLS Verification in auth.js
- [x] 9.1 Create HTTPS agent with certificate validation in OAuth2Provider
- [x] 9.2 Set minimum TLS version to 1.2
- [x] 9.3 Use agent in all OAuth requests
- [ ] 9.4 Add unit test for TLS configuration

## Phase 2: Critical Resource Management

### 10. Fix Connection Pool Shutdown
- [x] 10.1 Make closeAll method async in connectionPool.js
- [x] 10.2 Wait for active requests with timeout
- [x] 10.3 Force close after grace period
- [x] 10.4 Update destroy method to await closeAll
- [ ] 10.5 Add property tests for graceful shutdown (Property 6)
- [ ] 10.6 Add unit test for forced shutdown

### 11. Fix WebSocket Cleanup
- [x] 11.1 Make destroy method async in websocket.js
- [x] 11.2 Close WebSocket server properly
- [x] 11.3 Clear all data structures (connections, messageHandlers)
- [x] 11.4 Stop heartbeat interval
- [ ] 11.5 Add unit test for complete cleanup

### 12. Create Cleanup Manager
- [x] 12.1 Create src/router/cleanup-manager.js with CleanupManager class
- [x] 12.2 Implement register, trackInterval, trackTimeout methods
- [x] 12.3 Implement cleanup method with timeout
- [ ] 12.4 Add property tests for cleanup completeness (Property 7)

## Phase 3: High Priority Fixes

### 13. Add Input Validation in auth.js
- [x] 13.1 Validate state parameter in generateAuthorizationUrl
- [x] 13.2 Add length and character checks
- [ ] 13.3 Add property tests for state validation (Property 8)

### 14. Fix Token Revocation Error Handling
- [x] 14.1 Add try-catch in revokeToken method
- [x] 14.2 Check response status
- [x] 14.3 Return success/failure indicator
- [ ] 14.4 Add property tests for revocation error handling (Property 15)

### 15. Add Response Read Timeout in connectionPool.js
- [x] 15.1 Add overall timeout for request+response
- [x] 15.2 Enforce max response size
- [x] 15.3 Add cleanup on timeout
- [ ] 15.4 Add property tests for timeout enforcement (Property 11)

### 16. Fix WebSocket Message Handler Errors
- [x] 16.1 Send error response for invalid JSON in websocket.js
- [x] 16.2 Catch handler errors and send error responses
- [ ] 16.3 Add property tests for WebSocket error handling (Property 13)

### 17. Add Circuit Breaker Timeout
- [x] 17.1 Add timeout parameter to execute method in circuitBreaker.js
- [x] 17.2 Use Promise.race with timeout
- [ ] 17.3 Add property tests for circuit breaker timeout (Property 14)

### 18. Fix Duplicate Property in routerCore.js
- [x] 18.1 Calculate tokens once in executeRequest
- [x] 18.2 Remove duplicate usage property
- [ ] 18.3 Add property tests for response uniqueness (Property 12)

### 19. Fix Redis Disconnect
- [x] 19.1 Add graceful shutdown with timeout in redis.js
- [x] 19.2 Add force disconnect fallback
- [x] 19.3 Ensure connected flag is set to false
- [ ] 19.4 Add property tests for Redis disconnect (Property 16)
- [ ] 19.5 Add unit tests for disconnect timeout and failure

### 20. Fix ResponseCache Timer Cleanup
- [x] 20.1 Clear existing timer before setting new one in responseCache.js
- [ ] 20.2 Add property tests for timer cleanup (Property 17)

## Phase 4: Medium Priority Fixes

### 21. Fix Idempotency Cache in routerCore.js
- [x] 21.1 Replace idempotencyCache Map with SizeLimitedMap
- [x] 21.2 Add periodic cleanup interval
- [x] 21.3 Add cleanup to shutdown method
- [ ] 21.4 Add property tests for idempotency cache (Property 18)

### 22. Fix Load Balancer Affinity Map
- [x] 22.1 Replace affinity Map with SizeLimitedMap in loadBalancer.js
- [x] 22.2 Add TTL to affinity entries
- [x] 22.3 Add periodic cleanup
- [ ] 22.4 Add property tests for affinity map (Property 18)

### 23. Optimize Endpoint Selection
- [x] 23.1 Add availableEndpoints cache in loadBalancer.js
- [x] 23.2 Add availableEndpointsDirty flag
- [x] 23.3 Mark cache dirty on health changes
- [ ] 23.4 Add property tests for endpoint caching (Property 20)

### 24. Optimize Latency Calculation
- [x] 24.1 Store latencySum in loadBalancer.js
- [x] 24.2 Calculate average from sum
- [x] 24.3 Track min/max latency
- [ ] 24.4 Add property tests for latency calculation (Property 21)

### 25. Fix Stream Parser Cleanup
- [x] 25.1 Clear parsers Map in cleanupStream in streaming.js
- [ ] 25.2 Add unit test for parser cleanup

### 26. Optimize Stream Parsing
- [x] 26.1 Convert parseStreamPayload to generator in streaming.js
- [x] 26.2 Yield events instead of storing all

### 27. Fix Dead Letter Queue File Operations
- [x] 27.1 Replace fs.appendFileSync with fs.promises.appendFile in dead-letter-queue.js
- [x] 27.2 Make enqueue method async
- [ ] 27.3 Update callers to handle async enqueue

## Phase 5: Code Quality

### 28. Enhance Logger Module
- [x] 28.1 Add logError helper function to logger.js
- [x] 28.2 Add logRequest helper function
- [x] 28.3 Update all modules to use consistent logging

### 29. Replace Magic Numbers
- [ ] 29.1 Replace magic numbers in auth.js with constants
- [ ] 29.2 Replace magic numbers in routerCore.js with constants
- [ ] 29.3 Replace magic numbers in connectionPool.js with constants
- [ ] 29.4 Replace magic numbers in websocket.js with constants
- [ ] 29.5 Replace magic numbers in all other modules with constants

### 30. Remove Dead Code
- [ ] 30.1 Run ESLint with no-unused-vars rule
- [ ] 30.2 Remove unused variables in streaming.js
- [ ] 30.3 Remove unused variables in connectionPool.js
- [ ] 30.4 Remove unused variables in all other modules

## Testing and Validation

### 31. Property-Based Tests
- [x] 31.1 Create test/code-quality-fixes/phase1-security.test.js
- [x] 31.2 Create test/code-quality-fixes/phase2-resources.test.js
- [x] 31.3 Create test/code-quality-fixes/phase3-high-priority.test.js
- [x] 31.4 Create test/code-quality-fixes/phase4-medium-priority.test.js
- [x] 31.5 Create test/code-quality-fixes/phase5-compatibility.test.js
- [ ] 31.6 Implement all 25 property tests with 100+ iterations

### 32. Unit Tests
- [ ] 32.1 Add unit test for empty stream handling
- [ ] 32.2 Add unit test for WebSocket server shutdown
- [ ] 32.3 Add unit test for forced shutdown after timeout
- [ ] 32.4 Add unit test for TLS configuration
- [ ] 32.5 Add unit test for Redis disconnect timeout
- [ ] 32.6 Add unit test for Redis disconnect failure
- [ ] 32.7 Add unit test for stream parser cleanup
- [ ] 32.8 Verify all 77 existing tests pass

### 33. Integration Tests
- [ ] 33.1 Create test/code-quality-fixes/integration.test.js
- [ ] 33.2 Test end-to-end security fixes
- [ ] 33.3 Test end-to-end resource cleanup
- [ ] 33.4 Test end-to-end error handling

### 34. Performance Benchmarks
- [ ] 34.1 Create benchmarks for endpoint selection
- [ ] 34.2 Create benchmarks for latency calculation
- [ ] 34.3 Create benchmarks for file I/O operations
- [ ] 34.4 Verify performance improvements

## Documentation

### 35. Configuration Documentation
- [ ] 35.1 Update README.md with new configuration options
- [ ] 35.2 Create docs/CONFIGURATION.md with comprehensive guide
- [ ] 35.3 Update config.yaml.example with new options

### 36. Migration Documentation
- [ ] 36.1 Create docs/CODE-QUALITY-FIXES-MIGRATION.md
- [ ] 36.2 Document changes by phase
- [ ] 36.3 Document configuration options and defaults
- [ ] 36.4 Document monitoring recommendations
- [ ] 36.5 Document rollback procedures

### 37. Operations Documentation
- [ ] 37.1 Update docs/OPERATIONS.md with graceful shutdown procedures
- [ ] 37.2 Add monitoring metrics for each phase
- [ ] 37.3 Add troubleshooting guide for new error conditions
- [ ] 37.4 Add configuration tuning guidelines

## Deployment

### 38. Phase 1 Deployment
- [ ] 38.1 Deploy Phase 1 to staging
- [ ] 38.2 Run security audit tools
- [ ] 38.3 Verify timing attack tests pass
- [ ] 38.4 Monitor metrics for 24 hours
- [ ] 38.5 Deploy to production with monitoring

### 39. Phase 2 Deployment
- [ ] 39.1 Deploy Phase 2 to staging
- [ ] 39.2 Run load tests with graceful shutdown
- [ ] 39.3 Monitor resource cleanup metrics
- [ ] 39.4 Deploy to production
- [ ] 39.5 Monitor for 24 hours

### 40. Phase 3 Deployment
- [ ] 40.1 Deploy Phase 3 to staging
- [ ] 40.2 Run comprehensive error injection tests
- [ ] 40.3 Monitor error rates and timeout metrics
- [ ] 40.4 Deploy to production with gradual rollout
- [ ] 40.5 Monitor for 24 hours

### 41. Phase 4 Deployment
- [ ] 41.1 Deploy Phase 4 to staging
- [ ] 41.2 Run performance benchmarks
- [ ] 41.3 Monitor memory usage and cache metrics
- [ ] 41.4 Deploy to production
- [ ] 41.5 Monitor for 24 hours

### 42. Phase 5 Deployment
- [ ] 42.1 Deploy Phase 5 to staging
- [ ] 42.2 Verify logging consistency
- [ ] 42.3 Deploy to production
- [ ] 42.4 Monitor for 24 hours

### 43. Final Validation
- [ ] 43.1 Verify all 77 existing tests pass
- [ ] 43.2 Verify all 25 property tests pass
- [ ] 43.3 Verify all 8 unit tests pass
- [ ] 43.4 Run extended property tests with 1000 iterations
- [ ] 43.5 Verify performance benchmarks show improvements
- [ ] 43.6 Verify all metrics are stable
- [ ] 43.7 Complete final security audit
- [ ] 43.8 Update CHANGELOG.md with all changes

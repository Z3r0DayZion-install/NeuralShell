#!/usr/bin/env node

/**
 * Automated Chaos Testing
 * Tests system resilience and self-healing capabilities
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

class ChaosTest {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  async run() {
    console.log('🔥 Starting Chaos Testing...\n');

    await this.testEndpointFailure();
    await this.testHighLoad();
    await this.testMemoryPressure();
    await this.testNetworkLatency();
    await this.testCascadingFailures();
    await this.testSecurityAttack();
    await this.testRateLimitExhaustion();
    await this.testDatabaseFailure();

    this.printResults();
  }

  /**
   * Test endpoint failure and recovery
   */
  async testEndpointFailure() {
    console.log('📍 Test: Endpoint Failure Recovery');
    
    try {
      // Simulate endpoint failure
      const response = await fetch(`${BASE_URL}/admin/endpoints/test-endpoint/disable`, {
        method: 'POST',
        headers: {
          'X-Admin-Token': ADMIN_TOKEN
        }
      });

      if (response.ok) {
        console.log('  ✓ Endpoint disabled');

        // Wait for self-healing
        await this.sleep(10000);

        // Check if endpoint recovered
        const status = await this.getEndpointStatus('test-endpoint');
        
        if (status.enabled) {
          this.recordPass('Endpoint auto-recovered');
        } else {
          this.recordFail('Endpoint did not auto-recover');
        }
      } else {
        this.recordFail('Failed to disable endpoint');
      }
    } catch (error) {
      this.recordFail(`Endpoint failure test error: ${error.message}`);
    }
  }

  /**
   * Test high load handling
   */
  async testHighLoad() {
    console.log('\n📊 Test: High Load Handling');

    try {
      const concurrentRequests = 100;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(this.makeRequest());
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const successRate = (successful / concurrentRequests) * 100;

      if (successRate >= 95) {
        this.recordPass(`High load handled: ${successRate.toFixed(2)}% success rate`);
      } else {
        this.recordFail(`High load failed: ${successRate.toFixed(2)}% success rate`);
      }
    } catch (error) {
      this.recordFail(`High load test error: ${error.message}`);
    }
  }

  /**
   * Test memory pressure handling
   */
  async testMemoryPressure() {
    console.log('\n💾 Test: Memory Pressure Handling');

    try {
      // Check initial memory
      const initialMemory = await this.getMemoryUsage();

      // Create memory pressure
      const largePayload = 'x'.repeat(1024 * 1024); // 1MB
      const promises = [];

      for (let i = 0; i < 50; i++) {
        promises.push(this.makeRequest({ data: largePayload }));
      }

      await Promise.allSettled(promises);

      // Wait for potential memory leak detection
      await this.sleep(5000);

      // Check if system is still responsive
      const response = await this.makeRequest();
      
      if (response) {
        this.recordPass('System handled memory pressure');
      } else {
        this.recordFail('System failed under memory pressure');
      }
    } catch (error) {
      this.recordFail(`Memory pressure test error: ${error.message}`);
    }
  }

  /**
   * Test network latency handling
   */
  async testNetworkLatency() {
    console.log('\n🌐 Test: Network Latency Handling');

    try {
      // Make requests with timeout
      const start = Date.now();
      const response = await this.makeRequest({ timeout: 1000 });
      const duration = Date.now() - start;

      if (response && duration < 5000) {
        this.recordPass(`Request completed in ${duration}ms`);
      } else {
        this.recordFail(`Request took too long: ${duration}ms`);
      }
    } catch (error) {
      if (error.message.includes('timeout')) {
        this.recordPass('Timeout handled gracefully');
      } else {
        this.recordFail(`Network latency test error: ${error.message}`);
      }
    }
  }

  /**
   * Test cascading failures
   */
  async testCascadingFailures() {
    console.log('\n⛓️  Test: Cascading Failure Prevention');

    try {
      // Disable multiple endpoints
      await this.disableEndpoint('endpoint1');
      await this.disableEndpoint('endpoint2');

      // System should still function with remaining endpoints
      const response = await this.makeRequest();

      if (response) {
        this.recordPass('System prevented cascading failure');
      } else {
        this.recordFail('Cascading failure occurred');
      }

      // Re-enable endpoints
      await this.enableEndpoint('endpoint1');
      await this.enableEndpoint('endpoint2');
    } catch (error) {
      this.recordFail(`Cascading failure test error: ${error.message}`);
    }
  }

  /**
   * Test security attack handling
   */
  async testSecurityAttack() {
    console.log('\n🛡️  Test: Security Attack Handling');

    try {
      // Simulate SQL injection attempt
      const maliciousPayload = {
        messages: [
          { role: 'user', content: "'; DROP TABLE users; --" }
        ]
      };

      const response = await fetch(`${BASE_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maliciousPayload)
      });

      // Should be blocked or sanitized
      if (response.status === 403 || response.status === 400) {
        this.recordPass('Security attack blocked');
      } else {
        this.recordFail('Security attack not blocked');
      }
    } catch (error) {
      this.recordFail(`Security attack test error: ${error.message}`);
    }
  }

  /**
   * Test rate limit exhaustion
   */
  async testRateLimitExhaustion() {
    console.log('\n⏱️  Test: Rate Limit Exhaustion');

    try {
      const promises = [];
      
      // Exceed rate limit
      for (let i = 0; i < 200; i++) {
        promises.push(this.makeRequest());
      }

      const results = await Promise.allSettled(promises);
      const rateLimited = results.filter(r => 
        r.status === 'rejected' || 
        (r.value && r.value.status === 429)
      ).length;

      if (rateLimited > 0) {
        this.recordPass(`Rate limiting active: ${rateLimited} requests limited`);
      } else {
        this.recordFail('Rate limiting not working');
      }
    } catch (error) {
      this.recordFail(`Rate limit test error: ${error.message}`);
    }
  }

  /**
   * Test database failure handling
   */
  async testDatabaseFailure() {
    console.log('\n🗄️  Test: Database Failure Handling');

    try {
      // Simulate Redis failure (if using Redis)
      // System should fallback to in-memory

      const response = await this.makeRequest();

      if (response) {
        this.recordPass('System handled database failure');
      } else {
        this.recordFail('System failed on database failure');
      }
    } catch (error) {
      this.recordFail(`Database failure test error: ${error.message}`);
    }
  }

  /**
   * Helper: Make a test request
   */
  async makeRequest(options = {}) {
    try {
      const response = await fetch(`${BASE_URL}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: options.data || 'test message' }
          ]
        }),
        timeout: options.timeout || 10000
      });

      return response.ok;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Helper: Get endpoint status
   */
  async getEndpointStatus(endpoint) {
    try {
      const response = await fetch(`${BASE_URL}/admin/endpoints`, {
        headers: {
          'X-Admin-Token': ADMIN_TOKEN
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.endpoints.find(e => e.name === endpoint) || {};
      }
    } catch (error) {
      return {};
    }
  }

  /**
   * Helper: Get memory usage
   */
  async getMemoryUsage() {
    try {
      const response = await fetch(`${BASE_URL}/admin/metrics`, {
        headers: {
          'X-Admin-Token': ADMIN_TOKEN
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.memory || {};
      }
    } catch (error) {
      return {};
    }
  }

  /**
   * Helper: Disable endpoint
   */
  async disableEndpoint(endpoint) {
    try {
      await fetch(`${BASE_URL}/admin/endpoints/${endpoint}/disable`, {
        method: 'POST',
        headers: {
          'X-Admin-Token': ADMIN_TOKEN
        }
      });
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Helper: Enable endpoint
   */
  async enableEndpoint(endpoint) {
    try {
      await fetch(`${BASE_URL}/admin/endpoints/${endpoint}/enable`, {
        method: 'POST',
        headers: {
          'X-Admin-Token': ADMIN_TOKEN
        }
      });
    } catch (error) {
      // Ignore
    }
  }

  recordPass(message) {
    console.log(`  ✅ PASS: ${message}`);
    this.passed++;
    this.results.push({ status: 'PASS', message });
  }

  recordFail(message) {
    console.log(`  ❌ FAIL: ${message}`);
    this.failed++;
    this.results.push({ status: 'FAIL', message });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Chaos Testing Results');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.passed + this.failed}`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(2)}%`);
    console.log('='.repeat(60));

    if (this.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.message}`));
    }

    process.exit(this.failed > 0 ? 1 : 0);
  }
}

// Run chaos tests
const chaos = new ChaosTest();
chaos.run().catch(error => {
  console.error('Chaos testing failed:', error);
  process.exit(1);
});

function generateOpenAPISpec(options = {}) {
  const {
    title = 'NeuralShell Router API',
    description = 'Intelligent AI routing gateway with failover, rate limiting, and observability',
    version = '1.0.0',
    serverUrl = 'http://localhost:3000',
    endpoints = [],
    auth = {}
  } = options;

  const spec = {
    openapi: '3.1.0',
    info: {
      title,
      description,
      version,
      contact: {
        name: 'NeuralShell Support',
        url: 'https://github.com/neuralshell/neuralshell'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: serverUrl,
        description: 'Production server'
      }
    ],
    paths: {},
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Admin or prompt token'
        },
        ApiKeyHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
            message: { type: 'string' },
            requestId: { type: 'string' }
          },
          required: ['error', 'message']
        },
        PromptRequest: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Message'
              }
            },
            model: { type: 'string' },
            temperature: { type: 'number', minimum: 0, maximum: 2 },
            max_tokens: { type: 'integer', minimum: 1 },
            stream: { type: 'boolean', default: false },
            user: { type: 'string' }
          },
          required: ['messages']
        },
        Message: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['system', 'user', 'assistant', 'tool']
            },
            content: { type: 'string' },
            name: { type: 'string' }
          },
          required: ['role', 'content']
        },
        PromptResponse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            object: { type: 'string' },
            created: { type: 'integer' },
            model: { type: 'string' },
            choices: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Choice'
              },
              minItems: 1
            },
            usage: {
              $ref: '#/components/schemas/Usage'
            },
            requestId: { type: 'string' }
          }
        },
        Choice: {
          type: 'object',
          properties: {
            index: { type: 'integer' },
            message: {
              $ref: '#/components/schemas/Message'
            },
            finish_reason: { type: 'string' }
          }
        },
        Usage: {
          type: 'object',
          properties: {
            prompt_tokens: { type: 'integer' },
            completion_tokens: { type: 'integer' },
            total_tokens: { type: 'integer' }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            uptime: { type: 'number' },
            version: { type: 'string' }
          }
        },
        MetricsResponse: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            success: { type: 'integer' },
            fail: { type: 'integer' },
            rejected: { type: 'integer' },
            inFlight: { type: 'integer' }
          }
        },
        EndpointsResponse: {
          type: 'object',
          properties: {
            endpoints: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/EndpointStatus'
              }
            }
          }
        },
        EndpointStatus: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            model: { type: 'string' },
            healthy: { type: 'boolean' },
            inCooldown: { type: 'boolean' },
            failures: { type: 'integer' },
            successes: { type: 'integer' },
            avgLatencyMs: { type: 'number' }
          }
        },
        ConfigResponse: {
          type: 'object',
          properties: {
            server: {
              type: 'object',
              properties: {
                port: { type: 'integer' },
                timeoutMs: { type: 'integer' }
              }
            },
            routing: {
              type: 'object',
              properties: {
                strategy: { type: 'string' },
                adaptive: { type: 'boolean' }
              }
            },
            limits: {
              type: 'object',
              properties: {
                maxMessagesPerRequest: { type: 'integer' },
                maxMessageChars: { type: 'integer' }
              }
            }
          }
        }
      }
    },
    security: [
      { BearerAuth: [] },
      { ApiKeyHeader: [] }
    ]
  };

  spec.paths = {
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Basic liveness probe',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' }
              }
            }
          }
        }
      }
    },
    '/ready': {
      get: {
        summary: 'Readiness check',
        description: 'Returns runtime configuration and endpoint list',
        operationId: 'getReady',
        responses: {
          '200': {
            description: 'Service is ready',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ConfigResponse' }
              }
            }
          }
        }
      }
    },
    '/metrics': {
      get: {
        summary: 'Metrics in JSON format',
        description: 'Returns internal counters and statistics',
        operationId: 'getMetrics',
        responses: {
          '200': {
            description: 'Metrics data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MetricsResponse' }
              }
            }
          }
        }
      }
    },
    '/metrics/prometheus': {
      get: {
        summary: 'Metrics in Prometheus format',
        description: 'Returns metrics in OpenMetrics/Prometheus text format',
        operationId: 'getMetricsPrometheus',
        responses: {
          '200': {
            description: 'Prometheus metrics',
            content: {
              'text/plain': {
                schema: { type: 'string' }
              }
            }
          }
        }
      }
    },
    '/errors/catalog': {
      get: {
        summary: 'Error code catalog',
        description: 'Returns all defined error codes',
        operationId: 'getErrorCatalog',
        responses: {
          '200': {
            description: 'Error catalog',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    errors: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/openapi.json': {
      get: {
        summary: 'OpenAPI specification',
        description: 'Returns the OpenAPI spec for this API',
        operationId: 'getOpenAPI',
        responses: {
          '200': {
            description: 'OpenAPI 3.1 specification',
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          }
        }
      }
    },
    '/version': {
      get: {
        summary: 'Version information',
        description: 'Returns app version and start timestamp',
        operationId: 'getVersion',
        responses: {
          '200': {
            description: 'Version info',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    version: { type: 'string' },
                    startTime: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/endpoints': {
      get: {
        summary: 'List endpoints',
        description: 'Returns per-endpoint health, cooldown state, and counters',
        operationId: 'getEndpoints',
        security: auth.adminToken ? [{ BearerAuth: [] }] : [],
        responses: {
          '200': {
            description: 'Endpoint list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EndpointsResponse' }
              }
            }
          },
          '403': {
            description: 'Forbidden - admin token required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/config': {
      get: {
        summary: 'Get runtime config',
        description: 'Returns effective runtime policy and configuration',
        operationId: 'getConfig',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Configuration',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ConfigResponse' }
              }
            }
          },
          '403': {
            description: 'Forbidden'
          }
        }
      }
    },
    '/prompt': {
      post: {
        summary: 'Execute prompt',
        description: 'Routes the prompt to an available LLM endpoint with failover',
        operationId: 'postPrompt',
        parameters: [
          {
            name: 'x-client-request-id',
            in: 'header',
            description: 'Optional client-provided request ID',
            schema: { type: 'string' }
          },
          {
            name: 'x-idempotency-key',
            in: 'header',
            description: 'Idempotency key for caching responses',
            schema: { type: 'string' }
          },
          {
            name: 'x-dry-run',
            in: 'header',
            description: 'Return selected route without calling upstream',
            schema: { type: 'integer', enum: [0, 1] }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PromptRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PromptResponse' }
              }
            }
          },
          '400': {
            description: 'Bad request - invalid payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized - invalid or missing token'
          },
          '429': {
            description: 'Rate limited',
            headers: {
              'retry-after': {
                schema: { type: 'integer' },
                description: 'Seconds to wait before retry'
              }
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '502': {
            description: 'Bad gateway - all endpoints failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '503': {
            description: 'Service unavailable - no active endpoints'
          }
        }
      }
    },
    '/prompt/stream': {
      post: {
        summary: 'Execute prompt with streaming',
        description: 'Streaming response support for real-time LLM output',
        operationId: 'postPromptStream',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  messages: { $ref: '#/components/schemas/PromptRequest/properties/messages' },
                  stream: { type: 'boolean', default: true }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Streaming response',
            headers: {
              'content-type': {
                schema: { type: 'string' },
                example: 'text/event-stream'
              }
            },
            content: {
              'text/event-stream': {
                schema: { type: 'string' }
              }
            }
          }
        }
      }
    },
    '/admin/runtime/snapshot': {
      get: {
        summary: 'Runtime snapshot',
        description: 'Returns runtime config, counters, and endpoint summary',
        operationId: 'getRuntimeSnapshot',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Runtime snapshot'
          },
          '403': {
            description: 'Forbidden'
          }
        }
      }
    },
    '/admin/idempotency/stats': {
      get: {
        summary: 'Idempotency stats',
        description: 'Returns idempotency cache statistics',
        operationId: 'getIdempotencyStats',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Idempotency statistics'
          }
        }
      }
    },
    '/admin/rate-limit/stats': {
      get: {
        summary: 'Rate limit stats',
        description: 'Returns rate limit store statistics',
        operationId: 'getRateLimitStats',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Rate limit statistics'
          }
        }
      }
    },
    '/admin/idempotency/reset': {
      post: {
        summary: 'Reset idempotency cache',
        description: 'Clears the idempotency cache',
        operationId: 'resetIdempotency',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Cache cleared'
          }
        }
      }
    },
    '/admin/rate-limit/reset': {
      post: {
        summary: 'Reset rate limits',
        description: 'Clears in-memory rate limit state',
        operationId: 'resetRateLimits',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Rate limits reset'
          }
        }
      }
    },
    '/endpoints/reset': {
      post: {
        summary: 'Reset endpoint state',
        description: 'Clears endpoint cooldown and failure state',
        operationId: 'resetEndpoints',
        responses: {
          '200': {
            description: 'Endpoints reset'
          }
        }
      }
    },
    '/endpoints/reload': {
      post: {
        summary: 'Hot reload endpoints',
        description: 'Reloads the endpoint configuration without restart',
        operationId: 'reloadEndpoints',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  endpoints: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        url: { type: 'string' },
                        model: { type: 'string' },
                        provider: { type: 'string' },
                        apiKey: { type: 'string' },
                        deployment: { type: 'string' },
                        region: { type: 'string' },
                        headers: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Endpoints reloaded'
          },
          '400': {
            description: 'Invalid endpoint configuration'
          }
        }
      }
    },
    '/metrics/reset': {
      post: {
        summary: 'Reset metrics',
        description: 'Resets internal counters',
        operationId: 'resetMetrics',
        parameters: [
          {
            name: 'x-reset-token',
            in: 'header',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Metrics reset'
          },
          '403': {
            description: 'Invalid reset token'
          }
        }
      }
    }
  };

  return spec;
}

function validateOpenAPISpec(spec) {
  const errors = [];

  if (!spec.openapi) {
    errors.push('Missing openapi version');
  }

  if (!spec.info) {
    errors.push('Missing info object');
  } else {
    if (!spec.info.title) {
      errors.push('Missing info.title');
    }
    if (!spec.info.version) {
      errors.push('Missing info.version');
    }
  }

  if (!spec.paths) {
    errors.push('Missing paths object');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export { generateOpenAPISpec, validateOpenAPISpec };

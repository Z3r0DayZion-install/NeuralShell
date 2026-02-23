const GraphQL = {
  parse(str) {
    return str;
  }
};

class GraphQLSchema {
  constructor() {
    this.types = new Map();
    this.queries = new Map();
    this.mutations = new Map();
    this.subscriptions = new Map();
    this.resolvers = {
      Query: {},
      Mutation: {},
      Subscription: {}
    };
  }

  type(name, fields) {
    const typeDef = {
      kind: 'object',
      name,
      fields: {}
    };

    for (const [fieldName, fieldDef] of Object.entries(fields)) {
      typeDef.fields[fieldName] = this.parseFieldDef(fieldDef);
    }

    this.types.set(name, typeDef);
    return this;
  }

  parseFieldDef(def) {
    if (typeof def === 'string') {
      return { type: def, args: [] };
    }
    return {
      type: def.type,
      args: def.args || [],
      resolve: def.resolve
    };
  }

  query(name, fieldDef) {
    this.queries.set(name, this.parseFieldDef(fieldDef));
    this.resolvers.Query[name] = fieldDef.resolve || (() => null);
    return this;
  }

  mutation(name, fieldDef) {
    this.mutations.set(name, this.parseFieldDef(fieldDef));
    this.resolvers.Mutation[name] = fieldDef.resolve || (() => null);
    return this;
  }

  subscription(name, fieldDef) {
    this.subscriptions.set(name, this.parseFieldDef(fieldDef));
    this.resolvers.Subscription[name] = fieldDef.subscribe || (() => null);
    return this;
  }

  resolve(typeName, fieldName, resolver) {
    if (!this.resolvers[typeName]) {
      this.resolvers[typeName] = {};
    }
    this.resolvers[typeName][fieldName] = resolver;
    return this;
  }

  build() {
    return {
      types: this.types,
      queries: this.queries,
      mutations: this.mutations,
      subscriptions: this.subscriptions,
      resolvers: this.resolvers
    };
  }
}

function createSchema() {
  return new GraphQLSchema()
    .type('Health', {
      ok: 'Boolean!',
      uptime: 'Float!',
      version: 'String!'
    })
    .type('Metrics', {
      total: 'Int!',
      success: 'Int!',
      fail: 'Int!',
      rejected: 'Int!',
      inFlight: 'Int!'
    })
    .type('Endpoint', {
      name: 'String!',
      url: 'String',
      model: 'String',
      healthy: 'Boolean!',
      inCooldown: 'Boolean!',
      failures: 'Int!',
      successes: 'Int!',
      avgLatencyMs: 'Float'
    })
    .type('Config', {
      port: 'Int!',
      timeoutMs: 'Int!',
      strategy: 'String!',
      adaptive: 'Boolean!',
      maxMessagesPerRequest: 'Int!',
      maxMessageChars: 'Int!'
    })
    .type('PromptPayload', {
      messages: '[MessageInput!]!',
      model: 'String',
      temperature: 'Float',
      maxTokens: 'Int',
      stream: 'Boolean'
    })
    .type('Message', {
      role: 'String!',
      content: 'String!',
      name: 'String'
    })
    .type('Choice', {
      index: 'Int!',
      message: 'Message!',
      finishReason: 'String'
    })
    .type('Usage', {
      promptTokens: 'Int!',
      completionTokens: 'Int!',
      totalTokens: 'Int!'
    })
    .type('PromptResponse', {
      id: 'String!',
      object: 'String',
      created: 'Int!',
      model: 'String!',
      choices: '[Choice!]!',
      usage: 'Usage',
      requestId: 'String!'
    })
    .type('Error', {
      error: 'String!',
      code: 'String!',
      message: 'String!',
      requestId: 'String'
    })
    .type('Union_PromptResult', ['PromptResponse', 'Error'])
    .type('Tenant', {
      id: 'String!',
      name: 'String!',
      quota: 'Int!',
      usage: 'Int!',
      createdAt: 'String!'
    })
    .type('CostBreakdown', {
      model: 'String!',
      inputTokens: 'Int!',
      outputTokens: 'Int!',
      inputCost: 'Float!',
      outputCost: 'Float!',
      totalCost: 'Float!'
    })
    .type('Analytics', {
      totalRequests: 'Int!',
      totalTokens: 'Int!',
      totalCost: 'Float!',
      avgLatencyMs: 'Float!',
      byModel: '[CostBreakdown!]!'
    })

    .input('MessageInput', {
      role: 'String!',
      content: 'String!',
      name: 'String'
    })
    .input('PromptInput', {
      messages: '[MessageInput!]!',
      model: 'String',
      temperature: 'Float',
      maxTokens: 'Int',
      stream: 'Boolean',
      user: 'String'
    })

    .query('health', {
      type: 'Health!',
      resolve: (_, __, context) => context.health()
    })
    .query('metrics', {
      type: 'Metrics!',
      resolve: (_, __, context) => context.metrics()
    })
    .query('endpoints', {
      type: '[Endpoint!]!',
      resolve: (_, __, context) => context.endpoints()
    })
    .query('config', {
      type: 'Config!',
      resolve: (_, __, context) => context.config()
    })
    .query('version', {
      type: 'String!',
      resolve: (_, __, context) => context.version()
    })
    .query('tenant', {
      args: [{ name: 'id', type: 'String!' }],
      type: 'Tenant',
      resolve: (_, args, context) => context.tenant(args.id)
    })
    .query('analytics', {
      args: [
        { name: 'startDate', type: 'String' },
        { name: 'endDate', type: 'String' },
        { name: 'tenantId', type: 'String' }
      ],
      type: 'Analytics!',
      resolve: (_, args, context) => context.analytics(args)
    })

    .mutation('resetMetrics', {
      type: 'Boolean!',
      resolve: (_, __, context) => context.resetMetrics()
    })
    .mutation('resetEndpoints', {
      type: 'Boolean!',
      resolve: (_, __, context) => context.resetEndpoints()
    })
    .mutation('reloadEndpoints', {
      args: [{ name: 'endpoints', type: '[EndpointInput!]!' }],
      type: 'Boolean!',
      resolve: (_, args, context) => context.reloadEndpoints(args.endpoints)
    })
    .mutation('resetIdempotency', {
      type: 'Boolean!',
      resolve: (_, __, context) => context.resetIdempotency()
    })
    .mutation('resetRateLimits', {
      type: 'Boolean!',
      resolve: (_, __, context) => context.resetRateLimits()
    })
    .mutation('createTenant', {
      args: [{ name: 'input', type: 'TenantInput!' }],
      type: 'Tenant!',
      resolve: (_, args, context) => context.createTenant(args.input)
    })
    .mutation('updateTenant', {
      args: [
        { name: 'id', type: 'String!' },
        { name: 'input', type: 'TenantInput!' }
      ],
      type: 'Tenant',
      resolve: (_, args, context) => context.updateTenant(args.id, args.input)
    })
    .mutation('deleteTenant', {
      args: [{ name: 'id', type: 'String!' }],
      type: 'Boolean!',
      resolve: (_, args, context) => context.deleteTenant(args.id)
    })

    .subscription('promptStream', {
      args: [{ name: 'input', type: 'PromptInput!' }],
      type: 'String!',
      subscribe: (_, args, context) => context.subscribePrompt(args.input)
    })
    .subscription('metricsUpdated', {
      type: 'Metrics!',
      subscribe: (_, __, context) => context.subscribeMetrics()
    })
    .subscription('endpointHealth', {
      type: 'Endpoint!',
      subscribe: (_, __, context) => context.subscribeEndpoints()
    });
}

function createGraphQLRouter(routerContext) {
  const schema = createSchema();
  const schemaData = schema.build();

  async function executeQuery(query, variables = {}, context = {}) {
    const fullContext = { ...routerContext, ...context };

    const operationName = query.operationName;
    const operationType = query.definitions?.[0]?.operation || 'query';
    const selections = query.definitions?.[0]?.selectionSet?.selections || [];

    const result = {};

    for (const selection of selections) {
      const fieldName = selection.name.value;

      let data;
      const errors = [];

      try {
        const operation = operationType === 'mutation'
          ? schemaData.mutations
          : operationType === 'subscription'
            ? schemaData.subscriptions
            : schemaData.queries;

        const fieldDef = operation[fieldName];

        if (!fieldDef) {
          errors.push({ message: `Cannot query field "${fieldName}"`, path: [fieldName] });
          continue;
        }

        const resolver = schemaData.resolvers[operationType === 'mutation' ? 'Mutation' : 'Query'][fieldName];

        if (resolver) {
          const args = {};
          if (selection.arguments) {
            for (const arg of selection.arguments) {
              const varName = arg.value?.name?.value;
              args[arg.name.value] = varName ? variables[varName] : arg.value?.value;
            }
          }
          data = await resolver(null, args, fullContext);
        } else {
          data = null;
        }

      } catch (err) {
        errors.push({ message: err.message, path: [fieldName] });
      }

      if (errors.length > 0) {
        result.errors = errors;
      } else {
        result.data = result.data || {};
        result.data[fieldName] = data;
      }
    }

    return result;
  }

  async function handleGraphQL(req, res) {
    try {
      let body;
      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('application/json')) {
        body = req.body;
      } else if (contentType.includes('application/graphql')) {
        body = { query: req.body };
      } else {
        body = req.body;
      }

      const { query, variables, operationName } = body;

      if (!query) {
        return res.status(400).json({
          errors: [{ message: 'Must provide query string' }]
        });
      }

      const parsed = {
        definitions: [{
          operation: query.trim().startsWith('mutation') ? 'mutation' :
            query.trim().startsWith('subscription') ? 'subscription' : 'query',
          selectionSet: { selections: [] }
        }]
      };

      const result = await executeQuery(parsed, variables || {}, {
        headers: req.headers,
        ip: req.ip
      });

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));

    } catch (err) {
      res.status(500).json({
        errors: [{ message: err.message }]
      });
    }
  }

  function getSchemaSDL() {
    let sdl = '';

    for (const [name, type] of schemaData.types) {
      sdl += `type ${name} {\n`;
      for (const [fieldName, fieldDef] of Object.entries(type.fields)) {
        sdl += `  ${fieldName}: ${fieldDef.type}\n`;
      }
      sdl += '}\n\n';
    }

    sdl += 'type Query {\n';
    for (const [name] of schemaData.queries) {
      sdl += `  ${name}: ${schemaData.queries[name].type}\n`;
    }
    sdl += '}\n\n';

    sdl += 'type Mutation {\n';
    for (const [name] of schemaData.mutations) {
      sdl += `  ${name}: ${schemaData.mutations[name].type}\n`;
    }
    sdl += '}\n';

    return sdl;
  }

  return {
    handle: handleGraphQL,
    executeQuery,
    getSchema: () => schemaData,
    getSchemaSDL
  };
}

export { GraphQLSchema, createSchema, createGraphQLRouter };

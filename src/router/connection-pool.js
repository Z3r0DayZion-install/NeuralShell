import http from 'http';
import https from 'https';

// Keep-alive agents for persistent connections
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60000
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60000
});

export function getAgent(url) {
  return url.startsWith('https') ? httpsAgent : httpAgent;
}

export function getAgentStats() {
  return {
    http: {
      sockets: httpAgent.sockets ? Object.keys(httpAgent.sockets).length : 0,
      requests: httpAgent.requests ? Object.keys(httpAgent.requests).length : 0,
      freeSockets: httpAgent.freeSockets ? Object.keys(httpAgent.freeSockets).length : 0
    },
    https: {
      sockets: httpsAgent.sockets ? Object.keys(httpsAgent.sockets).length : 0,
      requests: httpsAgent.requests ? Object.keys(httpsAgent.requests).length : 0,
      freeSockets: httpsAgent.freeSockets ? Object.keys(httpsAgent.freeSockets).length : 0
    }
  };
}

export function destroyAgents() {
  httpAgent.destroy();
  httpsAgent.destroy();
}

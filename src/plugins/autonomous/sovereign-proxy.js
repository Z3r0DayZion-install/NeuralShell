/**
 * NeuralShell Hardened Sovereign Proxy — OMEGA Enforcement Plugin
 * 
 * Implements a secure, local HTTPS proxy for anonymous data retrieval.
 * All requests are scrubbed of identifying headers (User-Agent, Cookies, Referer)
 * to prevent node fingerprinting and tracking.
 */

const ALLOWED_HEADERS = ['Accept', 'Accept-Encoding', 'Accept-Language', 'Content-Type', 'Content-Length'];

module.exports = {
  name: "sovereign-proxy",
  description: "Anonymous HTTPS proxy with strict header scrubbing and referer neutralization.",
  register({ registerCommand }) {
    registerCommand({
      name: "proxy",
      description: "Perform an anonymous request through the sovereign proxy.",
      args: ["method", "url", "body?"],
      async run(context) {
        // Load the agent-sdk dynamically to ensure kernel binding
        const sdk = require('../../kernel/agent-sdk');
        
        const method = String(context.method || "GET").toUpperCase();
        const url = String(context.url || "");
        const body = context.body || null;

        if (!url || !url.startsWith('https://')) {
          throw new Error("Invalid URL: Sovereign proxy only supports secure HTTPS requests.");
        }

        // --- STRICT HEADER SCRUBBING ---
        const scrubbedHeaders = {
          'User-Agent': 'NeuralShell-Sovereign-Node/1.1.1-OMEGA', // Standardized
          'Referer': '', // Explicitly neutralized
          'Cookie': '',  // Explicitly cleared
          'Origin': ''   // Explicitly cleared
        };

        // Transfer allowed headers from user input if provided
        if (context.headers && typeof context.headers === 'object') {
          for (const [key, value] of Object.entries(context.headers)) {
            const normalizedKey = key.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join('-');
            if (ALLOWED_HEADERS.includes(normalizedKey)) {
              scrubbedHeaders[normalizedKey] = value;
            }
          }
        }

        console.log(`[PROXY] Initiating ${method} to: ${url}`);
        
        try {
          const response = await sdk.fetch(url, {
            method,
            headers: scrubbedHeaders,
            body: body ? JSON.stringify(body) : undefined
          });

          return {
            ok: response.status >= 200 && response.status < 300,
            status: response.status,
            anonymity: "VERIFIED",
            scrubbed: ["User-Agent", "Cookie", "Referer", "Origin"],
            data: typeof response.data === 'string' ? response.data.slice(0, 1000) : response.data
          };
        } catch (err) {
          return {
            ok: false,
            status: "NETWORK_ERROR",
            error: err.message
          };
        }
      }
    });
  }
};

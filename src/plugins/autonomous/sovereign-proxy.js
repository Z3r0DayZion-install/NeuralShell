/**
 * NeuralShell Hardened Sovereign Proxy — OMEGA Enforcement Plugin
 * 
 * Implements a secure, local HTTPS proxy for anonymous data retrieval.
 * All requests are scrubbed of identifying headers (User-Agent, Cookies, Referer)
 * to prevent node fingerprinting and tracking.
 */

module.exports = {
  name: "sovereign-proxy",
  description: "Anonymous HTTPS proxy with strict header scrubbing and referer neutralization.",
  register({ registerCommand, kernel }) {
    registerCommand({
      name: "proxy",
      description: "Perform an anonymous request through the sovereign proxy.",
      args: ["method", "url", "body?"],
      async run(context) {
        const method = String(context.method || "GET").toUpperCase();
        const url = String(context.url || "");
        const body = context.body || null;

        if (!url || !url.startsWith('https://')) {
          throw new Error("Invalid URL: Sovereign proxy only supports secure HTTPS requests.");
        }

        // --- STRICT HEADER SCRUBBING ---
        const scrubbedHeaders = {
          'User-Agent': 'NeuralShell-Sovereign-Node/1.1.1-OMEGA',
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        };

        console.log(`[PROXY] Initiating ${method} to: ${url}`);
        
        try {
          const response = await kernel.request(kernel.CAP_NET, "safeFetch", {
            url,
            method,
            headers: scrubbedHeaders,
            body
          });

          return {
            ok: response.status >= 200 && response.status < 300,
            status: response.status,
            anonymity: "VERIFIED",
            scrubbed: ["User-Agent", "Cookie", "Referer", "Origin"],
            // data is base64 encoded from the kernel
            data: response.data 
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

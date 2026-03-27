// TypeScript entrypoint for model pooling runtime.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pool = require("./modelPool.js");

export const ModelPool = pool.ModelPool;
export default pool;


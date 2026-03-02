// Example plugin demonstrating the plugin lifecycle. Plugins live in
// `src/plugins` and export optional onLoad, onMessage and onShutdown
// hooks. This example simply writes to the application log when
// events occur and reacts to the `!echo` command.
const logger = require('../core/logger');

module.exports = {
  onLoad() {
    logger.info('Example plugin loaded');
  },
  /**
   * This plugin listens for messages beginning with `!echo` and logs
   * the remainder of the command. Plugins could also modify the
   * conversation or inject their own messages.
   */
  onMessage(message, _conversation) {
    if (message.role === 'user' && typeof message.content === 'string') {
      if (message.content.startsWith('!echo')) {
        const body = message.content.slice(5).trim();
        logger.info(`Echo command: ${body}`);
      }
    }
  },
  onShutdown() {
    logger.info('Example plugin shutdown');
  },
  commands: [
    {
      name: 'echo',
      description: 'Echo back provided text.',
      args: ['text'],
      execute: async ({ args }) => {
        const text = args.join(' ').trim();
        logger.info(`Echo command: ${text}`);
        return text || '(empty)';
      }
    }
  ]
};

/**
 * Centralized logging utility for the application.
 * Replaces direct usage of raw console.error/warn/info to enable future integration
 * with production error tracking services (e.g. Sentry, Datadog).
 */

const logger = {
  error: (message, ...args) => {
    // Keep standard console output
    console.error(message, ...args);

    // Dispatch custom event for potential error boundary / global capture
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('lexora-error', {
          detail: {
            message: message instanceof Error ? message.message : String(message),
            args,
          },
        })
      );
    }
  },
  warn: (message, ...args) => {
    console.warn(message, ...args);
  },
  info: (message, ...args) => {
    console.info(message, ...args);
  },
  debug: (message, ...args) => {
    console.debug(message, ...args);
  },
};

export default logger;

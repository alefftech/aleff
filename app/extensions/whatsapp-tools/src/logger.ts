/**
 * [LOGGER:CONFIG] Structured logging for whatsapp-tools plugin
 */

import pino from "pino";

export const logger = pino({
  name: "whatsapp-tools",
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
});

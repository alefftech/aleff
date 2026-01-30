/**
 * [LOGGER:CONFIG] Structured logging for whatsapp-core plugin
 */

import pino from "pino";

export const logger = pino({
  name: "whatsapp-core",
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
});

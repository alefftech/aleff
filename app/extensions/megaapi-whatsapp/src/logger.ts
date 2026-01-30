/**
 * [LOGGER:CONFIG] Structured logging for megaapi-whatsapp plugin
 */

import pino from "pino";

export const logger = pino({
  name: "megaapi-whatsapp",
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
});

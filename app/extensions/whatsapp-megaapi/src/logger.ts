/**
 * [LOGGER:CONFIG] Structured logging for whatsapp-megaapi plugin
 */

import pino from "pino";

export const logger = pino({
  name: "whatsapp-megaapi",
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
});

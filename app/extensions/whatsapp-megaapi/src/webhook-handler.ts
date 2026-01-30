/**
 * [WEBHOOK:HANDLER] HTTP Webhook Handler for MegaAPI
 *
 * Handles incoming webhooks from MegaAPI and routes them through
 * the dispatch pipeline so all hooks fire correctly.
 *
 * This follows the pattern from bluebubbles/src/monitor.ts.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import {
  normalizeMegaAPIWebhook,
  validateMegaAPIWebhookToken,
  isAllowedSender,
} from "./webhook-normalizer.js";
import { processInboundMessage } from "./monitor.js";
import { logger } from "./logger.js";

// =============================================================================
// [CONFIG:ENV] Read configuration from environment
// =============================================================================

function getConfig() {
  return {
    instanceKey: process.env.MEGAAPI_INSTANCE_KEY || "",
    webhookToken: process.env.MEGAAPI_WEBHOOK_TOKEN || "",
    allowFrom: process.env.MEGAAPI_ALLOW_FROM
      ? process.env.MEGAAPI_ALLOW_FROM.split(",").map((n) => n.trim())
      : [],
  };
}

// =============================================================================
// [WEBHOOK:PATH] Webhook path configuration
// =============================================================================

// Support both new path and legacy /hooks/megaapi for backwards compatibility
const DEFAULT_WEBHOOK_PATH = "/megaapi-webhook";
const LEGACY_WEBHOOK_PATH = "/hooks/megaapi";

/**
 * Get the webhook paths for MegaAPI.
 * Returns both the primary path and legacy path for backwards compatibility.
 */
export function getMegaAPIWebhookPath(): string {
  return process.env.MEGAAPI_WEBHOOK_PATH?.trim() || DEFAULT_WEBHOOK_PATH;
}

/**
 * Get all webhook paths that should be handled (primary + legacy).
 */
export function getMegaAPIWebhookPaths(): string[] {
  const primary = getMegaAPIWebhookPath();
  const paths = [primary];
  // Always include legacy path for backwards compatibility
  if (primary !== LEGACY_WEBHOOK_PATH) {
    paths.push(LEGACY_WEBHOOK_PATH);
  }
  return paths;
}

/**
 * Normalize webhook path for matching.
 */
function normalizeWebhookPath(path: string): string {
  return path.replace(/\/+$/, "").toLowerCase();
}

// =============================================================================
// [UTIL:BODY] Read JSON body from request
// =============================================================================

async function readJsonBody(
  req: IncomingMessage,
  maxBytes: number
): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    let done = false;
    let total = 0;
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => {
      if (done) return;
      total += chunk.length;
      if (total > maxBytes) {
        done = true;
        resolve({ ok: false, error: "payload too large" });
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (done) return;
      done = true;
      const raw = Buffer.concat(chunks).toString("utf-8").trim();
      if (!raw) {
        resolve({ ok: true, value: {} });
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        resolve({ ok: true, value: parsed });
      } catch (err) {
        resolve({ ok: false, error: String(err) });
      }
    });

    req.on("error", (err) => {
      if (done) return;
      done = true;
      resolve({ ok: false, error: String(err) });
    });
  });
}

// =============================================================================
// [WEBHOOK:HANDLER] Main HTTP handler
// =============================================================================

/**
 * Handle incoming MegaAPI webhook requests.
 *
 * Returns true if the request was handled, false if it should be passed
 * to other handlers.
 */
export async function handleMegaAPIWebhookRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const config = getConfig();
  const webhookPaths = getMegaAPIWebhookPaths();

  // [PATH:CHECK] Check if this request is for us (supports multiple paths)
  const url = new URL(req.url ?? "/", "http://localhost");
  const normalizedPath = normalizeWebhookPath(url.pathname);
  const isOurPath = webhookPaths.some(
    (p) => normalizeWebhookPath(p) === normalizedPath
  );

  if (!isOurPath) {
    return false; // Not for us
  }

  logger.debug({ path: normalizedPath }, "webhook_request_received");

  // [METHOD:CHECK] Only accept POST
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return true;
  }

  // [BODY:READ] Read and parse JSON body
  const body = await readJsonBody(req, 1024 * 1024); // 1MB limit
  if (!body.ok) {
    res.statusCode = body.error === "payload too large" ? 413 : 400;
    res.end(body.error);
    logger.warn({ error: body.error }, "webhook_body_error");
    return true;
  }

  const payload = body.value as Record<string, unknown>;

  // [SECURITY:TOKEN] Validate webhook token
  const tokenHeader = req.headers["x-webhook-token"] as string | undefined;
  const tokenQuery = url.searchParams.get("token");
  const token = tokenHeader || tokenQuery || undefined;

  if (!validateMegaAPIWebhookToken(token, config.webhookToken)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Unauthorized" }));
    logger.warn({}, "webhook_unauthorized");
    return true;
  }

  // [NORMALIZE:PAYLOAD] Normalize the webhook payload
  const normalized = normalizeMegaAPIWebhook(payload as any);
  if (!normalized) {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: "ignored" }));
    return true;
  }

  // [SECURITY:ALLOWLIST] Check allowlist for messages
  if (normalized.message) {
    if (!isAllowedSender(normalized.message.from, config.allowFrom)) {
      res.statusCode = 200;
      res.end(JSON.stringify({ status: "rejected_allowlist" }));
      logger.info({ from: normalized.message.from }, "message_rejected_allowlist");
      return true;
    }
  }

  // [DISPATCH:INBOUND] Route through dispatch pipeline
  // This fires all hooks: message_received, before_agent_dispatch, message_sent
  try {
    await processInboundMessage(normalized, {
      accountId: `megaapi_${config.instanceKey || "default"}`,
    });

    logger.info(
      {
        type: normalized.type,
        from: normalized.message?.from,
      },
      "webhook_processed"
    );
  } catch (error: any) {
    logger.error(
      {
        type: normalized.type,
        from: normalized.message?.from,
        error: error.message,
      },
      "webhook_process_error"
    );
    // Still return 200 to prevent webhook retries
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ status: "ok" }));
  return true;
}

/**
 * [HASH:MAIN] SHA-256 hashing utilities for content comparison
 *
 * Used to detect changes in workspace files without comparing full content.
 *
 * @version 1.0.0
 * @created 2026-01-29
 */

import { createHash } from "crypto";

// =============================================================================
// [HASH:FUNCTIONS] Hash utilities
// =============================================================================

/**
 * [FUNC:SHA256] Calculate SHA-256 hash of content
 *
 * @param content String content to hash
 * @returns 64-character hex string
 */
export function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * [FUNC:COMPARE] Check if two contents are identical by hash
 *
 * @param content1 First content string
 * @param content2 Second content string
 * @returns true if hashes match
 */
export function contentEquals(content1: string, content2: string): boolean {
  return sha256(content1) === sha256(content2);
}

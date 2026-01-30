/**
 * [TYPES:INSTANCE] Instance/connection types
 *
 * Provider-agnostic types for WhatsApp instance management.
 */

// =============================================================================
// [TYPE:INSTANCE_STATUS] Connection status
// =============================================================================

export type ConnectionState = "open" | "connecting" | "close" | "unknown";

export interface InstanceStatus {
  /** Connection state */
  state: ConnectionState;
  /** Phone number connected (if any) */
  phoneNumber?: string;
  /** Whether instance is authenticated */
  isAuthenticated: boolean;
  /** Last connection time */
  lastConnected?: Date;
  /** Provider-specific info */
  providerInfo?: Record<string, unknown>;
}

// =============================================================================
// [TYPE:QR_CODE] QR code for authentication
// =============================================================================

export type QRCodeFormat = "base64" | "image" | "terminal";

export interface QRCodeResult {
  /** QR code data */
  data: string;
  /** Format of the data */
  format: QRCodeFormat;
  /** Whether QR is still valid */
  valid: boolean;
  /** Expiration time */
  expiresAt?: Date;
}

// =============================================================================
// [TYPE:PAIRING_CODE] Pairing code (alternative to QR)
// =============================================================================

export interface PairingCodeResult {
  /** Pairing code (e.g., "1234-5678") */
  code: string;
  /** Phone number to pair with */
  phoneNumber: string;
  /** Expiration time */
  expiresAt: Date;
}

// =============================================================================
// [TYPE:WHATSAPP_CHECK] Check if number is on WhatsApp
// =============================================================================

export interface WhatsAppCheckResult {
  /** The phone number checked */
  phoneNumber: string;
  /** Whether the number is on WhatsApp */
  exists: boolean;
  /** JID if exists */
  jid?: string;
}

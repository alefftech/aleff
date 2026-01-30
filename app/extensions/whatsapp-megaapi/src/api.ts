/**
 * [API:MEGAAPI] MegaAPI HTTP Client
 *
 * Low-level HTTP client for MegaAPI Starter endpoints.
 * API Docs: https://apistart01.megaapi.com.br/docs/
 *
 * Endpoint patterns:
 * - Messages: /rest/sendMessage/{instance}/{type}
 * - Instance: /rest/instance/{action}/{instance}
 * - Presence: /rest/sendPresence/{instance}/{chatId}
 * - Groups: /rest/group/{action}/{instance}
 */

import { logger } from "./logger.js";

// =============================================================================
// [TYPE:CONFIG] API Configuration
// =============================================================================

export interface MegaAPIConfig {
  apiHost: string;
  instanceKey: string;
  apiToken: string;
}

// =============================================================================
// [TYPE:RESPONSE] API Response types
// =============================================================================

export interface MegaAPIResponse<T = any> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
  [key: string]: any;
}

// =============================================================================
// [CLASS:CLIENT] MegaAPI HTTP Client
// =============================================================================

export class MegaAPIClient {
  private config: MegaAPIConfig;
  private baseUrl: string;

  constructor(config: MegaAPIConfig) {
    this.config = config;
    this.baseUrl = `https://${config.apiHost}`;
  }

  // ===========================================================================
  // [METHOD:REQUEST] Generic API request
  // ===========================================================================

  private async request<T = any>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    logger.debug({ method, path, hasBody: !!body }, "api_request_started");

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseText = await response.text();
    let result: T;

    try {
      result = JSON.parse(responseText);
    } catch {
      if (!response.ok) {
        logger.error(
          { method, path, status: response.status, body: responseText },
          "api_request_failed_non_json"
        );
        throw new Error(`MegaAPI error (${response.status}): ${responseText}`);
      }
      result = responseText as T;
    }

    if (!response.ok) {
      const errorMsg =
        (result as any)?.error ||
        (result as any)?.message ||
        JSON.stringify(result);
      logger.error(
        { method, path, status: response.status, error: errorMsg },
        "api_request_failed"
      );
      throw new Error(`MegaAPI error (${response.status}): ${errorMsg}`);
    }

    logger.debug({ method, path, status: response.status }, "api_request_success");
    return result;
  }

  // ===========================================================================
  // [METHOD:SEND_MESSAGE] Send message (any type)
  // ===========================================================================

  async sendMessage(
    messageType: string,
    messageData: Record<string, unknown>
  ): Promise<MegaAPIResponse> {
    const path = `/rest/sendMessage/${this.config.instanceKey}/${messageType}`;

    logger.info(
      { messageType, to: messageData.to, hasMedia: !!messageData.url },
      "sending_message"
    );

    // [PAYLOAD:WRAPPER] MegaAPI requires messageData wrapper
    return this.request("POST", path, { messageData });
  }

  // ===========================================================================
  // [METHOD:PRESENCE] Send presence update
  // ===========================================================================

  async sendPresence(
    chatId: string,
    presenceType: "composing" | "recording" | "paused"
  ): Promise<MegaAPIResponse> {
    // [NORMALIZE:JID] Ensure proper JID format
    const jid = this.normalizeJid(chatId);
    const path = `/rest/sendPresence/${this.config.instanceKey}`;

    return this.request("POST", path, {
      chatId: jid,
      presence: presenceType,
    });
  }

  // ===========================================================================
  // [METHOD:READ] Mark as read
  // ===========================================================================

  async markAsRead(chatId: string, messageId?: string): Promise<MegaAPIResponse> {
    const jid = this.normalizeJid(chatId);
    const path = `/rest/chat/readMessage/${this.config.instanceKey}`;

    return this.request("POST", path, {
      chatId: jid,
      messageId,
    });
  }

  // ===========================================================================
  // [METHOD:INSTANCE] Instance operations
  // ===========================================================================

  async getInstanceStatus(): Promise<MegaAPIResponse> {
    const path = `/rest/instance/status/${this.config.instanceKey}`;
    return this.request("GET", path);
  }

  async getQRCode(format: "base64" | "image" = "base64"): Promise<MegaAPIResponse> {
    const endpoint = format === "image" ? "qrcode-image" : "qrcode-base64";
    const path = `/rest/instance/${endpoint}/${this.config.instanceKey}`;
    return this.request("GET", path);
  }

  async logout(): Promise<MegaAPIResponse> {
    const path = `/rest/instance/logout/${this.config.instanceKey}`;
    return this.request("POST", path);
  }

  async restart(): Promise<MegaAPIResponse> {
    const path = `/rest/instance/restart/${this.config.instanceKey}`;
    return this.request("POST", path);
  }

  async isOnWhatsApp(phoneNumber: string): Promise<MegaAPIResponse> {
    const path = `/rest/instance/isOnWhatsApp/${this.config.instanceKey}`;
    return this.request("POST", path, { phoneNumber: this.normalizeNumber(phoneNumber) });
  }

  // ===========================================================================
  // [METHOD:GROUPS] Group operations
  // ===========================================================================

  async listGroups(): Promise<MegaAPIResponse> {
    const path = `/rest/group/list/${this.config.instanceKey}`;
    return this.request("GET", path);
  }

  async getGroupInfo(groupId: string): Promise<MegaAPIResponse> {
    const path = `/rest/group/info/${this.config.instanceKey}`;
    return this.request("POST", path, { groupId });
  }

  async createGroup(
    name: string,
    participants: string[]
  ): Promise<MegaAPIResponse> {
    const path = `/rest/group/create/${this.config.instanceKey}`;
    return this.request("POST", path, {
      subject: name,
      participants: participants.map((p) => this.normalizeNumber(p)),
    });
  }

  async addGroupParticipants(
    groupId: string,
    participants: string[]
  ): Promise<MegaAPIResponse> {
    const path = `/rest/group/addParticipants/${this.config.instanceKey}`;
    return this.request("POST", path, {
      groupId,
      participants: participants.map((p) => this.normalizeNumber(p)),
    });
  }

  async removeGroupParticipants(
    groupId: string,
    participants: string[]
  ): Promise<MegaAPIResponse> {
    const path = `/rest/group/removeParticipants/${this.config.instanceKey}`;
    return this.request("POST", path, {
      groupId,
      participants: participants.map((p) => this.normalizeNumber(p)),
    });
  }

  async leaveGroup(groupId: string): Promise<MegaAPIResponse> {
    const path = `/rest/group/leave/${this.config.instanceKey}`;
    return this.request("POST", path, { groupId });
  }

  // ===========================================================================
  // [METHOD:WEBHOOK] Webhook operations
  // ===========================================================================

  async getWebhookConfig(): Promise<MegaAPIResponse> {
    const path = `/rest/webhook/status/${this.config.instanceKey}`;
    return this.request("GET", path);
  }

  async configureWebhook(url: string): Promise<MegaAPIResponse> {
    const path = `/rest/webhook/set/${this.config.instanceKey}`;
    return this.request("POST", path, { webhookUrl: url });
  }

  // ===========================================================================
  // [METHOD:DELETE] Delete message
  // ===========================================================================

  async deleteMessage(
    chatId: string,
    messageId: string,
    forEveryone: boolean = true
  ): Promise<MegaAPIResponse> {
    const jid = this.normalizeJid(chatId);
    const path = `/rest/chat/deleteMessage/${this.config.instanceKey}`;
    return this.request("POST", path, {
      chatId: jid,
      messageId,
      forEveryone,
    });
  }

  // ===========================================================================
  // [UTIL:NORMALIZE] Normalize phone numbers and JIDs
  // ===========================================================================

  normalizeNumber(number: string): string {
    // Remove everything except digits
    return number.replace(/[^\d]/g, "");
  }

  normalizeJid(input: string): string {
    // Already a JID
    if (input.includes("@")) {
      return input;
    }
    // Clean and add suffix
    const clean = this.normalizeNumber(input);
    return `${clean}@s.whatsapp.net`;
  }

  extractNumber(jid: string): string {
    return jid.split("@")[0];
  }
}

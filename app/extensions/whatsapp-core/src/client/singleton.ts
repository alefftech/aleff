/**
 * [CLIENT:SINGLETON] WhatsApp Client Singleton
 *
 * Uses Symbol.for() pattern for cross-module singleton access.
 * Pattern copied from shared/postgres/pool.ts in moltbot.
 *
 * Usage:
 *   import { getWhatsAppClient } from "whatsapp-core";
 *
 *   // Register provider (done by adapter plugin)
 *   const client = getWhatsAppClient();
 *   client.registerProvider("megaapi", megaApiProviderFactory);
 *
 *   // Use provider (done by tools plugin)
 *   client.useProvider("megaapi", config);
 *   await client.messages.sendText("5511999999999", "Hello!");
 */

import type {
  WhatsAppProvider,
  ProviderFactory,
  ProviderConfig,
  ProviderInfo,
} from "../types/provider.js";
import { logger } from "../logger.js";

// =============================================================================
// [SYMBOL:CLIENT] Global singleton symbol
// =============================================================================

const CLIENT_SYMBOL = Symbol.for("aleffai.whatsapp.client");

// =============================================================================
// [TYPE:GLOBAL] Augment global for singleton storage
// =============================================================================

interface GlobalWithClient {
  [CLIENT_SYMBOL]?: WhatsAppClient;
}

// =============================================================================
// [CLASS:CLIENT] WhatsApp Client
// =============================================================================

export class WhatsAppClient {
  private providers: Map<string, ProviderFactory> = new Map();
  private activeProvider: WhatsAppProvider | null = null;
  private activeProviderId: string | null = null;

  // ===========================================================================
  // [METHOD:REGISTER] Register a provider factory
  // ===========================================================================

  registerProvider(id: string, factory: ProviderFactory): void {
    if (this.providers.has(id)) {
      logger.warn({ providerId: id }, "provider_already_registered");
      return;
    }

    this.providers.set(id, factory);
    logger.info({ providerId: id }, "provider_registered");
  }

  // ===========================================================================
  // [METHOD:USE] Activate a provider with config
  // ===========================================================================

  useProvider(id: string, config: ProviderConfig): void {
    const factory = this.providers.get(id);
    if (!factory) {
      throw new Error(
        `WhatsApp provider "${id}" not registered. Available: ${[...this.providers.keys()].join(", ")}`
      );
    }

    this.activeProvider = factory(config);
    this.activeProviderId = id;

    logger.info(
      {
        providerId: id,
        providerName: this.activeProvider.info.name,
        providerVersion: this.activeProvider.info.version,
      },
      "provider_activated"
    );
  }

  // ===========================================================================
  // [METHOD:GET] Get active provider (throws if none)
  // ===========================================================================

  getProvider(): WhatsAppProvider {
    if (!this.activeProvider) {
      throw new Error(
        "No WhatsApp provider configured. Call client.useProvider() first."
      );
    }
    return this.activeProvider;
  }

  // ===========================================================================
  // [METHOD:INFO] Get active provider info
  // ===========================================================================

  getProviderInfo(): ProviderInfo | null {
    return this.activeProvider?.info ?? null;
  }

  // ===========================================================================
  // [METHOD:CHECK] Check if provider is configured
  // ===========================================================================

  isConfigured(): boolean {
    return this.activeProvider !== null;
  }

  // ===========================================================================
  // [METHOD:LIST] List registered providers
  // ===========================================================================

  listProviders(): string[] {
    return [...this.providers.keys()];
  }

  // ===========================================================================
  // [GETTER:NAMESPACES] Convenience getters for provider namespaces
  // ===========================================================================

  get instance() {
    return this.getProvider().instance;
  }

  get messages() {
    return this.getProvider().messages;
  }

  get presence() {
    return this.getProvider().presence;
  }

  get groups() {
    return this.getProvider().groups;
  }

  get webhook() {
    return this.getProvider().webhook;
  }
}

// =============================================================================
// [FUNC:GET_CLIENT] Get or create singleton instance
// =============================================================================

export function getWhatsAppClient(): WhatsAppClient {
  const globalObj = globalThis as GlobalWithClient;

  if (!globalObj[CLIENT_SYMBOL]) {
    globalObj[CLIENT_SYMBOL] = new WhatsAppClient();
    logger.info({}, "whatsapp_client_created");
  }

  return globalObj[CLIENT_SYMBOL];
}

// =============================================================================
// [FUNC:RESET] Reset client (for testing)
// =============================================================================

export function resetWhatsAppClient(): void {
  const globalObj = globalThis as GlobalWithClient;
  delete globalObj[CLIENT_SYMBOL];
  logger.info({}, "whatsapp_client_reset");
}

/**
 * [PLUGIN:MAIN] Aleff Workspace v1.0
 *
 * Workspace file persistence plugin:
 * - Persists workspace files (IDENTITY.md, SOUL.md, etc.) to PostgreSQL
 * - Survives container/server failures
 * - Enables dashboard access for clients
 * - Maintains version history for rollback
 *
 * Architecture:
 * - Boot: DB → local filesystem sync
 * - Agent updates: DB + local (atomic)
 * - Dashboard updates: DB only (next boot syncs)
 * - DB is source of truth
 *
 * 3 Tools registered:
 * - update_workspace_file: Update a workspace file
 * - get_workspace_file: Read a workspace file
 * - list_workspace_files: List all workspace files
 *
 * Boot:
 * - Sync DB → local immediately on plugin load
 *
 * @version 1.0.0
 * @created 2026-01-29
 */

import type { MoltbotPluginApi } from "../../src/plugins/types.js";
import { isPostgresConfigured, getPoolWithRetry } from "./src/postgres.js";
import { syncFromDb, SyncConfig } from "./src/sync.js";
import { logger } from "./src/logger.js";
import {
  setToolsConfig,
  createUpdateWorkspaceFileTool,
  createGetWorkspaceFileTool,
  createListWorkspaceFilesTool,
} from "./src/tools.js";

// =============================================================================
// [PLUGIN:CONFIG] Plugin configuration
// =============================================================================

interface AleffWorkspaceConfig {
  enabled?: boolean;
  agentId?: string;
  workspacePath?: string;
  monitoredFiles?: string[];
  dbIsSourceOfTruth?: boolean;
}

const DEFAULT_CONFIG: Required<AleffWorkspaceConfig> = {
  enabled: false,
  agentId: "aleff",
  workspacePath: "/app/workspace/agents/aleff",
  monitoredFiles: ["IDENTITY.md", "SOUL.md", "AGENTS.md", "TOOLS.md", "USER.md"],
  dbIsSourceOfTruth: true,
};

// =============================================================================
// [PLUGIN:HELPERS] Utility functions
// =============================================================================

/**
 * [FUNC:CHECK_ENABLED] Check if plugin should be enabled
 *
 * Plugin is opt-in via config or env var.
 *
 * @param config Plugin config
 * @returns true if plugin should be enabled
 */
function isEnabled(config: AleffWorkspaceConfig): boolean {
  // [CHECK:ENV] Check env var first
  if (process.env.ALEFF_WORKSPACE_ENABLED === "true") {
    return true;
  }

  // [CHECK:CONFIG] Then check config
  return config.enabled === true;
}

/**
 * [FUNC:BUILD_SYNC_CONFIG] Build sync config from plugin config
 *
 * @param config Plugin config
 * @returns Sync config
 */
function buildSyncConfig(config: AleffWorkspaceConfig): SyncConfig {
  return {
    agentId: config.agentId || DEFAULT_CONFIG.agentId,
    workspacePath: config.workspacePath || DEFAULT_CONFIG.workspacePath,
    monitoredFiles: config.monitoredFiles || DEFAULT_CONFIG.monitoredFiles,
    dbIsSourceOfTruth: config.dbIsSourceOfTruth ?? DEFAULT_CONFIG.dbIsSourceOfTruth,
  };
}

// =============================================================================
// [PLUGIN:REGISTER] Main registration function
// =============================================================================

export default function register(api: MoltbotPluginApi, config: AleffWorkspaceConfig = {}) {
  const pluginLogger = api.logger;
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // ==========================================================================
  // [PLUGIN:STARTUP] Check if enabled
  // ==========================================================================

  if (!isEnabled(cfg)) {
    logger.info(
      { enabled: false, envVar: process.env.ALEFF_WORKSPACE_ENABLED },
      "plugin_disabled"
    );
    pluginLogger.info(
      "Aleff Workspace: Disabled. Set ALEFF_WORKSPACE_ENABLED=true or enabled: true in config to enable."
    );
    return;
  }

  // ==========================================================================
  // [PLUGIN:POSTGRES] Check PostgreSQL configuration
  // ==========================================================================

  if (!isPostgresConfigured()) {
    logger.warn({ enabled: true }, "postgres_not_configured");
    pluginLogger.warn(
      "Aleff Workspace: PostgreSQL not configured. " +
        "Set DATABASE_URL or POSTGRES_* env vars to enable persistence."
    );
    return;
  }

  // ==========================================================================
  // [PLUGIN:CONFIG] Build and set sync config
  // ==========================================================================

  const syncConfig = buildSyncConfig(cfg);
  setToolsConfig(syncConfig);

  logger.info(
    {
      agentId: syncConfig.agentId,
      workspacePath: syncConfig.workspacePath,
      monitoredFiles: syncConfig.monitoredFiles,
      dbIsSourceOfTruth: syncConfig.dbIsSourceOfTruth,
    },
    "plugin_config_loaded"
  );

  // ==========================================================================
  // [PLUGIN:TOOLS] Register agent tools (3 total)
  // ==========================================================================

  api.registerTool(createUpdateWorkspaceFileTool());
  api.registerTool(createGetWorkspaceFileTool());
  api.registerTool(createListWorkspaceFilesTool());

  logger.info({ tools: 3 }, "tools_registered");

  // ==========================================================================
  // [BOOT:SYNC] Sync DB → local on plugin load with retry
  // ==========================================================================
  // Runs async to not block plugin registration.
  // Uses getPoolWithRetry() to handle cold boot when postgres is still starting.
  // Retries with exponential backoff (1s, 2s, 4s, 8s, 16s) up to 5 attempts.

  logger.info({}, "boot_sync_starting");

  getPoolWithRetry()
    .then(() => syncFromDb(syncConfig))
    .then((result) => {
      logger.info(
        {
          synced: result.synced,
          seeded: result.seeded,
          skipped: result.skipped,
          errors: result.errors.length,
        },
        "boot_sync_completed"
      );

      if (result.errors.length > 0) {
        pluginLogger.warn(
          `Aleff Workspace: Boot sync completed with ${result.errors.length} errors: ${result.errors.join(", ")}`
        );
      } else {
        pluginLogger.info(
          `Aleff Workspace: Boot sync completed. Synced=${result.synced}, Seeded=${result.seeded}, Skipped=${result.skipped}`
        );
      }
    })
    .catch((err: unknown) => {
      const errorMessage = err instanceof Error ? err.stack || err.message : String(err);
      logger.error(
        { error: errorMessage },
        "boot_sync_failed_after_retries"
      );
      pluginLogger.error(`Aleff Workspace: Boot sync failed after retries: ${errorMessage}`);
    });

  // ==========================================================================
  // [PLUGIN:READY]
  // ==========================================================================

  logger.info(
    {
      version: "1.0.0",
      tools: 3,
      agentId: syncConfig.agentId,
      monitoredFiles: syncConfig.monitoredFiles,
    },
    "plugin_registered"
  );

  pluginLogger.info(
    `Aleff Workspace v1.0 registered. Tools: update_workspace_file, get_workspace_file, list_workspace_files. ` +
      `Monitoring: ${syncConfig.monitoredFiles.join(", ")}`
  );
}

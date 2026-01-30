/**
 * [TOOLS:MAIN] Agent tools for workspace file management
 *
 * Provides tools for agents to:
 * - update_workspace_file: Update a workspace file (persisted to DB)
 * - get_workspace_file: Read a workspace file from DB
 * - list_workspace_files: List all workspace files
 *
 * @version 1.1.0
 * @updated 2026-01-30
 */

import { type AnyAgentTool, jsonResult } from "../../../src/agents/tools/common.js";
import { getWorkspaceFile, getWorkspaceFilesFromDb, updateWorkspaceFile, SyncConfig } from "./sync.js";
import { logger } from "./logger.js";

// =============================================================================
// [TOOLS:CONFIG] Module-level config (set by plugin init)
// =============================================================================

let syncConfig: SyncConfig | null = null;

/**
 * [FUNC:SET_CONFIG] Set sync config for tools
 *
 * Called by plugin init to configure tools with sync settings.
 *
 * @param config Sync configuration
 */
export function setToolsConfig(config: SyncConfig): void {
  syncConfig = config;
  logger.info({ agentId: config.agentId }, "tools_config_set");
}

/**
 * [FUNC:GET_CONFIG] Get current sync config
 *
 * @returns Sync config or throws if not set
 */
function getConfig(): SyncConfig {
  if (!syncConfig) {
    throw new Error("Workspace tools not configured. Plugin not initialized.");
  }
  return syncConfig;
}

// =============================================================================
// [TOOL:UPDATE] update_workspace_file
// =============================================================================

/**
 * [FUNC:UPDATE_TOOL] Create the update_workspace_file tool
 *
 * Allows agent to update workspace files like IDENTITY.md, SOUL.md, etc.
 * Changes are persisted to PostgreSQL with version history.
 *
 * @returns Tool definition
 */
export function createUpdateWorkspaceFileTool(): AnyAgentTool {
  return {
    name: "update_workspace_file",
    description:
      "Update a workspace file (e.g., IDENTITY.md, SOUL.md, USER.md). " +
      "Changes are persisted to PostgreSQL with version history for rollback. " +
      "Use this when you need to update your identity, remember user preferences, or modify your configuration. " +
      "The update is atomic and survives container restarts.",
    parameters: {
      type: "object",
      properties: {
        file_name: {
          type: "string",
          description: "Name of the file to update (e.g., 'IDENTITY.md', 'SOUL.md', 'USER.md')",
        },
        content: {
          type: "string",
          description: "New content for the file (full content, not a diff)",
        },
        reason: {
          type: "string",
          description: "Brief reason for the change (for audit trail)",
        },
      },
      required: ["file_name", "content"],
    },
    async execute(
      _toolCallId: string,
      params: { file_name: string; content: string; reason?: string }
    ) {
      const config = getConfig();
      const { file_name: fileName, content, reason } = params;

      logger.info(
        {
          tool: "update_workspace_file",
          fileName,
          contentLength: content.length,
          reason,
        },
        "tool_invoked"
      );

      try {
        // [VALIDATION:FILE] Check if file is in monitored list
        if (!config.monitoredFiles.includes(fileName)) {
          const allowed = config.monitoredFiles.join(", ");
          logger.warn(
            { tool: "update_workspace_file", fileName, allowed },
            "file_not_in_monitored_list"
          );
          return jsonResult({
            success: false,
            error: `File '${fileName}' is not a managed workspace file. Allowed files: ${allowed}`,
          });
        }

        // [UPDATE:EXECUTE] Update the file
        const version = await updateWorkspaceFile(
          config,
          fileName,
          content,
          "agent",
          reason
        );

        logger.info(
          {
            tool: "update_workspace_file",
            fileName,
            version,
            success: true,
          },
          "tool_completed"
        );

        return jsonResult({
          success: true,
          file_name: fileName,
          version,
          message: `Updated ${fileName} to version ${version}`,
        });
      } catch (err) {
        logger.error(
          {
            tool: "update_workspace_file",
            fileName,
            error: String(err),
          },
          "tool_failed"
        );

        return jsonResult({
          success: false,
          error: String(err),
        });
      }
    },
  };
}

// =============================================================================
// [TOOL:GET] get_workspace_file
// =============================================================================

/**
 * [FUNC:GET_TOOL] Create the get_workspace_file tool
 *
 * Allows agent to read workspace files from the database.
 *
 * @returns Tool definition
 */
export function createGetWorkspaceFileTool(): AnyAgentTool {
  return {
    name: "get_workspace_file",
    description:
      "Read a workspace file from the database (e.g., IDENTITY.md, SOUL.md, USER.md). " +
      "Returns the current content and version information. " +
      "Use this to check your current identity, configuration, or user preferences.",
    parameters: {
      type: "object",
      properties: {
        file_name: {
          type: "string",
          description: "Name of the file to read (e.g., 'IDENTITY.md', 'SOUL.md', 'USER.md')",
        },
      },
      required: ["file_name"],
    },
    async execute(
      _toolCallId: string,
      params: { file_name: string }
    ) {
      const config = getConfig();
      const { file_name: fileName } = params;

      logger.info(
        { tool: "get_workspace_file", fileName },
        "tool_invoked"
      );

      try {
        const file = await getWorkspaceFile(config.agentId, fileName);

        if (!file) {
          logger.info(
            { tool: "get_workspace_file", fileName, found: false },
            "tool_completed"
          );

          return jsonResult({
            success: true,
            found: false,
            file_name: fileName,
            message: `File '${fileName}' not found in database`,
          });
        }

        logger.info(
          {
            tool: "get_workspace_file",
            fileName,
            found: true,
            version: file.version,
            contentLength: file.content.length,
          },
          "tool_completed"
        );

        return jsonResult({
          success: true,
          found: true,
          file_name: file.file_name,
          content: file.content,
          version: file.version,
          updated_at: file.updated_at,
          created_by: file.created_by,
        });
      } catch (err) {
        logger.error(
          {
            tool: "get_workspace_file",
            fileName,
            error: String(err),
          },
          "tool_failed"
        );

        return jsonResult({
          success: false,
          error: String(err),
        });
      }
    },
  };
}

// =============================================================================
// [TOOL:LIST] list_workspace_files
// =============================================================================

/**
 * [FUNC:LIST_TOOL] Create the list_workspace_files tool
 *
 * Lists all workspace files for the current agent.
 *
 * @returns Tool definition
 */
export function createListWorkspaceFilesTool(): AnyAgentTool {
  return {
    name: "list_workspace_files",
    description:
      "List all workspace files stored in the database. " +
      "Returns file names, versions, and last update times. " +
      "Use this to see what workspace files are available.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute(_toolCallId: string) {
      const config = getConfig();

      logger.info(
        { tool: "list_workspace_files", agentId: config.agentId },
        "tool_invoked"
      );

      try {
        const files = await getWorkspaceFilesFromDb(config.agentId);

        const fileList = files.map((f) => ({
          file_name: f.file_name,
          version: f.version,
          updated_at: f.updated_at,
          created_by: f.created_by,
          content_length: f.content.length,
        }));

        logger.info(
          {
            tool: "list_workspace_files",
            filesCount: files.length,
          },
          "tool_completed"
        );

        return jsonResult({
          success: true,
          agent_id: config.agentId,
          files: fileList,
          monitored_files: config.monitoredFiles,
        });
      } catch (err) {
        logger.error(
          {
            tool: "list_workspace_files",
            error: String(err),
          },
          "tool_failed"
        );

        return jsonResult({
          success: false,
          error: String(err),
        });
      }
    },
  };
}

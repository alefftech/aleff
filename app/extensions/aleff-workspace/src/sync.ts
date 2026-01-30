/**
 * [SYNC:MAIN] Workspace file synchronization between PostgreSQL and filesystem
 *
 * Handles:
 * - Boot sync: DB → local filesystem
 * - Seed: local → DB (first run)
 * - Conflict resolution: DB wins (source of truth)
 *
 * @version 1.0.0
 * @created 2026-01-29
 */

import * as fs from "fs";
import * as path from "path";
import { query, queryOne, execute } from "./postgres.js";
import { sha256 } from "./hash.js";
import { logger } from "./logger.js";

// =============================================================================
// [SYNC:TYPES] Type definitions
// =============================================================================

export interface WorkspaceFile {
  id: string;
  agent_id: string;
  file_name: string;
  file_path: string | null;
  content: string;
  content_hash: string | null;
  version: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface SyncResult {
  synced: number;
  seeded: number;
  skipped: number;
  errors: string[];
}

export interface SyncConfig {
  agentId: string;
  workspacePath: string;
  monitoredFiles: string[];
  dbIsSourceOfTruth: boolean;
}

// =============================================================================
// [SYNC:CONSTANTS] Default configuration
// =============================================================================

const MAX_FILE_SIZE = 1024 * 1024; // 1MB limit per file

// =============================================================================
// [SYNC:DB] Database operations
// =============================================================================

/**
 * [FUNC:GET_ALL] Get all active workspace files for an agent
 *
 * @param agentId Agent identifier
 * @returns Array of workspace files
 */
export async function getWorkspaceFilesFromDb(agentId: string): Promise<WorkspaceFile[]> {
  const sql = `
    SELECT id, agent_id, file_name, file_path, content, content_hash,
           version, is_active, metadata, created_at, updated_at, created_by
    FROM workspace_files
    WHERE agent_id = $1 AND is_active = true
    ORDER BY file_name
  `;

  return query<WorkspaceFile>(sql, [agentId]);
}

/**
 * [FUNC:GET_ONE] Get a specific workspace file
 *
 * @param agentId Agent identifier
 * @param fileName File name (e.g., 'IDENTITY.md')
 * @returns Workspace file or null
 */
export async function getWorkspaceFile(
  agentId: string,
  fileName: string
): Promise<WorkspaceFile | null> {
  const sql = `
    SELECT id, agent_id, file_name, file_path, content, content_hash,
           version, is_active, metadata, created_at, updated_at, created_by
    FROM workspace_files
    WHERE agent_id = $1 AND file_name = $2 AND is_active = true
    LIMIT 1
  `;

  return queryOne<WorkspaceFile>(sql, [agentId, fileName]);
}

/**
 * [FUNC:SAVE] Save or update a workspace file using the stored function
 *
 * @param agentId Agent identifier
 * @param fileName File name
 * @param content File content
 * @param changedBy Who made the change
 * @param changeReason Optional reason
 * @returns New version number
 */
export async function saveWorkspaceFile(
  agentId: string,
  fileName: string,
  content: string,
  changedBy: string = "system",
  changeReason?: string
): Promise<number> {
  // [VALIDATION:SIZE] Check file size limit
  if (content.length > MAX_FILE_SIZE) {
    throw new Error(`File ${fileName} exceeds max size of ${MAX_FILE_SIZE} bytes`);
  }

  const sql = `SELECT update_workspace_file($1, $2, $3, $4, $5) as version`;
  const result = await queryOne<{ version: number }>(sql, [
    agentId,
    fileName,
    content,
    changedBy,
    changeReason || null,
  ]);

  return result?.version || 1;
}

// =============================================================================
// [SYNC:LOCAL] Local filesystem operations
// =============================================================================

/**
 * [FUNC:READ_LOCAL] Read a file from local filesystem
 *
 * @param filePath Absolute path to file
 * @returns File content or null if not found
 */
export function readLocalFile(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      logger.warn(
        { filePath, size: stats.size, maxSize: MAX_FILE_SIZE },
        "local_file_too_large"
      );
      return null;
    }

    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    logger.error(
      { filePath, error: String(err) },
      "read_local_file_failed"
    );
    return null;
  }
}

/**
 * [FUNC:WRITE_LOCAL] Write a file to local filesystem
 *
 * Creates parent directories if needed.
 *
 * @param filePath Absolute path to file
 * @param content File content
 * @returns true if successful
 */
export function writeLocalFile(filePath: string, content: string): boolean {
  try {
    // [STEP:DIR] Ensure parent directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info({ dir }, "created_directory");
    }

    // [STEP:WRITE] Write file
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  } catch (err) {
    logger.error(
      { filePath, error: String(err) },
      "write_local_file_failed"
    );
    return false;
  }
}

/**
 * [FUNC:BACKUP_LOCAL] Create backup of local file before overwriting
 *
 * @param filePath Original file path
 * @returns Backup path or null if no backup needed
 */
export function backupLocalFile(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const backupPath = `${filePath}.local.backup`;
    fs.copyFileSync(filePath, backupPath);
    logger.info({ original: filePath, backup: backupPath }, "local_file_backed_up");
    return backupPath;
  } catch (err) {
    logger.error(
      { filePath, error: String(err) },
      "backup_local_file_failed"
    );
    return null;
  }
}

// =============================================================================
// [SYNC:MAIN] Main sync functions
// =============================================================================

/**
 * [FUNC:SYNC_FROM_DB] Sync workspace files from DB to local filesystem
 *
 * Called on container boot. DB is source of truth.
 *
 * @param config Sync configuration
 * @returns Sync result summary
 */
export async function syncFromDb(config: SyncConfig): Promise<SyncResult> {
  const result: SyncResult = {
    synced: 0,
    seeded: 0,
    skipped: 0,
    errors: [],
  };

  logger.info(
    {
      agentId: config.agentId,
      workspacePath: config.workspacePath,
      monitoredFiles: config.monitoredFiles.length,
    },
    "sync_from_db_started"
  );

  // [STEP:FETCH] Get files from DB
  logger.info({}, "fetching_db_files");
  let dbFiles: WorkspaceFile[];
  try {
    dbFiles = await getWorkspaceFilesFromDb(config.agentId);
  } catch (fetchErr) {
    logger.error({ error: String(fetchErr) }, "fetch_db_files_error");
    throw fetchErr;
  }
  const dbFileMap = new Map(dbFiles.map((f) => [f.file_name, f]));

  logger.info({ dbFilesCount: dbFiles.length }, "db_files_fetched");

  // [STEP:SYNC] Process each monitored file
  for (const fileName of config.monitoredFiles) {
    const localPath = path.join(config.workspacePath, fileName);
    const dbFile = dbFileMap.get(fileName);
    const localContent = readLocalFile(localPath);

    try {
      if (dbFile) {
        // [CASE:DB_EXISTS] File exists in DB
        if (config.dbIsSourceOfTruth) {
          // [SYNC:OVERWRITE] DB → local
          const localHash = localContent ? sha256(localContent) : null;
          const dbHash = dbFile.content_hash || sha256(dbFile.content);

          if (localHash !== dbHash) {
            // [CONFLICT:BACKUP] Backup local before overwriting
            if (localContent) {
              backupLocalFile(localPath);
              logger.warn(
                { fileName, localHash, dbHash },
                "conflict_db_wins"
              );
            }

            // [SYNC:WRITE] Write DB content to local
            if (writeLocalFile(localPath, dbFile.content)) {
              result.synced++;
              logger.info(
                { fileName, version: dbFile.version },
                "synced_db_to_local"
              );
            } else {
              result.errors.push(`Failed to write ${fileName}`);
            }
          } else {
            result.skipped++;
            logger.debug({ fileName }, "file_unchanged_skipped");
          }
        }
      } else if (localContent) {
        // [CASE:SEED] File exists locally but not in DB - seed to DB
        const version = await saveWorkspaceFile(
          config.agentId,
          fileName,
          localContent,
          "system",
          "initial seed from local"
        );

        result.seeded++;
        logger.info(
          { fileName, version, contentLength: localContent.length },
          "seeded_local_to_db"
        );
      } else {
        // [CASE:MISSING] File doesn't exist anywhere
        result.skipped++;
        logger.debug({ fileName }, "file_not_found_skipped");
      }
    } catch (err) {
      result.errors.push(`${fileName}: ${String(err)}`);
      logger.error(
        { fileName, error: String(err) },
        "sync_file_error"
      );
    }
  }

  logger.info(
    {
      synced: result.synced,
      seeded: result.seeded,
      skipped: result.skipped,
      errors: result.errors.length,
    },
    "sync_from_db_completed"
  );

  return result;
}

/**
 * [FUNC:UPDATE_FILE] Update a workspace file (DB + local)
 *
 * Called by agent tool or dashboard.
 *
 * @param config Sync configuration
 * @param fileName File name
 * @param content New content
 * @param changedBy Who made the change
 * @param changeReason Optional reason
 * @returns New version number
 */
export async function updateWorkspaceFile(
  config: SyncConfig,
  fileName: string,
  content: string,
  changedBy: string = "agent",
  changeReason?: string
): Promise<number> {
  // [STEP:VALIDATE] Check if file is monitored
  if (!config.monitoredFiles.includes(fileName)) {
    throw new Error(`File ${fileName} is not in monitored files list`);
  }

  // [STEP:DB] Save to database first (source of truth)
  const version = await saveWorkspaceFile(
    config.agentId,
    fileName,
    content,
    changedBy,
    changeReason
  );

  logger.info(
    { fileName, version, changedBy, contentLength: content.length },
    "workspace_file_saved_to_db"
  );

  // [STEP:LOCAL] Write to local filesystem
  const localPath = path.join(config.workspacePath, fileName);
  if (!writeLocalFile(localPath, content)) {
    logger.warn(
      { fileName, localPath },
      "failed_to_write_local_after_db_save"
    );
  }

  return version;
}

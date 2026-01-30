/**
 * [TYPES:GROUPS] Group management types
 *
 * Provider-agnostic types for WhatsApp group operations.
 */

// =============================================================================
// [TYPE:GROUP_INFO] Group information
// =============================================================================

export interface GroupInfo {
  /** Group JID */
  id: string;
  /** Group name/subject */
  name: string;
  /** Group description */
  description?: string;
  /** Group owner JID */
  owner?: string;
  /** Creation timestamp */
  createdAt?: Date;
  /** Participants list */
  participants: GroupParticipant[];
  /** Whether you're admin */
  isAdmin: boolean;
  /** Group settings */
  settings?: GroupSettings;
}

export interface GroupParticipant {
  /** Participant JID */
  id: string;
  /** Participant name (if known) */
  name?: string;
  /** Role in group */
  role: "admin" | "superadmin" | "member";
}

export interface GroupSettings {
  /** Who can edit group info */
  editInfo: "all" | "admins";
  /** Who can send messages */
  sendMessages: "all" | "admins";
}

// =============================================================================
// [TYPE:GROUP_LIST] Group listing
// =============================================================================

export interface GroupListResult {
  /** List of groups */
  groups: GroupSummary[];
  /** Total count */
  total: number;
}

export interface GroupSummary {
  /** Group JID */
  id: string;
  /** Group name */
  name: string;
  /** Participant count */
  participantCount: number;
  /** Whether you're admin */
  isAdmin: boolean;
}

// =============================================================================
// [TYPE:GROUP_CREATE] Group creation options
// =============================================================================

export interface GroupCreateOptions {
  /** Group name/subject */
  name: string;
  /** Initial participants (phone numbers) */
  participants: string[];
  /** Group description */
  description?: string;
}

export interface GroupCreateResult {
  /** Created group ID */
  groupId: string;
  /** Invite link */
  inviteLink?: string;
}

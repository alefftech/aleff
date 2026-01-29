/**
 * Google Workspace Plugin for Aleff
 * Provides Gmail and Calendar tools using OAuth tokens
 */

import type { MoltbotPluginApi } from "../../src/plugins/types.js";

// Google API helpers
async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function gmailApi(endpoint: string, method = "GET", body?: unknown) {
  const token = await getAccessToken();
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/${endpoint}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function calendarApi(endpoint: string, method = "GET", body?: unknown) {
  const token = await getAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/${endpoint}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Calendar API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Plugin definition
const plugin = {
  id: "google-workspace",
  name: "Google Workspace",
  description: "Gmail and Calendar integration for Aleff",
  version: "1.0.0",

  register(api: MoltbotPluginApi) {
    const account = process.env.GOOGLE_ACCOUNT || "aleff@iavancada.com";
    api.logger.info(`Registering Google Workspace tools for ${account}`);

    // ==========================================================================
    // GMAIL TOOLS
    // ==========================================================================

    api.registerTool({
      name: "gmail_search",
      description: `Search emails in ${account} inbox. Use Gmail search syntax (from:, to:, subject:, is:unread, after:, before:).`,
      parameters: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: 'Gmail search query (e.g., "is:unread", "from:boss@company.com", "subject:urgent")',
          },
          maxResults: {
            type: "number",
            description: "Maximum emails to return (default: 10, max: 50)",
          },
        },
        required: ["query"],
      },
      async execute({ query, maxResults = 10 }: { query: string; maxResults?: number }) {
        const limit = Math.min(maxResults, 50);
        const data = await gmailApi(`messages?q=${encodeURIComponent(query)}&maxResults=${limit}`);

        if (!data.messages || data.messages.length === 0) {
          return { emails: [], message: "No emails found matching the query" };
        }

        // Fetch email details
        const emails = await Promise.all(
          data.messages.slice(0, limit).map(async (msg: { id: string }) => {
            const detail = await gmailApi(`messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`);
            const headers = detail.payload?.headers || [];
            const getHeader = (name: string) => headers.find((h: { name: string; value: string }) => h.name === name)?.value || "";

            return {
              id: msg.id,
              from: getHeader("From"),
              subject: getHeader("Subject"),
              date: getHeader("Date"),
              snippet: detail.snippet,
            };
          })
        );

        return { emails, count: emails.length };
      },
    });

    api.registerTool({
      name: "gmail_read",
      description: "Read full content of a specific email by ID",
      parameters: {
        type: "object" as const,
        properties: {
          emailId: {
            type: "string",
            description: "The email ID (from gmail_search results)",
          },
        },
        required: ["emailId"],
      },
      async execute({ emailId }: { emailId: string }) {
        const data = await gmailApi(`messages/${emailId}?format=full`);
        const headers = data.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: { name: string; value: string }) => h.name === name)?.value || "";

        // Extract body
        let body = "";
        const extractBody = (part: { mimeType?: string; body?: { data?: string }; parts?: unknown[] }): string => {
          if (part.mimeType === "text/plain" && part.body?.data) {
            return Buffer.from(part.body.data, "base64").toString("utf-8");
          }
          if (part.parts) {
            for (const p of part.parts) {
              const result = extractBody(p as typeof part);
              if (result) return result;
            }
          }
          return "";
        };

        body = extractBody(data.payload || {});
        if (!body && data.payload?.body?.data) {
          body = Buffer.from(data.payload.body.data, "base64").toString("utf-8");
        }

        return {
          id: emailId,
          from: getHeader("From"),
          to: getHeader("To"),
          subject: getHeader("Subject"),
          date: getHeader("Date"),
          body: body.slice(0, 10000), // Limit body size
        };
      },
    });

    api.registerTool({
      name: "gmail_unread_count",
      description: "Get count of unread emails in inbox",
      parameters: {
        type: "object" as const,
        properties: {},
      },
      async execute() {
        const data = await gmailApi("messages?q=is:unread&maxResults=1");
        const count = data.resultSizeEstimate || 0;
        return { unreadCount: count };
      },
    });

    // ==========================================================================
    // CALENDAR TOOLS
    // ==========================================================================

    api.registerTool({
      name: "calendar_today",
      description: "Get today's calendar events",
      parameters: {
        type: "object" as const,
        properties: {},
      },
      async execute() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const data = await calendarApi(
          `calendars/primary/events?timeMin=${startOfDay.toISOString()}&timeMax=${endOfDay.toISOString()}&singleEvents=true&orderBy=startTime`
        );

        const events = (data.items || []).map((event: {
          id: string;
          summary?: string;
          start?: { dateTime?: string; date?: string };
          end?: { dateTime?: string; date?: string };
          location?: string;
          attendees?: Array<{ email: string; responseStatus?: string }>;
        }) => ({
          id: event.id,
          title: event.summary || "(No title)",
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          location: event.location,
          attendees: event.attendees?.map(a => a.email).slice(0, 5),
        }));

        return {
          date: startOfDay.toISOString().split("T")[0],
          events,
          count: events.length
        };
      },
    });

    api.registerTool({
      name: "calendar_upcoming",
      description: "Get upcoming calendar events for the next N days",
      parameters: {
        type: "object" as const,
        properties: {
          days: {
            type: "number",
            description: "Number of days to look ahead (default: 7, max: 30)",
          },
        },
      },
      async execute({ days = 7 }: { days?: number }) {
        const limit = Math.min(days, 30);
        const now = new Date();
        const endDate = new Date(now.getTime() + limit * 24 * 60 * 60 * 1000);

        const data = await calendarApi(
          `calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${endDate.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=50`
        );

        const events = (data.items || []).map((event: {
          id: string;
          summary?: string;
          start?: { dateTime?: string; date?: string };
          end?: { dateTime?: string; date?: string };
          location?: string;
        }) => ({
          id: event.id,
          title: event.summary || "(No title)",
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          location: event.location,
        }));

        return {
          from: now.toISOString().split("T")[0],
          to: endDate.toISOString().split("T")[0],
          events,
          count: events.length
        };
      },
    });

    api.registerTool({
      name: "calendar_search",
      description: "Search calendar events by text query",
      parameters: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: "Text to search in event titles",
          },
          days: {
            type: "number",
            description: "Days to search ahead (default: 30)",
          },
        },
        required: ["query"],
      },
      async execute({ query, days = 30 }: { query: string; days?: number }) {
        const now = new Date();
        const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const data = await calendarApi(
          `calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${endDate.toISOString()}&q=${encodeURIComponent(query)}&singleEvents=true&orderBy=startTime&maxResults=20`
        );

        const events = (data.items || []).map((event: {
          id: string;
          summary?: string;
          start?: { dateTime?: string; date?: string };
          end?: { dateTime?: string; date?: string };
          location?: string;
        }) => ({
          id: event.id,
          title: event.summary || "(No title)",
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          location: event.location,
        }));

        return { query, events, count: events.length };
      },
    });

    api.logger.info("Google Workspace tools registered successfully");
  },
};

export default plugin;

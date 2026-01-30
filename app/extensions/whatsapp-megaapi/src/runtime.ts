/**
 * [RUNTIME:SINGLETON] Hold PluginRuntime reference for use across modules
 *
 * This allows modules like monitor.ts to access the PluginRuntime
 * without circular dependencies or prop drilling.
 */
import type { PluginRuntime } from "clawdbot/plugin-sdk";

let runtime: PluginRuntime | null = null;

export function setMegaAPIRuntime(next: PluginRuntime): void {
  runtime = next;
}

export function getMegaAPIRuntime(): PluginRuntime {
  if (!runtime) {
    throw new Error("MegaAPI runtime not initialized");
  }
  return runtime;
}

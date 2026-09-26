/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * Thin compatibility layer over the real AI client (`ai-client.ts`).
 * Kept as a separate module because several routes import from here.
 */

import {
  listModels,
  normalizeType,
  verifyProvider,
  defaultModelFor,
  type ConnectionTestResult,
  type ProviderType,
} from "./ai-client";

export type { ConnectionTestResult };

/**
 * Verifies a provider connection against the live upstream API:
 * authenticates, pulls the real model catalogue, then runs a real
 * minimal completion to prove generation works.
 */
export async function testProviderConnection(options: {
  providerType: string;
  apiKey: string;
  baseUrl?: string | null;
  apiFormat?: string | null;
  model?: string | null;
}): Promise<ConnectionTestResult> {
  return verifyProvider({
    type: options.providerType,
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
    apiFormat: options.apiFormat,
    model: options.model,
  });
}

/** Live model catalogue for a provider (used to refresh the model list). */
export async function fetchProviderModels(options: {
  providerType: string;
  apiKey: string;
  baseUrl?: string | null;
}): Promise<{ ok: boolean; models: string[]; message: string }> {
  const res = await listModels({
    type: options.providerType,
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
  });
  return { ok: res.ok, models: res.models, message: res.message };
}

/**
 * Fallback model list used only when the provider does not expose a
 * catalogue endpoint. Real API model IDs, never display names.
 */
export function getDefaultModels(providerType: string): string[] {
  const type: ProviderType = normalizeType(providerType);
  return [defaultModelFor(type)];
}

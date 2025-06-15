/**
 * tRPC Server Client
 * Provides server-side access to the tRPC API
 */

import { getApiClient } from "@/utils/api";

// Export the API client for server-side use
export const api = getApiClient();

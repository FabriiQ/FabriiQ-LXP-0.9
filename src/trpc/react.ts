/**
 * tRPC React Client
 * Provides React hooks for interacting with the tRPC API
 */

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../server/api/root";

export const api = createTRPCReact<AppRouter>(); 
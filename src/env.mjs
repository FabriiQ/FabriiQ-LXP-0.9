import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url().optional(),

    // LLM API keys
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_API_KEY: z.string().optional(),

    // LLM token limits
    LLM_INPUT_TOKEN_LIMIT: z.string().transform(Number).optional(),
    LLM_OUTPUT_TOKEN_LIMIT: z.string().transform(Number).optional(),
    LLM_MONTHLY_TOKEN_BUDGET: z.string().transform(Number).optional(),

    // LangGraph configuration
    LANGGRAPH_API_URL: z.string().url().optional(),
  },
  client: {
    // Add client-side env variables here if needed
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,

    // LLM API keys
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,

    // LLM token limits
    LLM_INPUT_TOKEN_LIMIT: process.env.LLM_INPUT_TOKEN_LIMIT,
    LLM_OUTPUT_TOKEN_LIMIT: process.env.LLM_OUTPUT_TOKEN_LIMIT,
    LLM_MONTHLY_TOKEN_BUDGET: process.env.LLM_MONTHLY_TOKEN_BUDGET,

    // LangGraph configuration
    LANGGRAPH_API_URL: process.env.LANGGRAPH_API_URL,
  },
});
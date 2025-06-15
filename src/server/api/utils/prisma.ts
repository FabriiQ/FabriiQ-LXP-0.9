import { prisma } from "../../db";

export { prisma };

// Service configuration type
export type ServiceConfig = {
  defaultStatus?: string;
  defaultSortField?: string;
  defaultSortOrder?: "asc" | "desc";
};

// JSON value type
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
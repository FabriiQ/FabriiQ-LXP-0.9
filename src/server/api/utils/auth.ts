import { hash, compare } from "bcryptjs";
import { SYSTEM_CONFIG } from "../constants";
import { logger } from "./logger";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SYSTEM_CONFIG.SECURITY.PASSWORD_HASH_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}


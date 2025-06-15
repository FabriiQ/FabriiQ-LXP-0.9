/**
 * Service Base Class
 * Provides common functionality for all services
 */

import { PrismaClient } from "@prisma/client";

export interface ServiceOptions {
  prisma: PrismaClient;
}

export class ServiceBase {
  protected prisma: PrismaClient;

  constructor(options: ServiceOptions) {
    this.prisma = options.prisma;
  }
} 
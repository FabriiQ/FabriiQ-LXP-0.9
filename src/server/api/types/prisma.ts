import { PrismaClient as PrismaClientType } from '.prisma/client';

export type PrismaClient = PrismaClientType;

export interface WithPrisma {
  prisma: PrismaClient;
}

export interface ServiceConfig extends WithPrisma {}

export type JsonValue = any;
export type InputJsonValue = any;
export type NullableJsonNullValueInput = 'DbNull' | 'JsonNull' | { DbNull: true } | { JsonNull: true } | null;

export type QueryMode = 'default' | 'insensitive';

export interface StringFilter {
  equals?: string;
  in?: string[];
  notIn?: string[];
  lt?: string;
  lte?: string;
  gt?: string;
  gte?: string;
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  mode?: QueryMode;
  not?: string | StringFilter;
}

export interface DateTimeFilter {
  equals?: Date | string;
  in?: Date[] | string[];
  notIn?: Date[] | string[];
  lt?: Date | string;
  lte?: Date | string;
  gt?: Date | string;
  gte?: Date | string;
  not?: Date | DateTimeFilter;
}

export interface BoolFilter {
  equals?: boolean;
  not?: boolean | BoolFilter;
}

export interface IntFilter {
  equals?: number;
  in?: number[];
  notIn?: number[];
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
  not?: number | IntFilter;
}

export interface FloatFilter {
  equals?: number;
  in?: number[];
  notIn?: number[];
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
  not?: number | FloatFilter;
}

export interface JsonFilter {
  equals?: InputJsonValue;
  path?: string[];
  string_contains?: string;
  string_starts_with?: string;
  string_ends_with?: string;
  array_contains?: InputJsonValue | null;
  array_starts_with?: InputJsonValue | null;
  array_ends_with?: InputJsonValue | null;
  lt?: InputJsonValue;
  lte?: InputJsonValue;
  gt?: InputJsonValue;
  gte?: InputJsonValue;
  not?: InputJsonValue;
} 
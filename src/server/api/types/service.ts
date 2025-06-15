import type { Prisma } from '.prisma/client';

export type JsonValue = Prisma.JsonValue;
export type InputJsonValue = Prisma.InputJsonValue;
export type NullableJsonNullValueInput = Prisma.NullableJsonNullValueInput;
export type QueryMode = Prisma.QueryMode;

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
  mode?: 'default' | 'insensitive';
  not?: string | StringFilter;
}

export interface DateTimeFilter {
  equals?: Date;
  in?: Date[];
  notIn?: Date[];
  lt?: Date;
  lte?: Date;
  gt?: Date;
  gte?: Date;
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
  equals?: Prisma.JsonValue;
  path?: string[];
  string_contains?: string;
  string_starts_with?: string;
  string_ends_with?: string;
  array_contains?: Prisma.JsonValue;
  array_starts_with?: Prisma.JsonValue;
  array_ends_with?: Prisma.JsonValue;
  lt?: Prisma.JsonValue;
  lte?: Prisma.JsonValue;
  gt?: Prisma.JsonValue;
  gte?: Prisma.JsonValue;
  not?: Prisma.JsonValue;
} 
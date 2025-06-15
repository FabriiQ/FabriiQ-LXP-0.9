declare module 'date-fns' {
  export function format(date: Date | number, format: string, options?: any): string;
  export function formatDistanceToNow(date: Date | number, options?: any): string;
  export function addDays(date: Date | number, amount: number): Date;
  export function subDays(date: Date | number, amount: number): Date;
  export function startOfWeek(date: Date | number, options?: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }): Date;
  export function endOfWeek(date: Date | number, options?: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }): Date;
  export function eachDayOfInterval(interval: { start: Date | number; end: Date | number }): Date[];
  export function isSameMonth(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function addMonths(date: Date | number, amount: number): Date;
  export function subMonths(date: Date | number, amount: number): Date;
  export function addWeeks(date: Date | number, amount: number): Date;
  export function subWeeks(date: Date | number, amount: number): Date;
  export function isWithinInterval(date: Date | number, interval: { start: Date | number; end: Date | number }): boolean;
  export function parse(dateString: string, formatString: string, referenceDate: Date | number, options?: any): Date;
  export function parseISO(argument: string, options?: { additionalDigits?: 0 | 1 | 2 }): Date;
  export function addMinutes(date: Date | number, amount: number): Date;
}

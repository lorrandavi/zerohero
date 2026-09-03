import { z } from 'zod';

export const ISO_DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const CYCLE_ID_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export const StatementPeriodSchema = z.object({
  /** "YYYY-MM" format indexed by the payment due month */
  cycleId: z.string().regex(CYCLE_ID_REGEX, 'cycleId must follow YYYY-MM format'),
  /** "YYYY-MM-DD" start date of the statement cycle (inclusive) */
  startDate: z.string().regex(ISO_DATE_REGEX, 'startDate must follow YYYY-MM-DD format'),
  /** "YYYY-MM-DD" closing date of the statement cycle (exclusive cutoff per ADR-0002) */
  closingDate: z.string().regex(ISO_DATE_REGEX, 'closingDate must follow YYYY-MM-DD format'),
  /** "YYYY-MM-DD" payment due date for the cycle */
  dueDate: z.string().regex(ISO_DATE_REGEX, 'dueDate must follow YYYY-MM-DD format'),
});

export type StatementPeriod = z.infer<typeof StatementPeriodSchema>;

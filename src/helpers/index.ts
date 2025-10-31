import { BadRequestException } from '@nestjs/common';
import { addHours, isBefore, subDays } from 'date-fns';
import { toZonedTime, format as formatWithTZ } from 'date-fns-tz';
import { DateTime } from 'luxon';
const BERLIN_TZ = 'Europe/Berlin';

export const formatCurrency = (
  amount: number,
  currency: string = 'NGN',
  locale: string = 'en-NG',
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatToGmtPlus1 = (date: Date): DateTime => {
  const updated = DateTime.fromJSDate(date, { zone: 'Europe/Berlin' });
  return updated;
};

export function parseDateWithTimezone(
  value: any,
  fieldName: string,
): string | undefined {
  if (!value) return undefined;
  const clean =
    typeof value === 'string' ? value.replace(/^"+|"+$/g, '') : value;

  const parsed = new Date(clean);
  if (isNaN(parsed.getTime())) {
    throw new BadRequestException(`Invalid ${fieldName}: ${value}`);
  }

  const zoned = toZonedTime(parsed, BERLIN_TZ);
  return formatWithTZ(zoned, "yyyy-MM-dd'T'HH:mm:ssXXX", {
    timeZone: BERLIN_TZ,
  });
}

export const isBeyondPeriod = (
  dateToCheck: Date | string,
  days: number,
): boolean => {
  if (!dateToCheck || !days) return false;

  const targetDate = new Date(dateToCheck);
  if (isNaN(targetDate.getTime())) return false;

  const cutoffDate = subDays(new Date(), days);

  return isBefore(targetDate, cutoffDate);
};

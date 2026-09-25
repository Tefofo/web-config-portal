import { Transform } from 'class-transformer';

/**
 * Converts empty-string query params to `undefined` so `@IsOptional()` treats
 * them as absent. Clients often send `?status=` for "no filter"; without this
 * an `@IsEnum` validator would reject the empty string.
 */
export function EmptyStringToUndefined(): PropertyDecorator {
  return Transform(({ value }) => (value === '' ? undefined : value));
}

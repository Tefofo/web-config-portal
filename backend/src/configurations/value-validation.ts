import { BadRequestException } from '@nestjs/common';
import { ConfigurationType } from '@prisma/client';

/**
 * Validates that a configuration value is consistent with its declared type.
 * Returns the (possibly normalized) value or throws BadRequestException.
 */
export function validateConfigurationValue(type: ConfigurationType, value: unknown): unknown {
  switch (type) {
    case 'STRING':
    case 'SELECT':
      if (typeof value !== 'string') {
        throw new BadRequestException('Value must be a string.');
      }
      return value;
    case 'NUMBER':
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new BadRequestException('Value must be a number.');
      }
      return value;
    case 'BOOLEAN':
      if (typeof value !== 'boolean') {
        throw new BadRequestException('Value must be a boolean.');
      }
      return value;
    case 'DATE': {
      if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
        throw new BadRequestException('Value must be a valid date string.');
      }
      return value;
    }
    case 'JSON':
      if (value === null || typeof value !== 'object') {
        throw new BadRequestException('Value must be a JSON object or array.');
      }
      return value;
    default:
      throw new BadRequestException('Unsupported configuration type.');
  }
}

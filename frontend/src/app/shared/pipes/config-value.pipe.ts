import { Pipe, PipeTransform } from '@angular/core';
import { ConfigurationType } from '../../core/models/configuration.model';

/** Renders a configuration value as a short, human-readable string for tables. */
@Pipe({ name: 'configValue' })
export class ConfigValuePipe implements PipeTransform {
  transform(value: unknown, type: ConfigurationType): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    switch (type) {
      case 'BOOLEAN':
        return value ? 'true' : 'false';
      case 'JSON':
        try {
          const text = typeof value === 'string' ? value : JSON.stringify(value);
          return text.length > 40 ? `${text.slice(0, 40)}…` : text;
        } catch {
          return String(value);
        }
      case 'DATE': {
        const date = value instanceof Date ? value : new Date(String(value));
        return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
      }
      default:
        return String(value);
    }
  }
}

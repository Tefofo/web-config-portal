import { ConfigValuePipe } from './config-value.pipe';

describe('ConfigValuePipe', () => {
  const pipe = new ConfigValuePipe();

  it('shows a dash for empty values', () => {
    expect(pipe.transform(null, 'STRING')).toBe('—');
    expect(pipe.transform('', 'STRING')).toBe('—');
  });

  it('renders booleans as true/false', () => {
    expect(pipe.transform(true, 'BOOLEAN')).toBe('true');
    expect(pipe.transform(false, 'BOOLEAN')).toBe('false');
  });

  it('serializes and truncates JSON', () => {
    const value = { a: 1, b: 'x'.repeat(60) };
    const result = pipe.transform(value, 'JSON');
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(41);
  });

  it('formats dates to yyyy-MM-dd', () => {
    expect(pipe.transform('2026-10-15T00:00:00.000Z', 'DATE')).toBe('2026-10-15');
  });

  it('stringifies numbers and strings', () => {
    expect(pipe.transform(42, 'NUMBER')).toBe('42');
    expect(pipe.transform('hello', 'STRING')).toBe('hello');
  });
});

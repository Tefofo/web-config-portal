import { HttpParams } from '@angular/common/http';

/** Generic paginated list envelope returned by list endpoints. */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Query parameters shared by list endpoints. */
export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}

/**
 * Shape returned by the real backend's paginated list endpoints. Uses
 * `data`/`limit` instead of the frontend's `items`/`pageSize`.
 */
export interface BackendPagedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

/**
 * Serialises a {@link ListQuery} to HttpParams.
 *
 * `pageSize` is translated to `limit` (what the real backend expects). We do
 * NOT also send a raw `pageSize` param, because the backend's ValidationPipe
 * runs with `forbidNonWhitelisted` and rejects unknown query params. The
 * in-memory mock also reads `limit`, so a single query object works against
 * either backend regardless of the `useMockApi` toggle.
 */
export function toListParams(query: ListQuery = {}): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    if (key === 'pageSize') {
      params = params.set('limit', String(value));
      continue;
    }
    params = params.set(key, String(value));
  }
  return params;
}

/**
 * Normalises a list response into the frontend's {@link PagedResult}.
 *
 * Tolerant of both backends:
 * - real backend: `{ data, total, page, limit }` -> maps `data`->`items`,
 *   `limit`->`pageSize`.
 * - in-memory mock: already `{ items, total, page, pageSize }` -> passed through.
 */
export function toPagedResult<T>(
  resp: PagedResult<T> | BackendPagedResult<T>,
): PagedResult<T> {
  if (resp && 'data' in resp && Array.isArray(resp.data)) {
    return {
      items: resp.data,
      total: resp.total,
      page: resp.page,
      pageSize: resp.limit,
    };
  }
  return resp as PagedResult<T>;
}

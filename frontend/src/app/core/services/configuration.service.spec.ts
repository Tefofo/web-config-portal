import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ConfigurationService } from './configuration.service';
import { Configuration } from '../models/configuration.model';
import { PagedResult } from '../models/api.model';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/configurations`;

describe('ConfigurationService', () => {
  let service: ConfigurationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConfigurationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('builds a paginated, filtered list query', () => {
    let result: PagedResult<Configuration> | undefined;
    service.list({ page: 2, pageSize: 25, search: 'flag', status: 'ACTIVE' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('page')).toBe('2');
    // pageSize is translated to `limit` (the backend rejects unknown params);
    // no raw `pageSize` is sent.
    expect(req.request.params.get('limit')).toBe('25');
    expect(req.request.params.get('pageSize')).toBeNull();
    expect(req.request.params.get('search')).toBe('flag');
    expect(req.request.params.get('status')).toBe('ACTIVE');

    req.flush({ items: [], total: 0, page: 2, pageSize: 25 });
    expect(result?.page).toBe(2);
  });

  it('maps the backend {data,limit} envelope into PagedResult', () => {
    let result: PagedResult<Configuration> | undefined;
    service.list({ page: 1, pageSize: 10 }).subscribe((r) => (result = r));

    const req = httpMock.expectOne((r) => r.url === BASE);
    req.flush({ data: [], total: 3, page: 1, limit: 10, totalPages: 1 });

    expect(result).toEqual({ items: [], total: 3, page: 1, pageSize: 10 });
  });

  it('posts to the enable endpoint', () => {
    service.enable('cfg-1').subscribe();
    const req = httpMock.expectOne(`${BASE}/cfg-1/enable`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('updates a configuration with PATCH', () => {
    service.update('cfg-1', { name: 'Renamed' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/cfg-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deletes a configuration by id', () => {
    service.delete('cfg-9').subscribe();
    const req = httpMock.expectOne(`${BASE}/cfg-9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('duplicates a configuration with overrides', () => {
    service.duplicate('cfg-1', { key: 'new.key' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/cfg-1/duplicate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ key: 'new.key' });
    req.flush({});
  });
});

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BackendPagedResult,
  ListQuery,
  PagedResult,
  toListParams,
  toPagedResult,
} from '../models/api.model';
import { AuditEvent } from '../models/audit.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/audit-logs`;

  list(query?: ListQuery): Observable<PagedResult<AuditEvent>> {
    return this.http
      .get<PagedResult<AuditEvent> | BackendPagedResult<AuditEvent>>(this.baseUrl, {
        params: toListParams(query),
      })
      .pipe(map((resp) => toPagedResult(resp)));
  }
}

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
import {
  Configuration,
  CreateConfigurationRequest,
  UpdateConfigurationRequest,
} from '../models/configuration.model';

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/configurations`;

  list(query?: ListQuery): Observable<PagedResult<Configuration>> {
    return this.http
      .get<PagedResult<Configuration> | BackendPagedResult<Configuration>>(this.baseUrl, {
        params: toListParams(query),
      })
      .pipe(map((resp) => toPagedResult(resp)));
  }

  get(id: string): Observable<Configuration> {
    return this.http.get<Configuration>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateConfigurationRequest): Observable<Configuration> {
    return this.http.post<Configuration>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateConfigurationRequest): Observable<Configuration> {
    return this.http.patch<Configuration>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  duplicate(id: string, overrides: Partial<CreateConfigurationRequest>): Observable<Configuration> {
    return this.http.post<Configuration>(`${this.baseUrl}/${id}/duplicate`, overrides);
  }

  enable(id: string): Observable<Configuration> {
    return this.http.post<Configuration>(`${this.baseUrl}/${id}/enable`, {});
  }

  disable(id: string): Observable<Configuration> {
    return this.http.post<Configuration>(`${this.baseUrl}/${id}/disable`, {});
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiKeyMetadata, CreateApiKeyRequest, CreatedApiKey } from '../models/api-key.model';
import {
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/applications`;

  list(): Observable<Application[]> {
    return this.http.get<Application[]>(this.baseUrl);
  }

  get(id: string): Observable<Application> {
    return this.http.get<Application>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateApplicationRequest): Observable<Application> {
    return this.http.post<Application>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateApplicationRequest): Observable<Application> {
    return this.http.patch<Application>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ---- API keys (nested under an application) ----

  listKeys(applicationId: string): Observable<ApiKeyMetadata[]> {
    return this.http.get<ApiKeyMetadata[]>(`${this.baseUrl}/${applicationId}/api-keys`);
  }

  createKey(applicationId: string, payload: CreateApiKeyRequest): Observable<CreatedApiKey> {
    return this.http.post<CreatedApiKey>(`${this.baseUrl}/${applicationId}/api-keys`, payload);
  }

  revokeKey(applicationId: string, keyId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${applicationId}/api-keys/${keyId}`);
  }
}

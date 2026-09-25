import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SystemSettings } from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/settings`;

  get(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(this.baseUrl);
  }

  update(payload: Partial<SystemSettings>): Observable<SystemSettings> {
    return this.http.put<SystemSettings>(this.baseUrl, payload);
  }
}

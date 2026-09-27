import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SiteView, UpdateSiteRequest } from '../models/site.model';

/** Reads and updates the current tenant's marketing website configuration. */
@Injectable({ providedIn: 'root' })
export class WebsiteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sites`;

  getMine(): Observable<SiteView> {
    return this.http.get<SiteView>(`${this.baseUrl}/me`);
  }

  updateMine(payload: UpdateSiteRequest): Observable<SiteView> {
    return this.http.put<SiteView>(`${this.baseUrl}/me`, payload);
  }
}

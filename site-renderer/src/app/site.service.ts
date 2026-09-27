import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { PublicSite } from './site-document';

/** Fetches a tenant's published marketing site by slug. */
@Injectable({ providedIn: 'root' })
export class SiteService {
  private readonly http = inject(HttpClient);

  getBySlug(slug: string): Observable<PublicSite> {
    return this.http.get<PublicSite>(`${environment.apiUrl}/public/sites/${encodeURIComponent(slug)}`);
  }
}

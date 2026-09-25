import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Environment } from '../models/environment.model';

@Injectable({ providedIn: 'root' })
export class EnvironmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/environments`;

  list(): Observable<Environment[]> {
    return this.http.get<Environment[]>(this.baseUrl);
  }

  create(payload: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Observable<Environment> {
    return this.http.post<Environment>(this.baseUrl, payload);
  }

  update(id: string, payload: Partial<Environment>): Observable<Environment> {
    return this.http.put<Environment>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

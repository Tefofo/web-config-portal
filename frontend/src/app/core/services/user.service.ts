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
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  list(query?: ListQuery): Observable<PagedResult<User>> {
    return this.http
      .get<PagedResult<User> | BackendPagedResult<User>>(this.baseUrl, {
        params: toListParams(query),
      })
      .pipe(map((resp) => toPagedResult(resp)));
  }

  get(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  create(payload: Omit<User, 'id' | 'lastLoginAt' | 'createdAt'>): Observable<User> {
    return this.http.post<User>(this.baseUrl, payload);
  }

  update(id: string, payload: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}`, payload);
  }

  activate(id: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/${id}/activate`, {});
  }

  deactivate(id: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/${id}/deactivate`, {});
  }
}

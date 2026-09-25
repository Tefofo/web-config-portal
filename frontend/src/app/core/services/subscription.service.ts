import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SubscriptionPlan,
  SubscriptionView,
  UpgradeSubscriptionResult,
  UsageSnapshot,
} from '../models/subscription.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/subscriptions`;

  current(): Observable<SubscriptionView> {
    return this.http.get<SubscriptionView>(`${this.baseUrl}/current`);
  }

  usage(): Observable<UsageSnapshot> {
    return this.http.get<UsageSnapshot>(`${this.baseUrl}/usage`);
  }

  upgrade(targetPlan: SubscriptionPlan): Observable<UpgradeSubscriptionResult> {
    return this.http.post<UpgradeSubscriptionResult>(`${this.baseUrl}/upgrade`, { targetPlan });
  }
}

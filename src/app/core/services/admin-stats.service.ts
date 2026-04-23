import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface UsersStatsDto {
  totalUsers: number;
  clients: number;
  freelancers: number;
  admins: number;
  activeUsers: number;
  newUsersThisMonth: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminStatsService {
  // Backend runs on 8090; if you have an API gateway you can change this later.
  private readonly baseUrl = 'http://localhost:8090/api/admin/stats';

  constructor(private readonly http: HttpClient) {}

  users(): Promise<UsersStatsDto> {
    return firstValueFrom(this.http.get<UsersStatsDto>(`${this.baseUrl}/users`));
  }
}

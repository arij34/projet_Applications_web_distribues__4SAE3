import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface BlogAnalyticsDto {
  idAnalytics?: number;
  metric: string;
  value: number;
}

export interface BlogStatDto {
  metric: string;
  value: number;
}

@Injectable({
  providedIn: 'root'
})
export class BlogAnalyticsApiService {
  private readonly useGateway = false;
  private readonly directBase = 'http://localhost:8053/analytics';
  private readonly gatewayBase = 'http://localhost:8091/analytics';

  constructor(private readonly http: HttpClient) {}

  private get baseUrl(): string {
    return this.useGateway ? this.gatewayBase : this.directBase;
  }

  getAll(): Promise<BlogAnalyticsDto[]> {
    return firstValueFrom(this.http.get<BlogAnalyticsDto[]>(`${this.baseUrl}/all`));
  }

  getStat(metric: string): Promise<BlogStatDto> {
    return firstValueFrom(this.http.get<BlogStatDto>(`${this.baseUrl}/stat/${encodeURIComponent(metric)}`));
  }

  upsert(metric: string, value: number): Promise<BlogAnalyticsDto> {
    const params = `metric=${encodeURIComponent(metric)}&value=${encodeURIComponent(String(value))}`;
    return firstValueFrom(this.http.post<BlogAnalyticsDto>(`${this.baseUrl}/upsert?${params}`, {}));
  }

  update(id: number, analytics: BlogAnalyticsDto): Promise<BlogAnalyticsDto> {
    return firstValueFrom(this.http.put<BlogAnalyticsDto>(`${this.baseUrl}/update/${id}`, analytics));
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/delete/${id}`));
  }
}

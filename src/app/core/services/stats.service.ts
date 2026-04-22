import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private api = 'http://localhost:8085/stats';

  constructor(private http: HttpClient) {}

  private buildParams(clientId?: number): HttpParams {
    let params = new HttpParams();
    if (clientId !== undefined && clientId !== null) {
      params = params.set('clientId', clientId.toString());
    }
    return params;
  }

  getKpis(clientId?: number):               Observable<any> {
    return this.http.get(`${this.api}/kpis`, { params: this.buildParams(clientId) });
  }
  getTopSkills(clientId?: number):          Observable<any> {
    return this.http.get(`${this.api}/top-skills`, { params: this.buildParams(clientId) });
  }
  getBudgetByComplexity(clientId?: number): Observable<any> {
    return this.http.get(`${this.api}/budget-by-complexity`, { params: this.buildParams(clientId) });
  }
  getMostSaved(clientId?: number):          Observable<any> {
    return this.http.get(`${this.api}/most-saved`, { params: this.buildParams(clientId) });
  }
  getProjectsPerWeek(clientId?: number):    Observable<any> {
    return this.http.get(`${this.api}/projects-per-week`, { params: this.buildParams(clientId) });
  }
  getFreelancersTotal(clientId?: number):   Observable<any> {
    return this.http.get(`${this.api}/freelancers-total`, { params: this.buildParams(clientId) });
  }

  getAllStats(clientId?: number): Observable<any> {
    return forkJoin({
      kpis:             this.getKpis(clientId),
      topSkills:        this.getTopSkills(clientId),
      budgetComplexity: this.getBudgetByComplexity(clientId),
      mostSaved:        this.getMostSaved(clientId),
      perWeek:          this.getProjectsPerWeek(clientId),
      freelancers:      this.getFreelancersTotal(clientId)
    });
  }
}
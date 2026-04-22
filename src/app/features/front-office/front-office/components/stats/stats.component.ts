import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StatsService } from '../../../../../core/services/stats.service';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, AfterViewInit {
viewMode: 'admin' | 'client' = 'client';
  isLoading = true;
  kpis: any = {};
  topSkills: any[] = [];
  budgetComplexity: any[] = [];
  mostSaved: any[] = [];
  perWeek: any[] = [];
  freelancersTotal = 0;

  complexityColors: Record<string, string> = {
    Simple:     '#16a34a',
    Medium:     '#2563eb',
    Complex:    '#d97706',
    Enterprise: '#dc2626'
  };

  constructor(
    private statsService: StatsService,
    private route: ActivatedRoute
  ) {}

  private resolveClientId(): number | undefined {
    const fromRoute = this.route.snapshot.queryParams['clientId'];
    if (fromRoute != null && fromRoute !== '') {
      const n = +fromRoute;
      if (!isNaN(n)) return n;
    }
    const fromStorage = localStorage.getItem('userId') || localStorage.getItem('clientId');
    if (fromStorage) return +fromStorage;
    return 1;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(() => this.loadStats());
  }

  loadStats(): void {
    this.isLoading = true;
    const id = this.viewMode === 'client' ? (this.resolveClientId() ?? 1) : undefined;

    this.statsService.getAllStats(id).subscribe({
      next: (data) => {
        this.kpis             = data.kpis;
        this.topSkills        = data.topSkills.slice(0, 8);
        this.budgetComplexity = data.budgetComplexity;
        this.mostSaved        = data.mostSaved.slice(0, 5);
        this.perWeek          = data.perWeek.slice(-8);
        this.freelancersTotal = data.freelancers.total;
        this.isLoading        = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  switchMode(mode: 'admin' | 'client'): void {
    this.viewMode = mode;
    this.loadStats();
  }


  ngAfterViewInit(): void {}

  getSkillMax(): number {
    return Math.max(...this.topSkills.map(s => s.count), 1);
  }

  getBudgetMax(): number {
    return Math.max(...this.budgetComplexity.map(b => b.avgBudget), 1);
  }

  getWeekMax(): number {
    return Math.max(...this.perWeek.map(w => w.count), 1);
  }

  getSaveMax(): number {
    return Math.max(...this.mostSaved.map(s => s.saveCount), 1);
  }

  getComplexityColor(level: string): string {
    return this.complexityColors[level] || '#64748b';
  }

  getDemandColor(demand: string): string {
    switch (demand?.toLowerCase()) {
      case 'high':   return '#16a34a';
      case 'medium': return '#d97706';
      case 'low':    return '#dc2626';
      default:       return '#64748b';
    }
  }

  formatBudget(val: number): string {
    if (!val) return '$0';
    if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000)    return '$' + (val / 1000).toFixed(1) + 'K';
    return '$' + Math.round(val);
  }

  formatNumber(val: number): string {
    if (!val) return '0';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return String(Math.round(val));
  }

  getStatusPercent(count: number): number {
    const total = this.kpis.totalProjects || 1;
    return Math.round((count / total) * 100);
  }

  getWeekLabel(row: any): string {
  return `S${row.week}`;
}
getMonthLabel(month: number): string {
  const months = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  return months[month] || '';
}

getTotalProjects(): number {
  return this.perWeek.reduce((sum, w) => sum + w.count, 0);
}
getTotalWeekProjects(): number {
  if (!this.perWeek || this.perWeek.length === 0) {
    return 0;
  }

  return this.perWeek.reduce((total, w) => total + w.count, 0);
}
}
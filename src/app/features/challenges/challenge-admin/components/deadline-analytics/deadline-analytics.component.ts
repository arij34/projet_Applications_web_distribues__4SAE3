import { Component, OnInit } from '@angular/core';
import { ChallengeService } from '@core/services/challenge.service';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-deadline-analytics',
  templateUrl: './deadline-analytics.component.html',
  styleUrls: ['./deadline-analytics.component.css']
})
export class DeadlineAnalyticsComponent implements OnInit {
  deadlinePieData: any;
  deadlinePieOptions: any;
  taskBarData: any;
  taskBarOptions: any;

  totalTasks = 0;
  completedCount = 0;
  inProgressCount = 0;
  incompleteCount = 0;
  isLoading = true;

  constructor(private challengeService: ChallengeService) {}

  ngOnInit(): void {
    this.loadRealData();
  }

  private loadRealData(): void {
    this.isLoading = true;

    this.challengeService.getChallenges().pipe(
      switchMap(challenges => {
        if (!challenges.length) return of([]);
        const taskRequests = challenges.map(c =>
          this.challengeService.getTasksByChallengeId(c.id).pipe(
            catchError(() => of([]))
          )
        );
        return forkJoin(taskRequests);
      }),
      catchError(() => of([]))
    ).subscribe(allTaskArrays => {
      const allTasks = (allTaskArrays as any[][]).flat();
      this.totalTasks = allTasks.length;

      this.completedCount = allTasks.filter(t => (t.status || '').toUpperCase() === 'COMPLETED').length;
      this.inProgressCount = allTasks.filter(t => (t.status || '').toUpperCase() === 'INPROGRESS').length;
      this.incompleteCount = allTasks.filter(t => {
        const s = (t.status || '').toUpperCase();
        return s !== 'COMPLETED' && s !== 'INPROGRESS';
      }).length;

      this.initializeCharts();
      this.isLoading = false;
    });
  }

  private initializeCharts(): void {
    const total = this.totalTasks || 1;
    const completedPct = Math.round((this.completedCount / total) * 100);
    const inProgressPct = Math.round((this.inProgressCount / total) * 100);
    const incompletePct = 100 - completedPct - inProgressPct;

    const pieColors = ['#059669', '#F59E0B', '#EF4444'];
    this.deadlinePieData = {
      labels: [
        `Completed (${completedPct}%)`,
        `In Progress (${inProgressPct}%)`,
        `Incomplete (${incompletePct}%)`
      ],
      datasets: [{
        data: [this.completedCount, this.inProgressCount, this.incompleteCount],
        backgroundColor: pieColors,
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 10
      }]
    };

    this.deadlinePieOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 30 },
      radius: '75%',
      plugins: {
        datalabels: { display: false },
        legend: {
          position: 'left',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 14, family: "'Inter', sans-serif" },
            color: '#1F2937',
            generateLabels: (chart: any) => {
              const data = chart.data;
              return data.labels.map((label: string, i: number) => ({
                text: label,
                fillStyle: data.datasets[0].backgroundColor[i],
                hidden: false,
                index: i
              }));
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: (ctx: any) => {
              const label = ctx.label?.replace(/ \(\d+%\)/, '') || '';
              return ` ${label}: ${ctx.raw} tasks`;
            }
          }
        }
      }
    };

    this.taskBarData = {
      labels: ['Completed', 'In Progress', 'Incomplete'],
      datasets: [{
        label: 'Tasks',
        data: [this.completedCount, this.inProgressCount, this.incompleteCount],
        backgroundColor: pieColors,
        borderRadius: 8,
        barThickness: 40
      }]
    };

    this.taskBarOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        datalabels: { display: false },
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#6b7280', font: { size: 12 } }
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#6b7280', font: { size: 11 } },
          grid: { color: '#e5e7eb', borderDash: [3, 3] },
          border: { display: false }
        }
      }
    };
  }
}

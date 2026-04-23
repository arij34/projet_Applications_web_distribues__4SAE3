import { Component, OnInit } from '@angular/core';
import { ChallengeService } from '@core/services/challenge.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-participant-analytics',
  templateUrl: './participant-analytics.component.html',
  styleUrls: ['./participant-analytics.component.css']
})
export class ParticipantAnalyticsComponent implements OnInit {
  categoryData: any;
  categoryOptions: any;

  completionTrendsData: any;
  completionTrendsOptions: any;

  constructor(private challengeService: ChallengeService) {}

  ngOnInit(): void {
    this.initializeCharts();
    this.loadCompletionData();
    this.loadCategoryData();
  }

  private loadCompletionData(): void {
    forkJoin({
      active: this.challengeService.getActiveChallengesCount(),
      completed: this.challengeService.getCompletedChallengesCount()
    }).subscribe({
      next: ({ active, completed }) => {
        this.completionTrendsData = {
          labels: ['Active', 'Completed'],
          datasets: [
            {
              label: 'Challenges',
              data: [active, completed],
              backgroundColor: ['#22D3EE', '#4F46E5'],
              borderRadius: 8
            }
          ]
        };
      }
    });
  }

  private loadCategoryData(): void {
    this.challengeService.getCategoryCounts().subscribe(counts => {
      const entries = Object.entries(counts).filter(([_, v]) => v > 0);
      this.categoryData = {
        labels: entries.map(([cat]) => cat),
        datasets: [{
          label: 'Challenges',
          data: entries.map(([_, v]) => v),
          backgroundColor: '#4F46E5',
          borderRadius: 8
        }]
      };
    });
  }

  private initializeCharts(): void {
    this.categoryOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(229, 231, 235, 1)' }
        },
        x: {
          grid: { display: false }
        }
      }
    };

    this.completionTrendsOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        datalabels: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(229, 231, 235, 1)' }
        },
        x: {
          grid: { display: false }
        }
      }
    };
  }
}

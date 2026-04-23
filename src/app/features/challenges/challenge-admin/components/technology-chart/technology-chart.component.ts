import { Component, OnInit } from '@angular/core';
import { ChallengeService } from '@core/services/challenge.service';

const COLORS = [
  '#4F46E5', '#22D3EE', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
];

@Component({
  selector: 'app-technology-chart',
  templateUrl: './technology-chart.component.html',
  styleUrls: ['./technology-chart.component.css']
})
export class TechnologyChartComponent implements OnInit {
  chartData: any;
  chartOptions: any;

  constructor(private challengeService: ChallengeService) {}

  ngOnInit(): void {
    this.initializeOptions();
    this.loadTechnologyData();
  }

  private loadTechnologyData(): void {
    this.challengeService.getTechnologyCounts().subscribe(counts => {
      const entries = Object.entries(counts).filter(([_, v]) => v > 0);
      const total = entries.reduce((sum, [_, v]) => sum + v, 0);

      if (total === 0) return;

      const labels = entries.map(([tech, count]) => {
        const pct = Math.round((count / total) * 100);
        return `${tech} (${pct}%)`;
      });
      const data = entries.map(([_, count]) => Math.round((count / total) * 100));
      const techCounts = entries.map(([_, count]) => count);

      this.chartData = {
        labels,
        datasets: [{
          data,
          backgroundColor: COLORS.slice(0, entries.length),
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverOffset: 10
        }]
      };

      this.chartOptions.plugins.tooltip.callbacks = {
        label: (context: any) => {
          const count = techCounts[context.dataIndex] ?? 0;
          return ` ${context.label?.replace(/ \(\d+%\)/, '')} : ${count} challenges`;
        }
      };
    });
  }

  private initializeOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 30 },
      radius: '75%',
      plugins: {
        datalabels: { display: false },
        legend: {
          position: 'right',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 14, family: "'Inter', sans-serif" },
            color: '#1F2937',
            generateLabels: (chart: any) => {
              const d = chart.data;
              return d.labels.map((label: string, i: number) => ({
                text: label,
                fillStyle: d.datasets[0].backgroundColor[i],
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
          callbacks: {}
        }
      }
    };
  }
}

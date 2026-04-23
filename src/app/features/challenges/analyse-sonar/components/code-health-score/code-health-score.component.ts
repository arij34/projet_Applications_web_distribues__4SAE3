import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-code-health-score',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-6">
      <div class="relative w-28 h-28">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <!-- Background circle -->
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#E5E7EB"
            stroke-width="8"
          />
          <!-- Progress circle -->
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#b3d1fa"
            stroke-width="8"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="strokeDashoffset"
            stroke-linecap="round"
            class="transition-all duration-500"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="text-2xl font-bold text-[#1F2937]">{{ score }}</div>
            <div class="text-xs text-[#6B7280]">/100</div>
          </div>
        </div>
      </div>
      <div class="mt-3 text-sm font-medium text-[#1F2937]">
        Overall Code Health Score
      </div>
    </div>
  `,
  styles: []
})
export class CodeHealthScoreComponent {
  @Input() score: number = 0;

  get circumference(): number {
    return 2 * Math.PI * 45;
  }

  get strokeDashoffset(): number {
    return this.circumference - (this.score / 100) * this.circumference;
  }
}

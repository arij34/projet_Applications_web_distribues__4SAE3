import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricVariant } from '../../models/analysis.model';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-gray-200 rounded-lg p-5 hover:border-[#b3d1fa] transition-colors">
      <div class="text-xs uppercase tracking-wide text-[#6B7280] mb-3">
        {{ label }}
      </div>
      <div [class]="'text-3xl font-bold mb-2 ' + valueColor">
        {{ value }}
      </div>
      <div class="text-sm text-[#6B7280]">
        {{ description }}
      </div>
    </div>
  `,
  styles: []
})
export class MetricCardComponent {
  @Input() label: string = '';
  @Input() value: number | string = 0;
  @Input() description: string = '';
  @Input() variant: MetricVariant = 'neutral';

  get valueColor(): string {
    switch (this.variant) {
      case 'success':
        return 'text-[#16A34A]';
      case 'warning':
        return 'text-[#D97706]';
      case 'error':
        return 'text-[#DC2626]';
      default:
        return 'text-[#1F2937]';
    }
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QualityGateStatus } from '../../models/analysis.model';

@Component({
  selector: 'app-quality-gate-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [class]="'flex items-center justify-between px-6 py-4 rounded-lg border-l-4 ' + 
        (isPassed ? 'bg-green-50 border-l-[#16A34A]' : 'bg-red-50 border-l-[#DC2626]')">
      <div>
        <div class="text-xs uppercase tracking-wide text-[#6B7280]">
          Quality Gate Status
        </div>
      </div>
      <div [class]="'text-2xl font-semibold ' + (isPassed ? 'text-[#16A34A]' : 'text-[#DC2626]')">
        {{ status }}
      </div>
    </div>
  `,
  styles: []
})
export class QualityGateStatusComponent {
  @Input() status: QualityGateStatus = 'PASSED';

  get isPassed(): boolean {
    return this.status === 'PASSED';
  }
}

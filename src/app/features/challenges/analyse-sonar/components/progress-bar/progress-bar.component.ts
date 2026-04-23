import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <div class="text-sm font-medium text-[#1F2937]">{{ label }}</div>
        <div class="text-sm font-semibold text-[#1F2937]">{{ value }}%</div>
      </div>
      <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          [class]="'h-full transition-all duration-500 ' + barColor"
          [style.width.%]="value">
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ProgressBarComponent {
  @Input() label: string = '';
  @Input() value: number = 0;
  @Input() variant: 'primary' | 'warning' = 'primary';

  get barColor(): string {
    return this.variant === 'warning' ? 'bg-[#D97706]' : 'bg-[#b3d1fa]';
  }
}

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-badge',
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.css']
})
export class BadgeComponent {
  @Input() variant: 'difficulty' | 'status' | 'category' | 'pill' = 'category';
  @Input() difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  @Input() status?: 'Active' | 'InProgress' | 'Completed' | 'Closed';

  getBadgeClasses(): string {
    if (this.variant === 'difficulty' && this.difficulty) {
      const difficultyClasses = {
        'Beginner': 'px-3 py-1.5 rounded-lg text-sm font-medium bg-beige text-charcoal shadow-md',
        'Intermediate': 'px-3 py-1.5 rounded-lg text-sm font-medium bg-sunny text-gray-900 shadow-md',
        'Advanced': 'px-3 py-1.5 rounded-lg text-sm font-medium bg-coral text-white shadow-md'
      };
      return difficultyClasses[this.difficulty];
    }

    if (this.variant === 'status' && this.status) {
      const statusClasses = {
        'Active': 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-mint/20 text-mint-dark border border-mint',
        'InProgress': 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-sunny-light text-gray-900 border border-sunny',
        'Completed': 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-900 border border-gray-300',
        'Closed': 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-coral-light text-coral border border-coral'
      };
      return statusClasses[this.status];
    }

    if (this.variant === 'pill') {
      return 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/30';
    }

    return 'px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-900 border border-gray-300';
  }
}
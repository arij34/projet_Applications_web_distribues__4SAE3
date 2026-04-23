import { trigger, transition, style, animate } from '@angular/animations';

export const slideAnimation = trigger('slideAnimation', [
  transition(':increment', [
    style({ opacity: 0, transform: 'translateX(20px)' }),
    animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
  ]),
  transition(':decrement', [
    style({ opacity: 0, transform: 'translateX(-20px)' }),
    animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

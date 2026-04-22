import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'link' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() fullWidth = false;
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Output() clicked = new EventEmitter<void>();

  getButtonClasses(): string {
    const base = 'rounded-xl font-medium transition-all';
    
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/30 hover:shadow-xl',
      secondary: 'border-2 border-primary text-primary hover:bg-primary hover:text-white shadow-sm hover:shadow-md',
      ghost: 'bg-white text-gray-900 hover:bg-gray-100 border-2 border-gray-300',
      link: 'bg-white text-primary hover:bg-primary/10 border-2 border-primary/30'
    };

    const sizes = {
      small: 'px-4 py-2 text-sm',
      medium: 'px-5 py-2.5',
      large: 'px-8 py-4 text-lg'
    };

    const width = this.fullWidth ? 'w-full' : '';
    const disabled = this.disabled ? 'opacity-60 cursor-not-allowed' : '';

    return `${base} ${variants[this.variant]} ${sizes[this.size]} ${width} ${disabled}`;
  }

  handleClick(): void {
    if (!this.disabled) {
      this.clicked.emit();
    }
  }
}
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-logo-slider',
  templateUrl: './logo-slider.component.html',
  styleUrls: ['./logo-slider.component.css']
})
export class LogoSliderComponent implements AfterViewInit {

  @ViewChild('slider', { static: false }) slider!: ElementRef;

  logos: string[] = [
    'assets/img/clients/brands1.png',
    'assets/img/clients/brands2.png',
    'assets/img/clients/brands3.png',
    'assets/img/clients/brands4.png',
    'assets/img/clients/brands5.png',
    'assets/img/clients/brands6.png'
  ];

  ngAfterViewInit(): void {

    const slider = this.slider.nativeElement;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    slider.addEventListener('mousedown', (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
      isDown = false;
    });

    slider.addEventListener('mouseup', () => {
      isDown = false;
    });

    slider.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isDown) return;

      e.preventDefault();

      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;

      slider.scrollLeft = scrollLeft - walk;
    });

  }

}

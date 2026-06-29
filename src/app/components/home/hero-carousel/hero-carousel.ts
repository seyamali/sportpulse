import { Component, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Match } from '../home';

@Component({
  selector: 'app-hero-carousel',
  imports: [CommonModule, RouterLink],
  templateUrl: './hero-carousel.html',
  styleUrl: './hero-carousel.css',
  providers: [DatePipe]
})
export class HeroCarouselComponent implements OnInit, OnDestroy {
  @Input({required: true}) matches!: Match[];
  
  currentIndex = signal(0);
  private slideInterval: any;

  ngOnInit() {
    this.startSlideshow();
  }

  startSlideshow() {
    if (!this.matches || this.matches.length <= 1) return; 
    
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); 
  }
  
  nextSlide() {
    if (!this.matches) return;
    this.currentIndex.update(index => (index + 1) % this.matches.length);
    this.resetInterval();
  }

  prevSlide() {
    if (!this.matches) return;
    this.currentIndex.update(index => (index - 1 + this.matches.length) % this.matches.length);
    this.resetInterval();
  }
  
  setIndex(index: number) {
    this.currentIndex.set(index);
    this.resetInterval();
  }

  resetInterval() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = setInterval(() => {
        if (!this.matches) return;
        this.currentIndex.update(index => (index + 1) % this.matches.length);
      }, 5000);
    }
  }

  getSlideClass(index: number): string {
    const total = this.matches?.length || 0;
    const current = this.currentIndex();
    
    if (total <= 1) return 'z-20 scale-100 opacity-100 translate-x-0';
    
    const diff = (index - current + total) % total;
    
    if (diff === 0) {
      return 'z-30 scale-100 opacity-100 translate-x-0';
    } else if (diff === 1 || (total === 2 && diff === 1)) {
      return 'z-20 scale-75 opacity-40 translate-x-[60%] sm:translate-x-[80%] brightness-50 blur-[2px] cursor-pointer';
    } else if (diff === total - 1) {
      return 'z-20 scale-75 opacity-40 -translate-x-[60%] sm:-translate-x-[80%] brightness-50 blur-[2px] cursor-pointer';
    } else {
      return 'z-10 scale-50 opacity-0 translate-x-0 pointer-events-none hidden';
    }
  }

  // --- Touch Swipe Support ---
  touchStartX = 0;
  touchEndX = 0;

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  handleSwipe() {
    const minSwipeDistance = 40; // threshold
    const diff = this.touchEndX - this.touchStartX;
    
    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        this.prevSlide();
      } else {
        this.nextSlide();
      }
    }
  }

  ngOnDestroy() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Match } from '../home';

@Component({
  selector: 'app-upcoming-matches',
  imports: [CommonModule, RouterLink],
  templateUrl: './upcoming-matches.html',
  styleUrl: './upcoming-matches.css',
  providers: [DatePipe]
})
export class UpcomingMatchesComponent {
  @Input({required: true}) matches!: Match[];

  scrollUpcoming(direction: 'left' | 'right') {
    const container = document.getElementById('upcoming-matches-container');
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Match } from '../home';

@Component({
  selector: 'app-recent-results',
  imports: [CommonModule, RouterLink],
  templateUrl: './recent-results.html',
  styleUrl: './recent-results.css',
  providers: [DatePipe]
})
export class RecentResultsComponent {
  @Input({required: true}) matches!: Match[];

  isLoser(teamScore?: number | null, opponentScore?: number | null): boolean {
    if (teamScore == null || opponentScore == null) return false;
    return teamScore < opponentScore;
  }
}

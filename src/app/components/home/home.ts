import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { HeroCarouselComponent } from './hero-carousel/hero-carousel';
import { UpcomingMatchesComponent } from './upcoming-matches/upcoming-matches';
import { RecentResultsComponent } from './recent-results/recent-results';

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  date: string;
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  stadium: string;
  stage: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, HeroCarouselComponent, UpcomingMatchesComponent, RecentResultsComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
  providers: [DatePipe]
})
export class HomeComponent implements OnInit {
  featuredMatches = signal<Match[]>([]);
  upcomingMatches = signal<Match[]>([]);
  recentMatches = signal<Match[]>([]);
  isLoading = signal(true);
  
  private slideInterval: any;

  async ngOnInit() {
    try {
      const response = await fetch('https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=285023');
      const data = await response.json();
      
      if (!response.ok || !data.Results) return;
      
      const allMatches: Match[] = data.Results.map((item: any) => {
        let status: 'LIVE' | 'UPCOMING' | 'FINISHED' = 'UPCOMING';
        if (item.MatchStatus === 0) status = 'FINISHED';
        else if (item.MatchStatus === 1) status = 'UPCOMING';
        else status = 'LIVE';
        
        let stageName = '';
        if (item.StageName && item.StageName.length > 0) {
          stageName = item.StageName[0].Description;
        }
        
        return {
          id: item.IdMatch,
          homeTeam: item.Home?.TeamName?.[0]?.Description || item.PlaceHolderA || 'TBD',
          awayTeam: item.Away?.TeamName?.[0]?.Description || item.PlaceHolderB || 'TBD',
          homeFlag: item.Home?.PictureUrl ? item.Home.PictureUrl.replace('{format}', 'sq').replace('{size}', '4') : 'https://flagcdn.com/w160/un.png',
          awayFlag: item.Away?.PictureUrl ? item.Away.PictureUrl.replace('{format}', 'sq').replace('{size}', '4') : 'https://flagcdn.com/w160/un.png',
          date: item.Date,
          status: status,
          stadium: item.Stadium?.Name?.[0]?.Description || 'TBD',
          stage: stageName,
          homeScore: item.HomeTeamScore,
          awayScore: item.AwayTeamScore
        };
      }).sort((a: Match, b: Match) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Get LIVE matches first, then UPCOMING matches
      const liveMatches = allMatches.filter(m => m.status === 'LIVE');
      const upcomingMatches = allMatches.filter(m => m.status === 'UPCOMING');
      const finishedMatches = allMatches.filter(m => m.status === 'FINISHED').reverse(); // Newest first
      
      const combined = [...liveMatches, ...upcomingMatches];
      
      // Grab top 5 for coverflow
      const top5 = combined.slice(0, 5);
      
      if (top5.length > 0) {
        this.featuredMatches.set(top5);
      }
      
      this.upcomingMatches.set(combined.slice(0, 10)); // Top 10 upcoming/live matches
      this.recentMatches.set(finishedMatches.slice(0, 10)); // Last 10 finished matches
      
    } catch (e) {
      console.error('Failed to load featured match', e);
    } finally {
      this.isLoading.set(false);
    }
  }
}

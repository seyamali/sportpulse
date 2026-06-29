import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  date: string;
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  group: string;
  stadium: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

@Component({
  selector: 'app-schedule',
  imports: [CommonModule, RouterLink],
  templateUrl: './schedule.html',
  providers: [DatePipe]
})
export class Schedule implements OnInit {
  matches = signal<Match[]>([]);
  isLoading = signal(true);
  errorMsg = signal('');

  async ngOnInit() {
    try {
      const response = await fetch('https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=285023');
      const data = await response.json();
      
      if (!response.ok || !data.Results) {
        this.errorMsg.set('Failed to fetch data from FIFA API.');
        return;
      }
      
      const allMappedMatches: Match[] = data.Results.map((item: any) => {
        let status: 'LIVE' | 'UPCOMING' | 'FINISHED' = 'UPCOMING';
        
        // MatchStatus 1 is upcoming, 0 is finished, 3 or others typically indicate live/in-progress.
        if (item.MatchStatus === 0) {
          status = 'FINISHED';
        } else if (item.MatchStatus === 1) {
          status = 'UPCOMING';
        } else {
          status = 'LIVE';
        }
        
        let homeTeamName = item.Home?.TeamName?.[0]?.Description || item.PlaceHolderA || 'TBD';
        let awayTeamName = item.Away?.TeamName?.[0]?.Description || item.PlaceHolderB || 'TBD';
        
        // Parse flags from the picture URL if available
        let homeFlag = item.Home?.PictureUrl ? item.Home.PictureUrl.replace('{format}', 'sq').replace('{size}', '2') : 'https://flagcdn.com/w80/un.png';
        let awayFlag = item.Away?.PictureUrl ? item.Away.PictureUrl.replace('{format}', 'sq').replace('{size}', '2') : 'https://flagcdn.com/w80/un.png';
        
        let groupName = '';
        if (item.GroupName && item.GroupName.length > 0) {
          groupName = item.GroupName[0].Description;
        } else if (item.StageName && item.StageName.length > 0) {
          groupName = item.StageName[0].Description;
        }
        
        let stadiumName = item.Stadium?.Name?.[0]?.Description || `Stadium ${item.Stadium?.IdStadium}`;
        
        return {
          id: item.IdMatch,
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          homeFlag: homeFlag,
          awayFlag: awayFlag,
          date: item.Date, // Already in perfect UTC ISO format
          status: status,
          group: groupName,
          stadium: stadiumName,
          homeScore: item.HomeTeamScore,
          awayScore: item.AwayTeamScore
        };
      }).sort((a: Match, b: Match) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Filter out matches that happened before yesterday so we only see current/upcoming matches
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const currentMatches = allMappedMatches.filter((m: Match) => new Date(m.date).getTime() >= yesterday.getTime());
      
      this.matches.set(currentMatches.slice(0, 18));
      
      if (currentMatches.length === 0) {
        this.errorMsg.set('No more matches scheduled.');
      }
    } catch (e) {
      console.error('Failed to load schedules', e);
      this.errorMsg.set('Failed to connect to the FIFA API.');
    } finally {
      this.isLoading.set(false);
    }
  }
}

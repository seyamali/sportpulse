import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface MatchStats {
  possessionHome: number;
  possessionAway: number;
  shotsHome: number;
  shotsAway: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  foulsHome: number;
  foulsAway: number;
  yellowCardsHome: number;
  yellowCardsAway: number;
  cornersHome: number;
  cornersAway: number;
}

@Component({
  selector: 'app-match-centre',
  imports: [CommonModule, RouterLink],
  templateUrl: './match-centre.html',
  providers: [DatePipe]
})
export class MatchCentreComponent implements OnInit {
  match = signal<any>(null);
  stats = signal<MatchStats | null>(null);
  isLoading = signal(true);
  errorMsg = signal('');

  constructor(private route: ActivatedRoute) {}

  async ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const matchId = params.get('id');
      if (matchId) {
        await this.loadMatch(matchId);
      }
    });
  }

  async loadMatch(matchId: string) {
    this.isLoading.set(true);
    try {
      // Fetch all matches to find this one (since we don't have a single-match public endpoint)
      const response = await fetch('https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=285023');
      const data = await response.json();
      
      const matchData = data.Results?.find((m: any) => m.IdMatch === matchId);
      
      if (!matchData) {
        this.errorMsg.set('Match not found.');
        return;
      }
      
      let status: 'LIVE' | 'UPCOMING' | 'FINISHED' = 'UPCOMING';
      if (matchData.MatchStatus === 0) status = 'FINISHED';
      else if (matchData.MatchStatus === 1) status = 'UPCOMING';
      else status = 'LIVE';
      
      const homeFlag = matchData.Home?.PictureUrl ? matchData.Home.PictureUrl.replace('{format}', 'sq').replace('{size}', '2') : 'https://flagcdn.com/w80/un.png';
      const awayFlag = matchData.Away?.PictureUrl ? matchData.Away.PictureUrl.replace('{format}', 'sq').replace('{size}', '2') : 'https://flagcdn.com/w80/un.png';
      
      this.match.set({
        id: matchData.IdMatch,
        homeTeam: matchData.Home?.TeamName?.[0]?.Description || 'TBD',
        awayTeam: matchData.Away?.TeamName?.[0]?.Description || 'TBD',
        homeFlag: homeFlag,
        awayFlag: awayFlag,
        date: matchData.Date,
        status: status,
        stadium: matchData.Stadium?.Name?.[0]?.Description || 'Unknown Stadium',
        homeScore: matchData.HomeTeamScore,
        awayScore: matchData.AwayTeamScore
      });

      if (status !== 'UPCOMING') {
        this.generateDeterministicStats(matchId, matchData.HomeTeamScore || 0, matchData.AwayTeamScore || 0);
      }

    } catch (e) {
      console.error(e);
      this.errorMsg.set('Failed to load match data.');
    } finally {
      this.isLoading.set(false);
    }
  }

  generateDeterministicStats(matchId: string, homeScore: number, awayScore: number) {
    // A simple pseudo-random number generator based on matchId string
    let seed = 0;
    for (let i = 0; i < matchId.length; i++) {
      seed += matchId.charCodeAt(i);
    }
    
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Generate stats skewed by who won/scored more
    const scoreDiff = homeScore - awayScore;
    
    // Possession: base 50, adjust up to 15% based on score diff + random noise
    const possBase = 50 + (scoreDiff * 3); 
    const possNoise = Math.floor(random() * 14) - 7; // -7 to +7
    let possHome = Math.max(30, Math.min(70, possBase + possNoise));
    
    // Shots: Base 8 + random 0-10 + 2 for every goal
    const shotsHome = 8 + Math.floor(random() * 10) + (homeScore * 2);
    const shotsAway = 8 + Math.floor(random() * 10) + (awayScore * 2);
    
    // Shots on target: Must be at least equal to goals scored, up to total shots
    const sotHome = homeScore + Math.floor(random() * (shotsHome - homeScore + 1));
    const sotAway = awayScore + Math.floor(random() * (shotsAway - awayScore + 1));

    this.stats.set({
      possessionHome: possHome,
      possessionAway: 100 - possHome,
      shotsHome,
      shotsAway,
      shotsOnTargetHome: sotHome,
      shotsOnTargetAway: sotAway,
      foulsHome: 8 + Math.floor(random() * 12),
      foulsAway: 8 + Math.floor(random() * 12),
      yellowCardsHome: Math.floor(random() * 4),
      yellowCardsAway: Math.floor(random() * 4),
      cornersHome: 2 + Math.floor(random() * 8),
      cornersAway: 2 + Math.floor(random() * 8),
    });
  }
}

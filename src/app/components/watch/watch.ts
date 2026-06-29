import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-watch',
  imports: [CommonModule, RouterLink],
  templateUrl: './watch.html'
})
export class WatchComponent implements OnInit {
  matchId = signal<string>('');
  matchDetails = signal<any>(null);
  isLoading = signal(true);
  errorMsg = signal('');
  safeVideoUrl = signal<SafeResourceUrl | null>(null);

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) {}

  async ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        this.matchId.set(id);
        await this.loadMatchDetails(id);
      }
    });
  }

  async loadMatchDetails(id: string) {
    this.isLoading.set(true);
    try {
      const response = await fetch('https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=285023');
      const data = await response.json();
      
      const matchData = data.Results?.find((m: any) => m.IdMatch === id);
      
      if (!matchData) {
        this.errorMsg.set('Match highlights not found.');
        return;
      }
      
      const homeFlag = matchData.Home?.PictureUrl ? matchData.Home.PictureUrl.replace('{format}', 'sq').replace('{size}', '2') : 'https://flagcdn.com/w80/un.png';
      const awayFlag = matchData.Away?.PictureUrl ? matchData.Away.PictureUrl.replace('{format}', 'sq').replace('{size}', '2') : 'https://flagcdn.com/w80/un.png';
      
      const homeTeamStr = matchData.Home?.TeamName?.[0]?.Description || 'TBD';
      const awayTeamStr = matchData.Away?.TeamName?.[0]?.Description || 'TBD';
      
      this.matchDetails.set({
        id: matchData.IdMatch,
        homeTeam: homeTeamStr,
        awayTeam: awayTeamStr,
        homeTeamAbbr: homeTeamStr.substring(0, 3).toUpperCase(),
        awayTeamAbbr: awayTeamStr.substring(0, 3).toUpperCase(),
        homeScore: matchData.HomeTeamScore,
        awayScore: matchData.AwayTeamScore,
        date: matchData.Date,
        homeFlag,
        awayFlag
      });
      
      const dynamicUrl = `https://www.fifa.com/en/watch/${id}`;
      this.safeVideoUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(dynamicUrl));
    } catch (e) {
      this.errorMsg.set('Failed to load highlight details.');
    } finally {
      this.isLoading.set(false);
    }
  }
}

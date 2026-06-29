import { Routes } from '@angular/router';
import { MatchView } from './components/match-view/match-view';
import { Schedule } from './components/schedule/schedule';
import { HomeComponent } from './components/home/home';
import { MatchCentreComponent } from './components/match-centre/match-centre';
import { WatchComponent } from './components/watch/watch';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'live', component: MatchView },
  { path: 'schedule', component: Schedule },
  { path: 'match/:id', component: MatchCentreComponent },
  { path: 'watch/:id', component: WatchComponent }
];

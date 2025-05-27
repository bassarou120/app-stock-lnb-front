import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeModeService } from './core/services/theme-mode.service';
import { IdleService } from './core/services/idle/idle.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'demo1';

  constructor(private themeModeService: ThemeModeService, private idleService: IdleService) {}
  ngOnInit(): void {
    const isLoggedIn = localStorage.getItem('isLoggedin') === 'true';
    if (isLoggedIn) {
      this.idleService.startWatching();
    }
  }
}

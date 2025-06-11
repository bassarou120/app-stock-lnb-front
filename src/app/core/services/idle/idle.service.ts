// core/services/idle/idle.service.ts
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, merge, Subscription, timer } from 'rxjs';
import { switchMapTo } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IdleService {
  private userActivityEvents$ = merge(
    fromEvent(window, 'mousemove'),
    fromEvent(window, 'mousedown'),
    fromEvent(window, 'click'),
    fromEvent(window, 'keydown'),
    fromEvent(window, 'touchstart'),
    fromEvent(window, 'scroll')
  );

  private timerSubscription!: Subscription;
  private timeoutInMs = 5 * 1000;

  constructor(private router: Router, private ngZone: NgZone) {}

  startWatching(): void {
    this.ngZone.runOutsideAngular(() => {
      this.timerSubscription = this.userActivityEvents$
        .pipe(switchMapTo(timer(this.timeoutInMs)))
        .subscribe(() => this.ngZone.run(() => this.logout()));
    });
  }

  stopWatching(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private logout(): void {
    localStorage.clear();
    // alert('Vous avez été déconnecté(e) pour cause d\'inactivité.');
    this.stopWatching();
    this.router.navigate(['auth/login']);
  }
}

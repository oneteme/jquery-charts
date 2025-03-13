import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-back-to-doc-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="showButton" class="back-to-doc-button">
      <button (click)="navigateBack()" class="btn-return">
        <div class="icon-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
            />
          </svg>
        </div>
        <span>Retour à la documentation</span>
      </button>
    </div>
  `,
  styleUrls: ['./back-to-doc-button.component.scss'],
})
export class BackToDocButtonComponent implements OnInit, OnDestroy {
  showButton: boolean = false;
  docUrl: string | null = null;
  private routerSubscription: Subscription | null = null;
  private navHistory: string[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const currentUrl = event.urlAfterRedirects;

        this.navHistory.push(currentUrl);

        if (this.navHistory.length > 3) {
          this.navHistory.shift();
        }

        this.updateButtonVisibility(currentUrl);
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  updateButtonVisibility(currentUrl: string) {
    if (currentUrl.startsWith('/charts')) {
      const lastDocUrl = this.findLastDocUrl();

      if (lastDocUrl) {
        if (this.isDirectFromDoc()) {
          this.showButton = true;
          this.docUrl = lastDocUrl;
        } else {
          this.showButton = false;
        }
      } else {
        this.showButton = false;
      }
    } else {
      this.showButton = false;
    }
  }

  findLastDocUrl(): string | null {
    for (let i = this.navHistory.length - 2; i >= 0; i--) {
      if (this.navHistory[i].startsWith('/documentation')) {
        return this.navHistory[i];
      }
    }
    return null;
  }

  isDirectFromDoc(): boolean {
    if (this.navHistory.length >= 2) {
      const previousUrl = this.navHistory[this.navHistory.length - 2];
      return previousUrl.startsWith('/documentation');
    }
    return false;
  }

  navigateBack() {
    if (this.docUrl) {
      this.router.navigateByUrl(this.docUrl);
    } else {
      this.router.navigateByUrl('/documentation');
    }
    this.showButton = false;
    this.navHistory = [];
  }
}

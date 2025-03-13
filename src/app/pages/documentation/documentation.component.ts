import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss'],
})
export class DocumentationComponent {
  menuState: { [key: string]: boolean } = {
    config: false,
    data: false
  };
  currentRouteSegment: string = '';

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        const segments = url.split('/');
        this.currentRouteSegment = segments[segments.length - 1];
        if (url.includes('/configuration/')) {
          this.menuState.config = true;
        }
        if (url.includes('/data/')) {
          this.menuState.data = true;
        }
      });
  }

  toggleMenu(menuName: 'config' | 'data', event: Event) {
    event.stopPropagation();
    this.menuState[menuName] = !this.menuState[menuName];
  }

  isActive(segment: string): boolean {
    const currentUrl = this.router.url;
    return currentUrl.includes(`/${segment}`);
  }

  isActiveExact(segment: string): boolean {
    const currentUrl = this.router.url;
    return currentUrl.endsWith(`/${segment}`);
  }

  handleNavClick(event: MouseEvent) {
    if (event.target instanceof HTMLElement) {
      event.target.blur();
    }
  }
}

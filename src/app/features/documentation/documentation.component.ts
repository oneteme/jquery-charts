import { Component } from '@angular/core';

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss']
})
export class DocumentationComponent {
  // Navigation entre les différentes sections
  currentSection: string = 'getting-started';

  selectSection(section: string) {
    this.currentSection = section;
  }
}

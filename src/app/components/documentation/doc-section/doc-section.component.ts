import { Component, Input } from '@angular/core';

export type SectionType = 'config' | 'data' | 'graph-types';

@Component({
  selector: 'app-doc-section',
  templateUrl: './doc-section.component.html',
  styleUrls: ['./doc-section.component.scss'],
})
export class DocSectionComponent {
  @Input() type: SectionType = 'config';
  @Input() title: string = '';
  @Input() code: string = '';
  @Input() description?: string;
  @Input() compatibilityNotes?: string[];
  @Input() examples?: { data: any; config: any }[];
  @Input() showButton: boolean = true;

  shouldShowButton(): boolean {
    return (
      this.showButton &&
      this.type === 'config' &&
      !this.title?.toLowerCase().includes('structure') &&
      !this.title?.toLowerCase().includes('global')
    );
  }

  getChartType(): string {
    if (this.title) {
      return this.title.split(' ')[0].toLowerCase();
    }
    return '';
  }

  isConfigSection(): boolean {
    return this.type === 'config';
  }

  isDataSection(): boolean {
    return this.type === 'data';
  }

  isGraphTypesSection(): boolean {
    return this.type === 'graph-types';
  }

  getCodeBlockTitle(): string {
    if (this.isGraphTypesSection()) {
      return 'Configuration de base';
    }
    return '';
  }

  getSectionClass(): string {
    return `doc-section ${this.type}-section`;
  }
}

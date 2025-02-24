import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-graph-types-section',
  templateUrl: './graph-types-section.component.html',
  styleUrls: ['./graph-types-section.component.scss']
})
export class GraphTypesSectionComponent {
  @Input() title: string = '';
  @Input() code: string = '';
  @Input() description?: string;
  @Input() compatibilityNotes?: string[];
  @Input() examples?: { data: any, config: any }[];
}

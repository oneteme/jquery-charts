import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-section',
  templateUrl: './data-section.component.html',
  styleUrls: ['./data-section.component.scss']
})
export class DataSectionComponent {
  @Input() title: string = '';
  @Input() code: string = '';
  @Input() description?: string;
}

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-config-section',
  templateUrl: './config-section.component.html',
  styleUrls: ['./config-section.component.scss']
})
export class ConfigSectionComponent {
  @Input() title: string = '';
  @Input() code: string = '';
  @Input() description?: string;
}

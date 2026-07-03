import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { OrganizerButtonComponent, OrganizerConfig, OrganizerButtonEvent, OrganizerState, OrganizerSliceState } from '@oneteme/jquery-organizer';

@Component({
  standalone: true,
  selector: 'table-organizer-button',
  imports: [OrganizerButtonComponent],
  template: `
    <organizer-button
      [config]="config"
      [state]="state"
      [hideMenuValues]="hideMenuValues"
      (viewChange)="viewChange.emit($event)"
      (sliceStateChange)="sliceStateChange.emit($event)">
    </organizer-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizerButtonWrapperComponent {
  @Input() config!: OrganizerConfig;
  @Input() state?: OrganizerState;
  @Input() hideMenuValues = false;
  @Output() viewChange = new EventEmitter<OrganizerButtonEvent>();
  @Output() sliceStateChange = new EventEmitter<OrganizerSliceState | null>();
}

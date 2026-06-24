import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { OrganizerButtonComponent, OrganizerConfig, OrganizerButtonEvent, OrganizerState, OrganizerSliceState } from '@oneteme/jquery-organizer';

/**
 * OrganizerButtonWrapperComponent
 *
 * Thin wrapper around OrganizerButtonComponent for jquery-table.
 * Exposé publiquement depuis @oneteme/jquery-table pour les consommateurs
 * qui souhaitent utiliser le bouton organizer sans dépendre directement
 * de @oneteme/jquery-organizer.
 *
 * Usage :
 * ```html
 * <table-organizer-button
 *   [config]="organizerConfig"
 *   [state]="organizerState"
 *   (viewChange)="onOrganizerViewChange($event)"
 *   (sliceStateChange)="onOrganizerSliceStateChange($event)">
 * </table-organizer-button>
 * ```
 */
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

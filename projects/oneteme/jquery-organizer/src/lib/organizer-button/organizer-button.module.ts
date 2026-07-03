import { NgModule } from '@angular/core';
import { OrganizerButtonComponent } from './organizer-button.component';
import { SlicePanelComponent } from '../slice-panel/slice-panel.component';

@NgModule({
  imports: [OrganizerButtonComponent, SlicePanelComponent],
  exports: [OrganizerButtonComponent, SlicePanelComponent]
})
export class OrganizerButtonModule {}

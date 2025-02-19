import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-important-notes',
  template:`
      <div class="important-notes">
    <div class="notes-header">
      <img src="assets/icons/warning.svg" alt="warning" class="warning-icon"/>
      <h3>{{ title }}</h3>
    </div>
    <ul>
      <li *ngFor="let note of notes">{{ note }}</li>
    </ul>
  </div>
  `,
  styleUrls: ['./important-notes.component.scss']
})

export class ImportantNotesComponent {
  @Input() title: string = 'Notes importantes';
  @Input() notes: string[] = [];
}

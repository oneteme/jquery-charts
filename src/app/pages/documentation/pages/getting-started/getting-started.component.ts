import { Component } from '@angular/core';
import { DocumentationService } from '../../../../core/services/documentation.service';

@Component({
  selector: 'app-getting-started',
  templateUrl: './getting-started.component.html',
  styleUrls: ['./getting-started.component.scss']
})
export class GettingStartedComponent {
  gettingStartedNotes: string[];

  constructor(private docService: DocumentationService) {
    this.gettingStartedNotes = this.docService.gettingStartedNotes;
  }
}

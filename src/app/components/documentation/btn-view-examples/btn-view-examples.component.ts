import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-btn-view-examples',
  standalone: true,
  imports: [RouterModule],
  template: ` <div class="view-examples">
    <a [routerLink]="['/charts', chartType]" class="examples-button">
      <img src="assets/icons/eye.svg" alt="bouton chart exemple" />
      <span class="button-text">Voir les exemples de {{ chartName }}</span>
    </a>
  </div>`,
  styleUrls: ['./btn-view-examples.component.scss'],
})
export class BtnViewExamplesComponent {
  @Input() chartType: string = '';
  @Input() chartName: string = '';
}

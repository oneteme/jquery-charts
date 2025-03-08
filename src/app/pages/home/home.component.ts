import { Component } from '@angular/core';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  selectedLibrary: string = 'apexcharts';

  selectLibrary(library: string) {
    this.selectedLibrary = library;
  }
}

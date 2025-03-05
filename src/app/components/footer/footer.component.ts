import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="app-footer">
      <div class="footer-container">
        <div class="footer-left">
          <span>© {{ currentYear }} jQuery Charts</span>
          <span class="license">Apache 2.0</span>
        </div>
        <div class="footer-right">
          <span class="contribution">Toutes contributions sont les bienvenues. Vous pouvez également créer une issue ici ➙</span>
          <a
            href="https://github.com/oneteme/jquery-charts/issues"
            target="_blank"
            class="github-link"
            title="Report an issue"
          >
            <img
              src="assets/icons/github.svg"
              alt="GitHub Issues"
              class="github-icon"
            />
          </a>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();

  ngOnInit(): void {}
}

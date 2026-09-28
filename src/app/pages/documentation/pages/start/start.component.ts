import { Component } from '@angular/core';

@Component({
  selector: 'app-documentation-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss'],
})
export class DocumentationStartComponent {
  readonly installCommands = {
    echarts: 'npm install @oneteme/jquery-core @oneteme/jquery-echarts echarts',
    highcharts: 'npm install @oneteme/jquery-core @oneteme/jquery-highcharts highcharts',
    apexcharts: 'npm install @oneteme/jquery-core @oneteme/jquery-apexcharts apexcharts',
  };

  copiedInstallCommand: string | null = null;

  readonly commonExample = `import { field } from '@oneteme/jquery-core';

const config = {
  height: 280,
  series: [{
    name: 'Ventes',
    data: { x: field('month'), y: field('value') },
  }],
};

<chart type="line" [config]="config" [data]="rows"></chart>`;

  async copyInstallCommand(command: string): Promise<void> {
    try {
      await this.writeToClipboard(command);
      this.copiedInstallCommand = command;
      window.setTimeout(() => {
        if (this.copiedInstallCommand === command) {
          this.copiedInstallCommand = null;
        }
      }, 1500);
    } catch {
      this.copiedInstallCommand = null;
    }
  }

  scrollToSection(event: Event, id: string): void {
    event.preventDefault();

    const target = document.getElementById(id);
    const scrollContainer = document.querySelector('main') as HTMLElement | null;
    if (!target || !scrollContainer) return;

    const top = scrollContainer.scrollTop
      + target.getBoundingClientRect().top
      - scrollContainer.getBoundingClientRect().top;

    scrollContainer.scrollTo({ top: Math.max(0, top) });
  }

  private async writeToClipboard(command: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(command);
        return;
      } catch {
        // Fall back to the selection API when clipboard permissions are unavailable.
      }
    }

    const textArea = document.createElement('textarea');
    textArea.value = command;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      if (!document.execCommand('copy')) {
        throw new Error('La copie du code a échoué.');
      }
    } finally {
      textArea.remove();
    }
  }
}

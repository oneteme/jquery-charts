import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ECHARTS_EXAMPLES } from 'src/app/data/chart/echarts-examples.data';
import { StackBlitzService } from 'src/app/core/services/stackblitz.service';
import { ECHARTS_SECTIONS } from '../charts/chart-example-sections';
import { EChartsComponent } from './echarts.component';

describe('EChartsComponent', () => {
  let component: EChartsComponent;
  let stackBlitz: jasmine.SpyObj<StackBlitzService>;

  beforeEach(() => {
    stackBlitz = jasmine.createSpyObj<StackBlitzService>('StackBlitzService', ['openExample']);
    TestBed.configureTestingModule({
      imports: [EChartsComponent],
      providers: [provideRouter([]), { provide: StackBlitzService, useValue: stackBlitz }],
    });
    component = TestBed.createComponent(EChartsComponent).componentInstance;
  });

  it('n’ouvre qu’un bloc de code à la fois', () => {
    const event = new Event('click');

    component.toggleCode('bar', event);
    component.toggleCode('line', event);

    expect(component.isCodeOpen('bar')).toBeFalse();
    expect(component.isCodeOpen('line')).toBeTrue();
  });

  it('referme les blocs de code lors d’un clic en dehors d’un bloc', () => {
    component.toggleCode('bar', new Event('click'));

    component.onDocumentClick({ target: document.createElement('p') } as unknown as MouseEvent);

    expect(component.isCodeOpen('bar')).toBeFalse();
  });

  it('conserve les blocs de code lors d’un clic à l’intérieur d’un bloc', () => {
    component.toggleCode('bar', new Event('click'));
    const insideCode = document.createElement('code');
    insideCode.closest = (selector: string) => (selector === '.code-block' ? document.createElement('div') : null);

    component.onDocumentClick({ target: insideCode } as unknown as MouseEvent);

    expect(component.isCodeOpen('bar')).toBeTrue();
  });

  it('ouvre l’exemple dans StackBlitz avec la section et les données de l’exemple', () => {
    const section = ECHARTS_SECTIONS[0];

    component.openInStackBlitz(section, new Event('click'));

    expect(stackBlitz.openExample).toHaveBeenCalledOnceWith('echarts', section, ECHARTS_EXAMPLES[section.exampleKey]);
  });

  it('échappe le HTML avant de colorer la syntaxe pour éviter toute injection', () => {
    expect(component._highlightCode(`const label = '<b>'`)).toBe(
      '<span class="keyword">const</span> label = <span class="string">\'&lt;b&gt;\'</span>',
    );
  });

  it('retourne un code vide pour un exemple inconnu', () => {
    expect(component.getHighlightedCode('bar', 'unknownExample')).toBe('');
  });
});

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { DocumentationStartComponent } from './start.component';

describe('DocumentationStartComponent', () => {
  let component: DocumentationStartComponent;
  const command = 'npm install @oneteme/jquery-core @oneteme/jquery-echarts echarts';

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [DocumentationStartComponent], imports: [MatIconModule] });
    component = TestBed.createComponent(DocumentationStartComponent).componentInstance;
  });

  it('marque la commande comme copiée puis la réinitialise après 1,5 seconde', fakeAsync(() => {
    spyOn(navigator.clipboard, 'writeText').and.resolveTo();

    component.copyInstallCommand(command);
    tick();

    expect(navigator.clipboard.writeText).toHaveBeenCalledOnceWith(command);
    expect(component.copiedInstallCommand).toBe(command);

    tick(1500);

    expect(component.copiedInstallCommand).toBeNull();
  }));

  it('bascule sur la sélection du texte quand le presse-papiers est refusé', async () => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject(new Error('denied')));
    const execCommand = spyOn(document, 'execCommand').and.returnValue(true);

    await component.copyInstallCommand(command);

    expect(execCommand).toHaveBeenCalledOnceWith('copy');
    expect(component.copiedInstallCommand).toBe(command);
  });

  it('ne marque aucune commande comme copiée quand la copie échoue', async () => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject(new Error('denied')));
    spyOn(document, 'execCommand').and.returnValue(false);

    await component.copyInstallCommand(command);

    expect(component.copiedInstallCommand).toBeNull();
  });
});

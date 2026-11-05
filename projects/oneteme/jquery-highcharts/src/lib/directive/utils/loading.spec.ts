import {
  configureLoadingOptions,
  hideChartToolbar,
  hideLoading,
  hideValidationError,
  showChartToolbar,
  showLoading,
  showNoDataMessage,
  showValidationError,
  updateChartLoadingState,
} from './loading';

function createContainer(html: string = ''): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML =
    '<div class="highcharts-exporting-group"></div><div class="highcharts-custom-toolbar"></div>' + html;
  return container;
}

function createGroup(): any {
  return { show: jasmine.createSpy('show'), hide: jasmine.createSpy('hide') };
}

function createSeries(visible?: boolean): any {
  return {
    visible,
    group: createGroup(),
    dataLabelsGroup: createGroup(),
    markerGroup: createGroup(),
  };
}

function createChart(extra: any = {}): any {
  return Object.assign(
    {
      container: createContainer(),
      options: { lang: { noData: 'Aucune donnée' } },
      series: [],
      showLoading: jasmine.createSpy('showLoading'),
      hideLoading: jasmine.createSpy('hideLoading'),
      showNoData: jasmine.createSpy('showNoData'),
      hideNoData: jasmine.createSpy('hideNoData'),
    },
    extra,
  );
}

function element(chart: any, selecteur: string): HTMLElement {
  return chart.container.querySelector(selecteur) as HTMLElement;
}

describe('showLoading', () => {
  it('ignore un graphique absent', () => {
    expect(() => showLoading(undefined as any)).not.toThrow();
  });

  it('affiche le chargement avec le texte par défaut', () => {
    const chart = createChart();
    showLoading(chart);
    expect(chart.showLoading).toHaveBeenCalledWith('Chargement des données...');
  });

  it('affiche le chargement avec le texte fourni', () => {
    const chart = createChart();
    showLoading(chart, 'Patientez');
    expect(chart.showLoading).toHaveBeenCalledWith('Patientez');
  });

  it('masque le message aucune donnée avant d\'afficher le chargement', () => {
    const chart = createChart();
    showLoading(chart);
    expect(chart.hideNoData).toHaveBeenCalled();
    expect(chart.showLoading).toHaveBeenCalled();
  });

  it('fonctionne sans méthode hideNoData', () => {
    const chart = createChart();
    delete chart.hideNoData;
    showLoading(chart);
    expect(chart.showLoading).toHaveBeenCalled();
  });
});

describe('hideLoading', () => {
  it('ignore un graphique absent', () => {
    expect(() => hideLoading(undefined as any)).not.toThrow();
  });

  it('masque le chargement du graphique', () => {
    const chart = createChart();
    hideLoading(chart);
    expect(chart.hideLoading).toHaveBeenCalled();
  });
});

describe('showNoDataMessage', () => {
  it('ignore un graphique absent', () => {
    expect(() => showNoDataMessage(undefined as any, 'Vide')).not.toThrow();
  });

  it('affiche le message fourni', () => {
    const chart = createChart();
    showNoDataMessage(chart, 'Vide');
    expect(chart.showNoData).toHaveBeenCalledWith('Vide');
  });

  it('transmet un message absent', () => {
    const chart = createChart();
    showNoDataMessage(chart);
    expect(chart.showNoData).toHaveBeenCalledWith(undefined);
  });

  it('ne lève pas d\'erreur sans méthode showNoData', () => {
    const chart = createChart();
    delete chart.showNoData;
    expect(() => showNoDataMessage(chart, 'Vide')).not.toThrow();
  });
});

describe('showValidationError', () => {
  it('ignore un graphique absent', () => {
    expect(() => showValidationError(undefined as any, 'Erreur')).not.toThrow();
  });

  it('remplace le libellé aucune donnée par le message d\'erreur', () => {
    const chart = createChart();
    showValidationError(chart, 'Format invalide');
    expect(chart.options.lang.noData).toBe('Format invalide');
    expect(chart.showNoData).toHaveBeenCalledWith('Format invalide');
  });

  it('affiche le message sans options de langue', () => {
    const chart = createChart({ options: {} });
    showValidationError(chart, 'Format invalide');
    expect(chart.showNoData).toHaveBeenCalledWith('Format invalide');
  });
});

describe('hideValidationError', () => {
  it('ignore un graphique absent', () => {
    expect(() => hideValidationError(undefined as any)).not.toThrow();
  });

  it('masque le message et restaure le libellé par défaut', () => {
    const chart = createChart({ options: { lang: { noData: 'Erreur' } } });
    hideValidationError(chart);
    expect(chart.hideNoData).toHaveBeenCalled();
    expect(chart.options.lang.noData).toBe('Aucune donnée');
  });

  it('restaure le libellé fourni', () => {
    const chart = createChart({ options: { lang: { noData: 'Erreur' } } });
    hideValidationError(chart, 'Vide');
    expect(chart.options.lang.noData).toBe('Vide');
  });

  it('masque le message sans options de langue', () => {
    const chart = createChart({ options: {} });
    expect(() => hideValidationError(chart)).not.toThrow();
    expect(chart.hideNoData).toHaveBeenCalled();
  });
});

describe('barre d\'outils du graphique', () => {
  it('masque l\'export et la barre personnalisée', () => {
    const chart = createChart();
    hideChartToolbar(chart);
    expect(element(chart, '.highcharts-exporting-group').style.display).toBe('none');
    expect(element(chart, '.highcharts-custom-toolbar').style.display).toBe('none');
  });

  it('affiche l\'export et la barre personnalisée en flex', () => {
    const chart = createChart();
    hideChartToolbar(chart);
    showChartToolbar(chart);
    expect(element(chart, '.highcharts-exporting-group').style.display).toBe('');
    expect(element(chart, '.highcharts-custom-toolbar').style.display).toBe('flex');
  });

  it('ignore un graphique sans conteneur', () => {
    const chart = createChart({ container: undefined });
    expect(() => hideChartToolbar(chart)).not.toThrow();
    expect(() => showChartToolbar(chart)).not.toThrow();
  });

  it('ignore les éléments de barre absents', () => {
    const chart = createChart({ container: document.createElement('div') });
    expect(() => hideChartToolbar(chart)).not.toThrow();
    expect(() => showChartToolbar(chart)).not.toThrow();
  });
});

describe('updateChartLoadingState', () => {
  it('ignore un graphique absent', () => {
    expect(() => updateChartLoadingState(undefined as any, true, true)).not.toThrow();
  });

  describe('pendant le chargement', () => {
    it('affiche le chargement, masque la barre et affiche le contenu avec données', () => {
      const serie = createSeries();
      const chart = createChart({ series: [serie] });
      updateChartLoadingState(chart, true, true, false, 'Patientez');
      expect(element(chart, '.highcharts-exporting-group').style.display).toBe('none');
      expect(chart.showLoading).toHaveBeenCalledWith('Patientez');
      expect(serie.group.show).toHaveBeenCalled();
      expect(chart.hideLoading).not.toHaveBeenCalled();
    });

    it('masque le contenu sans données', () => {
      const serie = createSeries();
      const chart = createChart({ series: [serie] });
      updateChartLoadingState(chart, true, false);
      expect(serie.group.hide).toHaveBeenCalled();
      expect(serie.group.show).not.toHaveBeenCalled();
      expect(chart.showNoData).not.toHaveBeenCalled();
    });
  });

  describe('après le chargement', () => {
    it('affiche la barre et le contenu lorsque des données existent', () => {
      const serie = createSeries();
      const chart = createChart({ series: [serie], seriesGroup: createGroup() });
      updateChartLoadingState(chart, false, true);
      expect(chart.hideLoading).toHaveBeenCalled();
      expect(element(chart, '.highcharts-exporting-group').style.display).toBe('');
      expect(element(chart, '.highcharts-custom-toolbar').style.display).toBe('flex');
      expect(chart.seriesGroup.show).toHaveBeenCalled();
      expect(serie.group.show).toHaveBeenCalled();
      expect(chart.showNoData).not.toHaveBeenCalled();
    });

    it('affiche le contenu lorsqu\'une erreur de validation est présente sans données', () => {
      const serie = createSeries();
      const chart = createChart({ series: [serie] });
      updateChartLoadingState(chart, false, false, true);
      expect(chart.hideLoading).toHaveBeenCalled();
      expect(serie.group.show).toHaveBeenCalled();
      expect(chart.showNoData).not.toHaveBeenCalled();
    });

    it('affiche le message aucune donnée sans données ni erreur', () => {
      const serie = createSeries();
      const chart = createChart({ series: [serie] });
      updateChartLoadingState(chart, false, false);
      expect(chart.hideLoading).toHaveBeenCalled();
      expect(element(chart, '.highcharts-exporting-group').style.display).toBe('none');
      expect(chart.showNoData).toHaveBeenCalledWith('Aucune donnée');
      expect(serie.group.hide).toHaveBeenCalled();
    });

    it('utilise le libellé aucune donnée fourni', () => {
      const chart = createChart();
      updateChartLoadingState(chart, false, false, false, 'Chargement', 'Vide');
      expect(chart.showNoData).toHaveBeenCalledWith('Vide');
    });
  });

  describe('visibilité des séries et des étiquettes', () => {
    it('masque les séries non visibles lorsque le contenu s\'affiche', () => {
      const serie = createSeries(false);
      const chart = createChart({ series: [serie] });
      updateChartLoadingState(chart, false, true);
      expect(serie.group.hide).toHaveBeenCalled();
      expect(serie.dataLabelsGroup.hide).toHaveBeenCalled();
      expect(serie.markerGroup.hide).toHaveBeenCalled();
      expect(serie.group.show).not.toHaveBeenCalled();
    });

    it('masque les étiquettes sans contenu en conservant les messages aucune donnée', () => {
      const chart = createChart({
        container: createContainer(
          '<div class="highcharts-data-labels"></div>' +
          '<div class="highcharts-label highcharts-no-data"></div>',
        ),
      });
      updateChartLoadingState(chart, false, false);
      expect(element(chart, '.highcharts-data-labels').style.visibility).toBe('hidden');
      expect(element(chart, '.highcharts-no-data').style.visibility).toBe('');
    });

    it('masque puis restaure la visibilité de la série cartographique', () => {
      const chart = createChart({
        container: createContainer('<div class="highcharts-map-series"></div>'),
      });
      updateChartLoadingState(chart, false, false);
      expect(element(chart, '.highcharts-map-series').style.visibility).toBe('hidden');
      updateChartLoadingState(chart, false, true);
      expect(element(chart, '.highcharts-map-series').style.visibility).toBe('');
    });
  });
});

describe('configureLoadingOptions', () => {
  it('applique les options de chargement par défaut', () => {
    const options: any = {};
    configureLoadingOptions(options);
    expect(options.loading).toEqual({
      hideDuration: 100,
      showDuration: 100,
      labelStyle: { color: '#18323a', fontSize: '14px', fontWeight: '600' },
      style: { backgroundColor: 'rgba(255, 255, 255, 0.76)', opacity: 1 },
    });
  });

  it('fusionne les options de chargement existantes avec les valeurs par défaut', () => {
    const options: any = {
      loading: { hideDuration: 300, labelStyle: { color: 'red' }, style: { opacity: 0.5 } },
    };
    configureLoadingOptions(options);
    expect(options.loading).toEqual({
      hideDuration: 300,
      showDuration: 100,
      labelStyle: { color: 'red', fontSize: '14px', fontWeight: '600' },
      style: { backgroundColor: 'rgba(255, 255, 255, 0.76)', opacity: 0.5 },
    });
  });

  it('pose les libellés par défaut de chargement et d\'absence de données', () => {
    const options: any = {};
    configureLoadingOptions(options);
    expect(options.lang.noData).toBe('Aucune donnée');
    expect(options.lang.loading).toBe('Chargement des données...');
  });

  it('pose les libellés fournis', () => {
    const options: any = {};
    configureLoadingOptions(options, 'Patientez', 'Vide');
    expect(options.lang.loading).toBe('Patientez');
    expect(options.lang.noData).toBe('Vide');
  });

  it('conserve les libellés existants', () => {
    const options: any = { lang: { noData: 'Rien', loading: 'Attendez' } };
    configureLoadingOptions(options, 'Patientez', 'Vide');
    expect(options.lang).toEqual({ noData: 'Rien', loading: 'Attendez' });
  });

  it('remplace un libellé vide par le libellé par défaut', () => {
    const options: any = { lang: { noData: '' } };
    configureLoadingOptions(options);
    expect(options.lang.noData).toBe('Aucune donnée');
  });

  it('pose le style par défaut de l\'absence de données', () => {
    const options: any = {};
    configureLoadingOptions(options);
    expect(options.noData).toEqual({
      style: { fontWeight: 'normal', fontSize: '14px', color: '#666' },
    });
  });

  it('conserve le style d\'absence de données existant', () => {
    const options: any = { noData: { style: { color: 'red' } } };
    configureLoadingOptions(options);
    expect(options.noData).toEqual({ style: { color: 'red' } });
  });

  it('initialise l\'objet chart lorsqu\'il est absent', () => {
    const options: any = {};
    configureLoadingOptions(options);
    expect(options.chart).toEqual({});
  });

  it('conserve l\'objet chart existant', () => {
    const options: any = { chart: { width: 100 } };
    configureLoadingOptions(options);
    expect(options.chart).toEqual({ width: 100 });
  });
});

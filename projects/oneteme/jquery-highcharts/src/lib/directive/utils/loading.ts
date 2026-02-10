import { Highcharts } from './highcharts-modules';

export function showLoading(
  chart: Highcharts.Chart,
  text: string = 'Chargement des données...',
): void {
  if (!chart) return;

  if (typeof (chart as any).hideNoData === 'function') {
    (chart as any).hideNoData();
  }

  chart.showLoading(text);
}

export function hideLoading(chart: Highcharts.Chart): void {
  if (!chart) return;
  chart.hideLoading();
}

export function showNoDataMessage(chart: Highcharts.Chart): void {
  if (!chart) return;

  if (typeof (chart as any).showNoData === 'function') {
    (chart as any).showNoData();
  }
}

export function showValidationError(
  chart: Highcharts.Chart,
  errorMessage: string,
): void {
  if (!chart) return;

  if (chart.options.lang) {
    chart.options.lang.noData = errorMessage;
  }

  if (typeof (chart as any).showNoData === 'function') {
    (chart as any).showNoData(errorMessage);
  }
}

export function hideValidationError(chart: Highcharts.Chart): void {
  if (!chart) return;

  if (typeof (chart as any).hideNoData === 'function') {
    (chart as any).hideNoData();
  }

  if (chart.options.lang) {
    chart.options.lang.noData = 'Aucune donnée';
  }
}

export function hideChartToolbar(chart: Highcharts.Chart): void {
  if (!chart?.container) return;

  const exportButton = chart.container.querySelector(
    '.highcharts-exporting-group',
  );
  if (exportButton) {
    (exportButton as HTMLElement).style.display = 'none';
  }

  const customToolbar = chart.container.querySelector(
    '.highcharts-custom-toolbar',
  );
  if (customToolbar) {
    (customToolbar as HTMLElement).style.display = 'none';
  }
}

export function showChartToolbar(chart: Highcharts.Chart): void {
  if (!chart?.container) return;

  const exportButton = chart.container.querySelector(
    '.highcharts-exporting-group',
  );
  if (exportButton) {
    (exportButton as HTMLElement).style.display = '';
  }

  const customToolbar = chart.container.querySelector(
    '.highcharts-custom-toolbar',
  );
  if (customToolbar) {
    (customToolbar as HTMLElement).style.display = 'flex';
  }
}

export function updateChartLoadingState(
  chart: Highcharts.Chart,
  isLoading: boolean,
  hasData: boolean,
  hasValidationError: boolean = false,
): void {
  if (!chart) return;

  if (isLoading && !hasData) {
    hideChartToolbar(chart);
    showLoading(chart, 'Chargement des données...');
    hideChartContent(chart);
  } else if (hasValidationError) {
    hideLoading(chart);
    showChartToolbar(chart);
    showChartContent(chart);
  } else if (!isLoading && !hasData) {
    hideLoading(chart);
    hideChartToolbar(chart);
    showNoDataMessage(chart);
    hideChartContent(chart);
  } else {
    hideLoading(chart);
    showChartToolbar(chart);
    showChartContent(chart);
  }
}

function hideChartContent(chart: Highcharts.Chart): void {
  try {
    if ((chart as any).seriesGroup) {
      (chart as any).seriesGroup.hide();
    }
    chart.series?.forEach((s: any) => {
      s.group?.hide?.();
      s.dataLabelsGroup?.hide?.();
      s.markerGroup?.hide?.();
    });
    if (chart.container) {
      const dataLabels = chart.container.querySelectorAll(
        '.highcharts-data-labels, .highcharts-label, .highcharts-data-label',
      );
      dataLabels.forEach((el: Element) => {
        if ((el as HTMLElement).classList.contains('highcharts-no-data'))
          return;
        if ((el as HTMLElement).classList.contains('highcharts-no-data-label'))
          return;
        (el as HTMLElement).style.visibility = 'hidden';
      });
      const mapGroup = chart.container.querySelector('.highcharts-map-series');
      if (mapGroup) {
        (mapGroup as HTMLElement).style.visibility = 'hidden';
      }
    }
  } catch (error) {
    console.error('[chart] hideChartContent error', error);
  }
}

function showChartContent(chart: Highcharts.Chart): void {
  try {
    if ((chart as any).seriesGroup) {
      (chart as any).seriesGroup.show();
    }
    chart.series?.forEach((s: any) => {
      s.group?.show?.();
      s.dataLabelsGroup?.show?.();
      s.markerGroup?.show?.();
    });
    if (chart.container) {
      const dataLabels = chart.container.querySelectorAll(
        '.highcharts-data-labels, .highcharts-label, .highcharts-data-label',
      );
      dataLabels.forEach((el: Element) => {
        (el as HTMLElement).style.visibility = '';
      });
      const mapGroup = chart.container.querySelector('.highcharts-map-series');
      if (mapGroup) {
        (mapGroup as HTMLElement).style.visibility = '';
      }
    }
  } catch (error) {
    console.error('[chart] showChartContent error', error);
  }
}

export function configureLoadingOptions(
  chartOptions: Highcharts.Options,
): void {
  chartOptions.loading = {
    hideDuration: 100,
    showDuration: 100,
    labelStyle: {
      color: '#666',
      fontSize: '14px',
      fontWeight: 'normal',
    },
    style: {
      backgroundColor: 'transparent',
      opacity: 1,
    },
  };

  if (!(chartOptions as any).lang) {
    (chartOptions as any).lang = {};
  }

  if (!(chartOptions as any).lang.noData) {
    (chartOptions as any).lang.noData = 'Aucune donnée';
  }

  if (!(chartOptions as any).noData) {
    (chartOptions as any).noData = {
      style: {
        fontWeight: 'normal',
        fontSize: '14px',
        color: '#666',
      },
    };
  }

  if (!chartOptions.chart) {
    chartOptions.chart = {};
  }
}

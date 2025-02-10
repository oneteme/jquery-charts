import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { COMBO_CHART_DATA, PIE_CHART_DATA } from './data/_index';
import { BAR_CHART_DATA } from './data/bar-chart.data';
import { FUNNEL_CHART_DATA } from './data/funnel-chart.data';
import { LINE_CHART_DATA } from './data/line-chart.data';
import { TREEMAP_CHART_DATA } from './data/treemap-chart.data';
import { HEATMAP_CHART_DATA } from './data/heatmap-chart.data';
import { RANGE_CHART_DATA } from './data/range-chart.data';
import { ChartService } from './core/services/chart.service';
// import { buildChart } from '@oneteme/jquery-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(private router: Router, private chartService: ChartService) {}

  selectedChartType: string | null = null;
  chartTypes = [
    'Pie Chart',
    'Bar Chart',
    'Line Chart',
    // 'Area Chart',
    'Treemap Chart',
    'Heatmap Chart',
    'Range Chart',
    'Funnel Chart',
  ];

  visibleChartTypes = [];

  // PIE CHARTS
  pieExample = PIE_CHART_DATA.pieExample;
  pieExample2 = PIE_CHART_DATA.pieExample2;
  pieExample3 = PIE_CHART_DATA.pieExample3;
  pieExample4 = PIE_CHART_DATA.pieExample4;
  pieExample5 = PIE_CHART_DATA.pieExample5;
  pieExample6 = PIE_CHART_DATA.pieExample6;
  pieExample7 = PIE_CHART_DATA.pieExample7;
  pieExample8 = PIE_CHART_DATA.pieExample8;
  pieExample9 = PIE_CHART_DATA.pieExample9;

  // BAR CHARTS
  barExample = BAR_CHART_DATA.barExample;
  barExample2 = BAR_CHART_DATA.barExample2;
  barExample3 = BAR_CHART_DATA.barExample3;
  barExample4 = BAR_CHART_DATA.barExample4;
  barExample5 = BAR_CHART_DATA.barExample5;
  barExample6 = BAR_CHART_DATA.barExample6;
  barExample7 = BAR_CHART_DATA.barExample7;
  barExample8 = BAR_CHART_DATA.barExample8;
  barExample9 = BAR_CHART_DATA.barExample9;
  barExample10 = BAR_CHART_DATA.barExample10;

  // LINE CHARTS
  lineExample = LINE_CHART_DATA.lineExample;
  lineExample2 = LINE_CHART_DATA.lineExample2;
  lineExample3 = LINE_CHART_DATA.lineExample3;
  lineExample4 = LINE_CHART_DATA.lineExample4;
  lineExample5 = LINE_CHART_DATA.lineExample5;
  lineExample6 = LINE_CHART_DATA.lineExample6;
  lineExample7 = LINE_CHART_DATA.lineExample7;
  lineExample8 = LINE_CHART_DATA.lineExample8;
  lineExample9 = LINE_CHART_DATA.lineExample9;

  // TREEMAP CHARTS
  treemapExample = TREEMAP_CHART_DATA.treemapExample;
  treemapExample2 = TREEMAP_CHART_DATA.treemapExample2;
  treemapExample3 = TREEMAP_CHART_DATA.treemapExample3;

  // HEATMAP CHARTS
  heatmapExample = HEATMAP_CHART_DATA.heatmapExample;

  // RANGE CHARTS
  rangeExample = RANGE_CHART_DATA.rangeExample;

  // FUNNEL CHARTS
  funnelExample = FUNNEL_CHART_DATA.funnelExample;

  // COMBO CHARTS
  comboExample = COMBO_CHART_DATA.comboExample;

  onChartTypeSelected(type: string | null) {
    this.selectedChartType = type;
    this.updateVisibleCharts(type);
    if (type) {
      this.router.navigate(['/charts']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  private updateVisibleCharts(selectedType: string) {
    switch (selectedType) {
      case 'Pie Chart':
        this.visibleChartTypes = [
          {
            title: 'Pie Charts Examples',
            type: 'pie',
            rows: [
              [
                { config: this.pieExample.config, data: this.pieExample.data },
                {
                  config: this.pieExample2.config,
                  data: this.pieExample2.data,
                },
                {
                  config: this.pieExample3.config,
                  data: this.pieExample3.data,
                },
              ],
              [
                {
                  config: this.pieExample4.config,
                  data: this.pieExample4.data,
                },
                {
                  config: this.pieExample5.config,
                  data: this.pieExample5.data,
                },
                {
                  config: this.pieExample6.config,
                  data: this.pieExample6.data,
                },
              ],
              [
                {
                  config: this.pieExample7.config,
                  data: this.pieExample7.data,
                },
                {
                  config: this.pieExample8.config,
                  data: this.pieExample8.data,
                },
                {
                  config: this.pieExample9.config,
                  data: this.pieExample9.data,
                },
              ],
            ],
          },
        ];
        this.chartService.updateCharts(this.visibleChartTypes);
        break;

      case 'Bar Chart':
        this.visibleChartTypes = [
          {
            title: 'Bar Charts Examples',
            type: 'bar',
            rows: [
              [
                { config: this.barExample.config, data: this.barExample.data },
                {
                  config: this.barExample2.config,
                  data: this.barExample2.data,
                },
                {
                  config: this.barExample3.config,
                  data: this.barExample3.data,
                },
              ],
              [
                {
                  config: this.barExample4.config,
                  data: this.barExample4.data,
                },
                {
                  config: this.barExample5.config,
                  data: this.barExample5.data,
                },
                {
                  config: this.barExample6.config,
                  data: this.barExample6.data,
                },
              ],
              [
                {
                  config: this.barExample7.config,
                  data: this.barExample7.data,
                },
                {
                  config: this.barExample8.config,
                  data: this.barExample8.data,
                },
                {
                  config: this.barExample9.config,
                  data: this.barExample9.data,
                },
              ],
              [
                {
                  config: this.barExample10.config,
                  data: this.barExample10.data,
                },
              ],
            ],
          },
        ];
        this.chartService.updateCharts(this.visibleChartTypes);
        break;

      case 'Line Chart':
        this.visibleChartTypes = [
          {
            title: 'Line Charts Examples',
            type: 'line',
            rows: [
              [
                {
                  config: this.lineExample.config,
                  data: this.lineExample.data,
                },
                {
                  config: this.lineExample2.config,
                  data: this.lineExample2.data,
                },
                {
                  config: this.lineExample3.config,
                  data: this.lineExample3.data,
                },
              ],
              [
                {
                  config: this.lineExample4.config,
                  data: this.lineExample4.data,
                },
                {
                  config: this.lineExample5.config,
                  data: this.lineExample5.data,
                },
                {
                  config: this.lineExample6.config,
                  data: this.lineExample6.data,
                },
              ],
              [
                {
                  config: this.lineExample7.config,
                  data: this.lineExample7.data,
                },
                {
                  config: this.lineExample8.config,
                  data: this.lineExample8.data,
                },
                {
                  config: this.lineExample9.config,
                  data: this.lineExample9.data,
                },
              ],
            ],
          },
        ];
        this.chartService.updateCharts(this.visibleChartTypes);
        break;

      case 'Treemap Chart':
        this.visibleChartTypes = [
          {
            title: 'Treemap Charts Examples',
            type: 'treemap',
            rows: [
              [
                {
                  config: this.treemapExample.config,
                  data: this.treemapExample.data,
                },
                {
                  config: this.treemapExample2.config,
                  data: this.treemapExample2.data,
                },
                {
                  config: this.treemapExample3.config,
                  data: this.treemapExample3.data,
                },
              ],
            ],
          },
        ];
        this.chartService.updateCharts(this.visibleChartTypes);
        break;

      case 'Heatmap Chart':
        this.visibleChartTypes = [
          {
            title: 'Heatmap Charts Examples',
            type: 'heatmap',
            rows: [
              [
                {
                  config: this.heatmapExample.config,
                  data: this.heatmapExample.data,
                },
              ],
            ],
          },
        ];
        this.chartService.updateCharts(this.visibleChartTypes);
        break;

      case 'Range Chart':
        this.visibleChartTypes = [
          {
            title: 'Range Charts Examples',
            type: 'rangeArea',
            rows: [
              [
                {
                  config: this.rangeExample.config,
                  data: this.rangeExample.data,
                },
              ],
            ],
          },
        ];
        this.chartService.updateCharts(this.visibleChartTypes);
        break;

      case 'Funnel Chart':
        this.visibleChartTypes = [
          {
            title: 'Funnel Charts Examples',
            type: 'funnel',
            rows: [
              [
                {
                  config: this.funnelExample.config,
                  data: this.funnelExample.data,
                },
              ],
            ],
          },
        ];
        this.chartService.updateCharts(this.visibleChartTypes);
        break;

      default:
        this.visibleChartTypes = [];
    }
  }

  ngOnInit() {
    this.updateVisibleCharts(this.selectedChartType);
  }
}

import { Component } from '@angular/core';
// import { ChartProvider, XaxisType, YaxisType, buildChart, combineFields, field, joinFields, rangeFields, values } from '@oneteme/jquery-core';
import { COMBO_CHART_DATA, PIE_CHART_DATA } from './data/_index';
import { BAR_CHART_DATA } from './data/bar-chart.data';
import { FUNNEL_CHART_DATA } from './data/funnel-chart.data';
import { LINE_CHART_DATA } from './data/line-chart.data';
import { TREEMAP_CHART_DATA } from './data/treemap-chart.data';
import { HEATMAP_CHART_DATA } from './data/heatmap-chart.data';
import { RANGE_CHART_DATA } from './data/range-chart.data';
import { buildChart } from '@oneteme/jquery-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  // PIE, Donut, Polar
  pieExample = PIE_CHART_DATA.pieExample;
  pieExample2 = PIE_CHART_DATA.pieExample2;
  pieExample3 = PIE_CHART_DATA.pieExample3;
  pieExample4 = PIE_CHART_DATA.pieExample4;
  pieExample5 = PIE_CHART_DATA.pieExample5;
  pieExample6 = PIE_CHART_DATA.pieExample6;
  pieExample7 = PIE_CHART_DATA.pieExample7;
  pieExample8 = PIE_CHART_DATA.pieExample8;
  pieExample9 = PIE_CHART_DATA.pieExample9;

  barExample = BAR_CHART_DATA.barExample;
  barExample1 = BAR_CHART_DATA.barExample1;
  barExample2 = BAR_CHART_DATA.barExample2;
  barExample3 = BAR_CHART_DATA.barExample3;
  barExample4 = BAR_CHART_DATA.barExample4;
  barExample5 = BAR_CHART_DATA.barExample5;
  barExample6 = BAR_CHART_DATA.barExample6;
  barExample7 = BAR_CHART_DATA.barExample7;
  barExample8 = BAR_CHART_DATA.barExample8;
  barExample9 = BAR_CHART_DATA.barExample9;
  barExample10 = BAR_CHART_DATA.barExample10;

  funnelExample = FUNNEL_CHART_DATA.funnelExample;

  // Line, Area
  lineExample = LINE_CHART_DATA.lineExample;
  lineExample2 = LINE_CHART_DATA.lineExample2;
  lineExample3 = LINE_CHART_DATA.lineExample3;
  lineExample4 = LINE_CHART_DATA.lineExample4;
  lineExample5 = LINE_CHART_DATA.lineExample5;
  lineExample6 = LINE_CHART_DATA.lineExample6;
  lineExample7 = LINE_CHART_DATA.lineExample7;
  lineExample8 = LINE_CHART_DATA.lineExample8;
  lineExample9 = LINE_CHART_DATA.lineExample9;

  treemapExample = TREEMAP_CHART_DATA.treemapExample;
  treemapExample2 = TREEMAP_CHART_DATA.treemapExample2;
  treemapExample3 = TREEMAP_CHART_DATA.treemapExample3;

  heatmapExample = HEATMAP_CHART_DATA.heatmapExample;

  rangeExample = RANGE_CHART_DATA.rangeExample;

  comboExample = COMBO_CHART_DATA.comboExample;

  // ngOnInit() {
  //   var test = buildChart(this.comboExample.data, this.comboExample.config);
  //   console.log(test);
  // }

  // ngAfterViewInit() {
  // }
}

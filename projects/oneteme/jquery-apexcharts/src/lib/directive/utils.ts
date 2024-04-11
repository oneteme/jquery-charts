import { CommonChart, Coordinate2D, XaxisType, YaxisType } from "@oneteme/jquery-core";

export function customIcons(event: (arg: 'previous' | 'next' | 'pivot') => void, canPivot: boolean): any[] {
  var customIcons = [{
    icon: '<img src="/assets/icons/arrow_back_ios.svg" width="15">',
    title: 'Graphique précédent',
    class: 'custom-icon',
    click: function (chart, options, e) {
      event("previous");
    }
  },
  {
    icon: '<img src="/assets/icons/arrow_forward_ios.svg" width="15">',
    title: 'Graphique suivant',
    class: 'custom-icon',
    click: function (chart, options, e) {
      event("next");
    }
  }];
  if (canPivot) {
    customIcons.push({
      icon: '<img src="/assets/icons/pivot_table_chart.svg" width="15">',
      title: 'Pivot',
      class: 'custom-icon',
      click: function (chart, options, e) {
        event("pivot");
      }
    });
  }
  return customIcons;
}

export function getType<X extends XaxisType, Y extends YaxisType | Coordinate2D>(commonChart: CommonChart<X, Y>): string {
  if (commonChart.continue) {
    var x = (<CommonChart<X, Coordinate2D>>commonChart).series[0].data[0].x;
    return x instanceof Date ? 'datetime' : typeof x == 'number' ? 'numeric' : 'category';
  } else {
    var categ = commonChart.categories[0];
    return categ instanceof Date ? 'datetime' : typeof categ == 'number' ? 'numeric' : 'category';
  }
}
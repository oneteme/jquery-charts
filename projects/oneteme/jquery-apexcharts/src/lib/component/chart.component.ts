import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { ChartProvider, ChartType, XaxisType, YaxisType } from "@oneteme/jquery-core";
import { BarChartDirective } from "../directive/bar-chart.directive";
import { LineChartDirective } from "../directive/line-chart.directive";
import { PieChartDirective } from "../directive/pie-chart.directive";
import { RangeChartDirective } from "../directive/range-chart.directive";
import { TreemapChartDirective } from "../directive/treemap-chart.directive";

@Component({
    standalone: true,
    imports: [
        CommonModule,
        BarChartDirective,
        LineChartDirective,
        PieChartDirective,
        RangeChartDirective,
        TreemapChartDirective
    ],
    selector: 'chart', 
    templateUrl: './chart.component.html'
})
export class  ChartComponent<X extends XaxisType, Y extends YaxisType> {
    private _charts: {[key: ChartType]: ChartType[] } = {
        'pie': ['pie', 'donut', 'polar', 'radar'],
        'donut': ['pie', 'donut', 'polar', 'radar'],
        'polar': ['pie', 'donut', 'polar', 'radar'],
        'radar': ['pie', 'donut', 'polar', 'radar'],
        'line': ['line', 'area'],
        'area': ['line', 'area'],
        'bar': ['bar', 'column', 'heatmap', 'treemap'],
        'column': ['bar', 'column', 'heatmap', 'treemap'],
        'heatmap': ['bar', 'column', 'heatmap', 'treemap'],
        'treemap': ['bar', 'column', 'heatmap', 'treemap'],
        'funnel': ['funnel', 'pyramid'],
        'pyramid': ['funnel', 'pyramid'],
        'rangeArea': ['rangeArea', 'rangeBar', 'rangeColumn'],
        'rangeBar': ['rangeArea', 'rangeBar', 'rangeColumn'],
        'rangeColumn': ['rangeArea', 'rangeBar', 'rangeColumn']
    };

    private initialType: ChartType;

    @Input() type: ChartType;
    @Input() config: ChartProvider<X, Y>;
    @Input() data: any[];
    @Input() isLoading: boolean;

    change(event: string) {
        if(!this.initialType) {
            this.initialType = this.type;
        }
        let charts = this._charts[this.initialType];
        let indexOf = charts.indexOf(this.type);
        if(indexOf != -1) {
            if(event == 'previous') {
                this.type = indexOf == 0 ? charts[charts.length - 1]: charts[indexOf - 1];
                return;
            }
            if(event == 'next') {
                this.type = indexOf == charts.length - 1 ? charts[0]: charts[indexOf + 1];
                return;
            }
        }
        if(event == 'pivot') {
            this.config = this.config.pivot ? {...this.config, pivot: false} :  {...this.config, pivot: true};
            return;
        }
    }
}
import { Component, Input } from "@angular/core";
import { ChartProvider, ChartType, XaxisType, YaxisType } from "@oneteme/jquery-core";

@Component({
    selector: 'chart', 
    templateUrl: './chart.component.html'
})
export class  ChartComponent<X extends XaxisType, Y extends YaxisType> {
    private charts: ChartType[] = ['line', 'pie', 'bar', 'treemap'];

    @Input() type: ChartType;
    @Input() config: ChartProvider<X, Y>;
    @Input() data: any[];
    @Input() isLoading: boolean;


    change(event: string) {
        
        let indexOf = this.charts.indexOf(this.type);
        console.log(event, indexOf, this.charts[indexOf]);
        if(event == 'previous') {
            this.type = indexOf == 0 ? this.charts[this.charts.length - 1] : this.charts[indexOf - 1];
        }
        if(event == 'next') {
            this.type = indexOf == this.charts.length - 1 ? this.charts[0] : this.charts[indexOf + 1];
        }
        if(event == 'pivot') {
            this.config = this.config.pivot ? {...this.config, pivot: false} :  {...this.config, pivot: true};
        }
    }
}
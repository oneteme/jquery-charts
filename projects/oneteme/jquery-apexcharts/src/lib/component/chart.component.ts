import { Component, Input } from "@angular/core";
import { ChartProvider, ChartType, XaxisType, YaxisType } from "@oneteme/jquery-core";

@Component({
    selector: 'chart', 
    templateUrl: './chart.component.html'
})
export class  ChartComponent<X extends XaxisType, Y extends YaxisType> {
    
    @Input() type: ChartType;
    @Input() config: ChartProvider<X, Y>;
    @Input() data: any[];
    @Input() isLoading: boolean;


    change(event: string) {
        console.log(event);
        if(event == 'previous') {
            this.type = 'line';
        }
        if(event == 'next') {
            this.type = 'pie';
        }
        if(event == 'pivot') {
            this.type = 'bar';
        }
    }
}
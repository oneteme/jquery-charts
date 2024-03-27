import { Component, Input } from "@angular/core";
import { ChartConfig, ChartType, DataMapper } from "@oneteme/jquery-core";

@Component({
    selector: 'chart', 
    templateUrl: './chart.component.html'
})
export class  ChartComponent<T extends DataMapper> {
    @Input() type: ChartType;
    @Input() config: ChartConfig<T>;
    @Input() data: any[];
    @Input() isLoading: boolean;
}
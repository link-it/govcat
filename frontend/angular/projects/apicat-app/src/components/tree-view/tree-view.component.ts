import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { Observable } from "rxjs";

import { ConfigService } from '@linkit/components';

@Component({
    selector: "[recursive]",
    templateUrl: "./tree-view.component.html",
    styleUrls: ["./tree-view.component.scss"],
    standalone: false

})
export class TreeViewComponent implements OnChanges {

    @Input() level!: number;
    @Input() children: any[] | undefined;
    @Input() parent: any;
    @Input() forceOpen: boolean = false;
    @Input() isEditable: boolean = true;
    @Input() isRemovable: boolean = true;
    @Input() forceActions: boolean = false;
    @Input() selectable: boolean = false;
    @Input() hideImage: boolean = false;
    @Input() editTooltip: string = 'EditGroup';
    @Input() addTooltip: string = 'AddGroup';
    @Input() removeTooltip: string = 'RemoveGroup';
    @Input() iconOpen: string = 'chevron-down';
    @Input() iconClose: string = 'chevron-right';
    @Input() iconFolder: string = 'folder';
    @Input() iconLeaf: string = 'circle';
    @Input() notSelectable: any[] = [];

    @Input() search!: (any: any) => Observable<any>;

    @Output() open: EventEmitter<any> = new EventEmitter();
    @Output() action: EventEmitter<any> = new EventEmitter();

    self = this;

    apiUrl: string = '';

    constructor(
        private configService: ConfigService
    ) {
        const _appConfig = this.configService.getConfiguration();
        this.apiUrl = _appConfig.AppConfig.GOVAPI.HOST;
    }

    ngOnChanges(changes: SimpleChanges): void {
        const _children = changes.children ? changes.children.currentValue : [];
        this.children = _children.map((item: any) => {
            item.isOpen = item.isOpen || (changes.forceOpen ? changes.forceOpen.currentValue : true);
                return item;
        });
    }

    onOpen(item: any) {
        item.isOpen = !item.isOpen;
        this.action.emit({action: item.isOpen ? 'open' : 'close', item: item});
        // if (!item.children) {
        //     item.loading = "....";
        //     this.search(item.id).subscribe(res=>{
        //     item.loading = null
        //     item.children = res;
        //     })
        // }
    }

    onOpenInternal(event: any) {
        this.action.emit(event);
    }

    onAction(event: any, action: any, item: any) {
        event.stopImmediatePropagation();
        event.preventDefault();
        if (!this.isNotSelectable(item)) {
            if (this.selectable) { 
                this.action.emit({action: 'select', item: item});
            } else {
                this.action.emit({action: action, item: item});
            }
        }
    }

    onActionInternal(event: any) {
        this.action.emit(event);
    }

    isNotSelectable(item: any) {
        const index = this.notSelectable?.findIndex((i: any) => {
            if (i.id_gruppo) {
                return (i.id_gruppo === item.id_gruppo)
            }
            if (i.id_categoria) {
                return (i.id_categoria === item.id_categoria)
            }
            return false;
        });
        return (index !== -1);
    }

    getLogoMapper = (data: any): string => {
        return data.immagine ? `${this.apiUrl}/gruppi/${data.id_gruppo}/immagine`: '';
    }
}

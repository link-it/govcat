import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'lnk-form-fieldset',
    templateUrl: './form-fieldset.component.html',
    styleUrls: ['./form-fieldset.component.scss']
})
export class LnkFormFieldsetComponent implements OnInit {
    @Input() title: string = '';
    @Input() subTitle: string = '';
    @Input() singleColumn: boolean = false;
    @Input() isNew: boolean = false;
    @Input() otherClass: string = '';
    @Input() options: any = null;

    constructor() { }

    ngOnInit() {
    }

    get colClassTitle(): string {
        return this.singleColumn ? `col-lg-12` : (this.options ? `col-lg-${this.options.Fieldset.colTitle}` : `col-lg-4`);
    }

    get colClassContent(): string {
        return this.singleColumn ? `col-lg-12` : (this.options ? `col-lg-${this.options.Fieldset.colContent}` : `col-lg-8`);
    }
}

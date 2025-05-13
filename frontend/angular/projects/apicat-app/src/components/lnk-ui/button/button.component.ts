import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'lnk-button',
    templateUrl: './button.component.html',
    standalone: false,
    styleUrls: ['./button.component.scss']
})
export class LnkButtonComponent implements OnInit {

    @Input() type: string = 'button'; // button | submit
    @Input() label: string = '';
    @Input() disabled: boolean = false;
    @Input() icon: string | null = null;
    @Input() onlyIcon: boolean = false;
    @Input() size: string = 'md'; // sm | md
    @Input() primary: boolean = false;
    @Input() secondary: boolean = false;
    @Input() danger: boolean = false;
    @Input() tertiary: boolean = false;
    @Input() otherClass: string = '';
    @Input() ariaLabel: string = '';
    @Input() spinner: boolean = false;
    @Input() onlySpinner: boolean = false;
    @Input() btnTooltip: string = '';
    @Input() badgeCount: number | null = null;
    @Input() badgeColor: string = 'badge-info text-dark';

    @Output() onAction = new EventEmitter();

    constructor() { }

    ngOnInit() {
    }

    _onClick() {
        this.onAction.emit({});
    }
}

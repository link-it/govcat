/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'lnk-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
    standalone: false
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

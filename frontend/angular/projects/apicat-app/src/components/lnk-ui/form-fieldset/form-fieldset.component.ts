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
import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'lnk-form-fieldset',
    templateUrl: './form-fieldset.component.html',
    styleUrls: ['./form-fieldset.component.scss'],
    standalone: false
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

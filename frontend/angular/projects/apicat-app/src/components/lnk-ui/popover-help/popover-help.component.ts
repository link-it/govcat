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
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { AvailableBSPositions } from 'ngx-bootstrap/positioning';

@Component({
    selector: 'lnk-popover-help',
    templateUrl: './popover-help.component.html',
    styleUrls: [
        './popover-help.component.scss'
    ],
    standalone: false
})
export class PopoverHelpComponent implements OnInit, OnChanges {

    @Input() field: string = '';
    @Input() context: string = '';
    @Input() params: any = {};

    @Input() iconHelp: string = 'bi bi-info-circle';
    @Input() helpPlacement: AvailableBSPositions = 'left';
    @Input() helpContainerClass: string = '';
    
    keyContent: string = '';
    title: string = '';
    text: string = '';
    existsValue: boolean = false;

    constructor(
        private sanitized: DomSanitizer,
        private translate: TranslateService
    ) { }

    ngOnInit() {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.field) {
            this.field = changes.field.currentValue;
            this.keyContent = `APP.LABEL_HELP.${this.context}.${this.field}`;
            this.existsValue = this.hasTranslation(this.keyContent, this.translate.currentLang);
            if (this.existsValue) {
                this.text = this.translate.instant(this.keyContent, this.params);
            }
            const _keyTitle = `${this.keyContent}-title`;
            const _existsTitle = this.hasTranslation(_keyTitle, this.translate.currentLang);
            if (_existsTitle) {
                this.title = this.translate.instant(_keyTitle, this.params);
            }
        }
    }

    public hasTranslation(translationKey: string, language?: string): boolean {
        const translation: object | string = this.translate.translations[language || this.translate.currentLang];
        const value = translationKey
            .split('.')
            .reduce((t: any, k: string) => t[k] || {}, translation || {});
        return typeof value === 'string';
    }

    _sanitizeHtml(html: string) {
        return this.sanitized.bypassSecurityTrustHtml(html)
    }
}

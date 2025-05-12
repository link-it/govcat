import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { AvailbleBSPositions } from 'ngx-bootstrap/positioning';

@Component({
    selector: 'lnk-popover-help',
    templateUrl: './popover-help.component.html',
    styleUrls: [
        './popover-help.component.scss'
    ]
})
export class PopoverHelpComponent implements OnInit, OnChanges {

    @Input() field: string = '';
    @Input() context: string = '';
    @Input() params: any = {};

    @Input() iconHelp: string = 'bi bi-info-circle';
    @Input() helpPlacement: AvailbleBSPositions = 'left';
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

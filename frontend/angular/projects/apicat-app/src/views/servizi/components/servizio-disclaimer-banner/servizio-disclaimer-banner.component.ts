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
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { ServizioDisclaimer } from '../../servizio-disclaimers';

/** Banner di un disclaimer del servizio: testo markdown con stile in base alla severity. */
@Component({
    selector: 'app-servizio-disclaimer-banner',
    templateUrl: 'servizio-disclaimer-banner.component.html',
    styleUrls: ['servizio-disclaimer-banner.component.scss'],
    standalone: true,
    imports: [CommonModule, MarkdownModule]
})
export class ServizioDisclaimerBannerComponent {
    @Input() disclaimer: ServizioDisclaimer | null = null;

    get _variant(): string {
        switch (this.disclaimer?.severity) {
            case 'ERROR': return 'is-err';
            case 'WARNING': return 'is-warn';
            default: return '';
        }
    }

    get _icon(): string {
        switch (this.disclaimer?.severity) {
            case 'ERROR': return 'bi-x-circle';
            case 'WARNING': return 'bi-exclamation-triangle';
            default: return 'bi-info-circle';
        }
    }
}

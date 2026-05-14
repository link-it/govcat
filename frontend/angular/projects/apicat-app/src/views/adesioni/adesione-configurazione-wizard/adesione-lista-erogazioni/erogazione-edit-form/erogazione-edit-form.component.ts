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
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { COMPONENTS_IMPORTS } from '@linkit/components';
import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';
import { MarkAsteriskDirective } from '@app/directives/mark-asterisk/mark-asterisk.directive';

/**
 * Form di edit dell'endpoint di un'erogazione (campi `nome`, `versione`,
 * `url`, `indirizzi_ip`). Estratto da `adesione-lista-erogazioni` per
 * supportare il rendering inline del nuovo layout (Issue 254 NEW LAYOUT)
 * mantenendo back-compat col modal legacy.
 *
 * Il componente e` puramente presentational: NON renderizza il
 * `<form>` wrapper ne` i bottoni di azione (Close/Save). Il parent e`
 * responsabile di:
 * - avvolgere il template in `<form [formGroup]="..." (submit)="...">`;
 * - renderizzare i bottoni nel posto giusto (modal-footer per il modal
 *   legacy, sotto il form per il rendering inline).
 *
 * Cosi` il form puo` essere usato in entrambi i contesti senza
 * compromessi su layout / UX.
 */
@Component({
    selector: 'app-erogazione-edit-form',
    templateUrl: './erogazione-edit-form.component.html',
    styleUrls: ['./erogazione-edit-form.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslateModule,
        ...COMPONENTS_IMPORTS,
        ...APP_COMPONENTS_IMPORTS,
        MarkAsteriskDirective,
    ],
})
export class ErogazioneEditFormComponent {
    @Input({ required: true }) formGroup!: FormGroup;

    /**
     * Stato di errore lato server (banner rosso sotto il form).
     * Default `false`. Sorgente: `_error` del parent.
     */
    @Input() error: boolean = false;

    /**
     * Messaggio i18n key dell'errore (es. `'APP.MESSAGE.ERROR.Default'`).
     * Mostrato solo quando `error=true`.
     */
    @Input() errorMsg: string = '';

    /** Espone i FormControl interni per gli errori di validazione. */
    get fe(): { [key: string]: AbstractControl } {
        return this.formGroup.controls;
    }
}

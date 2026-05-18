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
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { Tools } from '@linkit/components';

/**
 * Card-style variant del classico `<ui-error-view>` (Issue 254
 * NEW LAYOUT, rev. 4.32).
 *
 * Pensato per il nuovo wizard adesione: card con sfondo `--err-soft`,
 * bordo arrotondato, tipografia ridotta. Ogni errore renderizzato
 * come una riga compatta con icona + tipo + identificativo + dato
 * + campi inline — molto piu` leggibile dell'`<ui-error-view>`
 * legacy quando ci sono molti errori dello stesso tipo che
 * differiscono solo per identificativo.
 *
 * Stessa shape di input/output del legacy:
 *  - `[errTitle]`, `[errors]`, `[showClose]`;
 *  - `(onClose)` quando l'utente clicca la X.
 *
 * Drop-in compatibile: basta sostituire `<ui-error-view>` con
 * `<app-error-view-card>` per ottenere il nuovo rendering.
 */
@Component({
    selector: 'app-error-view-card',
    standalone: true,
    templateUrl: './error-view-card.component.html',
    styleUrls: ['./error-view-card.component.scss'],
    imports: [CommonModule, TooltipModule, TranslateModule],
})
export class ErrorViewCardComponent implements OnInit, OnDestroy {

    @Input('errTitle') title: string | null = null;
    @Input() errors: any[] = [];
    @Input() showClose: boolean = false;
    /**
     * Auto-dismiss del banner dopo N millisecondi dalla
     * comparsa. `0` (default) = disabilitato, l'utente deve
     * chiudere manualmente via X. Quando settato a >0, dopo il
     * timeout viene emesso `(onClose)` come se l'utente avesse
     * cliccato la X — il parent decide cosa fare (di solito
     * `resetError()`). Il timer viene cancellato in
     * `ngOnDestroy`: se il banner viene rimosso prima (es. il
     * parent fa `resetError()` per altre ragioni), nessun
     * `onClose` spurio viene emesso.
     */
    @Input() autocloseMs: number = 0;

    @Output() onClose = new EventEmitter<void>();

    /**
     * Durata dell'animazione di chiusura in ms. Deve coincidere
     * con la `transition-duration` della classe `.is-closing`
     * nel SCSS (220ms). Cambiando uno, cambiare l'altro.
     */
    private static readonly _CLOSE_ANIMATION_MS = 220;

    /** Flag che attiva la classe CSS `.is-closing` (fade-out +
     *  collapse). Il template re-renderizza la `<section>` con
     *  la classe, le transition CSS partono e dopo ~220ms
     *  emettiamo `onClose`. */
    _closing = false;

    private _autocloseTimer: ReturnType<typeof setTimeout> | null = null;
    private _animationTimer: ReturnType<typeof setTimeout> | null = null;

    ngOnInit(): void {
        if (this.autocloseMs > 0) {
            this._autocloseTimer = setTimeout(() => {
                this._autocloseTimer = null;
                this.closeMessages();
            }, this.autocloseMs);
        }
    }

    ngOnDestroy(): void {
        if (this._autocloseTimer) {
            clearTimeout(this._autocloseTimer);
            this._autocloseTimer = null;
        }
        if (this._animationTimer) {
            clearTimeout(this._animationTimer);
            this._animationTimer = null;
        }
    }

    /** Mappa `nome_campo` -> label custom configurata dall'app
     *  (`Tools.CustomFieldsLabel`). Usata solo per i campi marcati
     *  `custom: true`. */
    _getCustomFieldLabel(field: string): string {
        const elem = Tools.CustomFieldsLabel.find((item: any) => item.label === field);
        return elem?.value || field;
    }

    _hasCustomFieldLabel(field: string): boolean {
        return Tools.CustomFieldsLabel.some((item: any) => item.label === field);
    }

    /** Etichetta "umana" del profilo a partire dal `codice_interno`
     *  letto dalla configurazione globale (Tools.Configurazione). */
    _getProfiloLabel(cod: string): string {
        const srv: any = Tools.Configurazione?.servizio;
        const profili = srv?.api?.profili || [];
        const profilo = profili.find((item: any) => item.codice_interno === cod);
        return profilo ? profilo.etichetta : cod;
    }

    /**
     * Risolve i `params` di un errore mappando il campo `profilo`
     * dal `codice_interno` (es. "BASIC_FRUIZIONI") all'etichetta
     * umana presa da `Tools.Configurazione.servizio.api.profili`.
     *
     * NOTA: convertiamo SEMPRE `params.profilo` quando presente,
     * non solo per sottotipo `Profilo` — gli errori reali del
     * cambio stato hanno spesso sottotipo `client` con
     * `params.profilo` settato al codice. Se il codice non e`
     * mappato in configurazione il `_getProfiloLabel` ritorna
     * l'input invariato (back-compat).
     */
    _getParms(err: any): any {
        const params = { ...err.params };
        if (params['profilo']) {
            params['profilo'] = this._getProfiloLabel(params['profilo']);
        }
        return params;
    }

    /** Costruisce la chiave i18n del sottotipo concatenando i
     *  `tipo` separati da punto (es. `client.identificativo`). */
    _getSottotipoKey(sottotipo: any[]): string {
        if (!Array.isArray(sottotipo)) { return ''; }
        return sottotipo.map((item: any) => item?.tipo).filter(Boolean).join('.');
    }

    /**
     * Avvia l'animazione di chiusura (fade + collapse via classe
     * `.is-closing`) e dopo `_CLOSE_ANIMATION_MS` emette
     * `onClose` per permettere al parent di rimuovere il banner.
     * Idempotente: chiamate ripetute mentre l'animazione e` in
     * corso vengono ignorate.
     */
    closeMessages(): void {
        if (this._closing) { return; }
        this._closing = true;
        this._animationTimer = setTimeout(() => {
            this._animationTimer = null;
            this.onClose.emit();
        }, ErrorViewCardComponent._CLOSE_ANIMATION_MS);
    }
}

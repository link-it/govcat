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
import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipDirective, TooltipModule } from 'ngx-bootstrap/tooltip';

let _progressivo = 0;

/** Distanza minima del pannello dai bordi della finestra (px). */
const MARGINE = 16;
/** Larghezza massima del pannello (px, 30rem). */
const LARGHEZZA = 480;

/**
 * Nota del servizio nella vetrina: pulsante accanto alle azioni della pagina che apre la nota in un
 * pannello a tendina; il fuoco resta sul pulsante, che lo richiude come Esc o un clic fuori. Chi lo
 * usa decide se mostrarlo (configurazione, ruoli, nota valorizzata).
 */
@Component({
    selector: 'app-servizio-nota-vetrina',
    templateUrl: 'servizio-nota-vetrina.component.html',
    styleUrls: ['servizio-nota-vetrina.component.scss'],
    standalone: true,
    imports: [TranslateModule, TooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(document:click)': 'onDocumentClick($event)',
        '(window:resize)': 'posiziona()'
    }
})
export class ServizioNotaVetrinaComponent {

    readonly nota = input.required<string>();

    readonly aperta = signal(false);
    /** Posizione del pannello (fixed) e della freccia, calcolate dal pulsante. */
    readonly posizione = signal({ top: 0, right: MARGINE, freccia: 16 });
    readonly idPannello = `servizio-nota-vetrina-${++_progressivo}`;

    private readonly host = inject(ElementRef<HTMLElement>);
    private readonly pulsante = viewChild.required<ElementRef<HTMLButtonElement>>('pulsante');
    // il tooltip ripete il titolo del pannello e lo coprirebbe
    private readonly suggerimento = viewChild(TooltipDirective);

    toggle() {
        if (this.aperta()) {
            this.chiudi();
        } else {
            this.apri();
        }
    }

    apri() {
        this.posiziona();
        this.suggerimento()?.hide();
        this.aperta.set(true);
    }

    chiudi(restituisciFuoco: boolean = true) {
        if (!this.aperta()) { return; }
        this.aperta.set(false);
        if (restituisciFuoco) { this.pulsante().nativeElement.focus(); }
    }

    /** Pannello allineato a destra del pulsante, dentro la finestra; la freccia indica il pulsante. */
    posiziona() {
        const _r = this.pulsante().nativeElement.getBoundingClientRect();
        // stessa larghezza del CSS: min(30rem, 100vw - 2 margini)
        const _larghezza = Math.min(LARGHEZZA, window.innerWidth - 2 * MARGINE);
        const _right = Math.min(Math.max(MARGINE, window.innerWidth - _r.right), window.innerWidth - _larghezza - MARGINE);
        this.posizione.set({ top: _r.bottom + 8, right: _right, freccia: Math.max(window.innerWidth - _r.right - _right + _r.width / 2 - 6, 8) });
    }

    /** Un clic fuori dal componente chiude il pannello, senza spostare il fuoco. */
    onDocumentClick(event: Event) {
        if (this.aperta() && !this.host.nativeElement.contains(event.target as Node)) {
            this.chiudi(false);
        }
    }
}

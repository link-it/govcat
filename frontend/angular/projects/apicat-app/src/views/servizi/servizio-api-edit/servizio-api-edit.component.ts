import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ServizioApiDetailsComponent } from '../servizio-api-details/servizio-api-details.component';
import { ServizioApiConfigurationComponent } from '../servizio-api-configuration/servizio-api-configuration.component';

type ApiEditTab = 'info_generali' | 'collaudo' | 'produzione';

/**
 * Modifica/configurazione di un'API esistente come form a tab (Issue #352).
 * L'endpoint di PUT e` lo stesso per le tre form (informazioni generali,
 * collaudo, produzione), quindi si riusano i componenti esistenti sotto i tab:
 *  - `info_generali` → ServizioApiDetailsComponent (in modifica);
 *  - `collaudo`/`produzione` → ServizioApiConfigurationComponent per ambiente.
 *
 * I tab visibili dipendono dalla fase (`ambiente`) e da `skipCollaudo`:
 *  - collaudo                     → Informazioni generali + Collaudo;
 *  - produzione (con skip)        → Informazioni generali + Produzione;
 *  - produzione (senza skip)      → solo Produzione (i dati generali sono gia`
 *                                   definiti nel collaudo).
 */
@Component({
    selector: 'app-servizio-api-edit',
    templateUrl: 'servizio-api-edit.component.html',
    styleUrls: ['servizio-api-edit.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        TranslateModule,
        ServizioApiDetailsComponent,
        ServizioApiConfigurationComponent
    ]
})
export class ServizioApiEditComponent implements OnInit, OnChanges {
    static readonly Name = 'ServizioApiEditComponent';

    /** Id dell'API da modificare/configurare. */
    @Input() apiId: string | null = null;
    /** Id del servizio proprietario. */
    @Input() sid: string | null = null;
    /** Ambiente della fase corrente (collaudo/produzione). */
    @Input() ambiente: string | null = null;
    /** Servizio con collaudo saltato: la produzione e` l'ambiente iniziale. */
    @Input() skipCollaudo: boolean = false;
    /** Apre i form gia` in modifica (altrimenti sola lettura). */
    @Input() startEdit: boolean = false;

    @Output() saved: EventEmitter<any> = new EventEmitter<any>();
    @Output() closed: EventEmitter<any> = new EventEmitter<any>();

    tabs: ApiEditTab[] = [];
    activeTab: ApiEditTab = 'collaudo';
    /** Tab gia` istanziati (keep-alive): una volta creati restano vivi e si
     *  nascondono con [hidden], senza ricrearli ad ogni cambio tab. */
    rendered: Set<ApiEditTab> = new Set<ApiEditTab>();

    ngOnInit(): void {
        this._computeTabs();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['ambiente'] || changes['skipCollaudo']) {
            this._computeTabs();
        }
    }

    private _computeTabs(): void {
        if (this.ambiente === 'produzione') {
            this.tabs = this.skipCollaudo ? ['info_generali', 'produzione'] : ['produzione'];
        } else {
            // collaudo (default)
            this.tabs = ['info_generali', 'collaudo'];
        }
        // Tab attivo: mantiene quello corrente se ancora visibile; altrimenti
        // apre sul tab dell'ambiente (Collaudo/Produzione), coerente con l'azione
        // "Configura"; in mancanza, sul primo disponibile.
        const envTab: ApiEditTab = this.ambiente === 'produzione' ? 'produzione' : 'collaudo';
        if (!this.tabs.includes(this.activeTab)) {
            this.activeTab = this.tabs.includes(envTab) ? envTab : this.tabs[0];
        }
        // Il tab attivo viene istanziato subito.
        if (this.activeTab) { this.rendered.add(this.activeTab); }
    }

    selectTab(tab: ApiEditTab): void {
        this.activeTab = tab;
        this.rendered.add(tab);
    }

    tabLabelKey(tab: ApiEditTab): string {
        return 'APP.SERVICES.WIZARD.PHASE.' + tab;
    }

    onChildSaved(event: any): void {
        this.saved.emit(event);
    }

    onChildClosed(event: any): void {
        this.closed.emit(event);
    }
}

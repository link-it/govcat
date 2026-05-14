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
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { ConfigService } from '@linkit/components';

import { ItemOrganizzazione } from '../model/itemOrganizzazione';
import { RuoloOrganizzazioneEnum } from '../model/ruoloOrganizzazioneEnum';
import { Utente } from '../model/utente';
import { UtenteOrganizzazione } from '../model/utenteOrganizzazione';

const DEFAULT_STORAGE_KEY = 'govcat.organizationContext';

interface PersistedContext {
    id_organizzazione: string;
}

/**
 * Gestisce l'organizzazione di sessione (multi-org). Mantiene un
 * `BehaviorSubject` con l'`ItemOrganizzazione` corrente e il ruolo
 * dell'utente in essa. La selezione e' persistita in `localStorage`
 * con chiave configurabile via `app-config.json`
 * (`AppConfig.Organization.ContextSelector.storageKey`).
 *
 * Convenzione di inizializzazione (Issue 270):
 * - 0 org -> fallback su legacy `utente.organizzazione` singolo;
 * - 1 org -> auto-select silenzioso (UX trasparente);
 * - >=2 org con persistenza valida -> ripristino;
 * - >=2 org senza persistenza -> contesto resta `null`. Sara` il
 *   `OrganizationSelectionGuard` / `OrganizationSelectorComponent`
 *   a forzare la scelta esplicita prima di proseguire verso la
 *   dashboard (no piu` selezione arbitraria della "prima org").
 *
 * Al logout (`clear`) il contesto viene azzerato e la persistenza rimossa.
 */
@Injectable({
    providedIn: 'root'
})
export class OrganizationContextService {

    private readonly configService = inject(ConfigService);

    private readonly _current$ = new BehaviorSubject<UtenteOrganizzazione | null>(null);
    readonly current$: Observable<UtenteOrganizzazione | null> = this._current$.asObservable();

    private readonly _storageKey: string;

    constructor() {
        const cfg = this.configService.getConfiguration();
        this._storageKey = cfg?.AppConfig?.Organization?.ContextSelector?.storageKey || DEFAULT_STORAGE_KEY;
    }

    getCurrent(): UtenteOrganizzazione | null {
        return this._current$.value;
    }

    getCurrentOrganization(): ItemOrganizzazione | null {
        return this._current$.value?.organizzazione || null;
    }

    getCurrentRole(): RuoloOrganizzazioneEnum | null {
        return this._current$.value?.ruolo_organizzazione || null;
    }

    setCurrent(org: UtenteOrganizzazione | null): void {
        this._current$.next(org);
        if (org?.organizzazione?.id_organizzazione) {
            this._persist({ id_organizzazione: org.organizzazione.id_organizzazione });
        } else {
            this._clearPersistence();
        }
    }

    /**
     * Inizializza il contesto a partire dal profilo utente.
     *
     * Issue 270: con multi-org senza persistenza, lasciamo il
     * contesto a `null` per forzare la scelta esplicita via
     * `OrganizationSelectorComponent`. Con esattamente 1 org
     * auto-selezioniamo (UX silenziosa).
     */
    initFromUser(utente: Utente | null | undefined): void {
        const orgs = utente?.organizzazioni || [];
        if (!orgs.length) {
            this._fallbackFromLegacyOrganizzazione(utente);
            return;
        }
        const persisted = this._readPersisted();
        const restored = persisted
            ? orgs.find(o => o.organizzazione?.id_organizzazione === persisted.id_organizzazione)
            : null;
        if (restored) {
            this.setCurrent(restored);
            return;
        }
        if (orgs.length === 1) {
            // 1 org -> auto-select silenzioso.
            this.setCurrent(orgs[0]);
            return;
        }
        // >=2 org senza persistenza: contesto null, la UI mostrera`
        // il selettore.
        this._current$.next(null);
        this._clearPersistence();
    }

    /**
     * Reset del contesto: chiamato dal logout.
     */
    clear(): void {
        this._current$.next(null);
        this._clearPersistence();
    }

    /**
     * Retrocompatibilita': se il BE pubblica solo il vecchio campo
     * `utente.organizzazione` (singolare), lo mappiamo in un
     * `UtenteOrganizzazione` con ruolo nullo per non perdere il
     * contesto sull'utenza legacy.
     */
    private _fallbackFromLegacyOrganizzazione(utente: Utente | null | undefined): void {
        const legacy: any = utente?.organizzazione;
        if (legacy?.id_organizzazione) {
            this.setCurrent({
                organizzazione: {
                    id_organizzazione: legacy.id_organizzazione,
                    nome: legacy.nome,
                    descrizione: legacy.descrizione,
                    aderente: legacy.aderente,
                    referente: legacy.referente,
                    esterna: legacy.esterna
                },
                ruolo_organizzazione: null
            });
            return;
        }
        this._current$.next(null);
        this._clearPersistence();
    }

    private _persist(ctx: PersistedContext): void {
        try {
            localStorage.setItem(this._storageKey, JSON.stringify(ctx));
        } catch {
            // localStorage non disponibile (es. private mode): ignora
        }
    }

    private _readPersisted(): PersistedContext | null {
        try {
            const raw = localStorage.getItem(this._storageKey);
            return raw ? JSON.parse(raw) as PersistedContext : null;
        } catch {
            return null;
        }
    }

    private _clearPersistence(): void {
        try {
            localStorage.removeItem(this._storageKey);
        } catch {
            // ignora
        }
    }
}

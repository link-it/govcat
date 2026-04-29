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
 * Convenzione di inizializzazione:
 * - al login (`initFromUser`) si tenta di ripristinare l'org persistita
 *   se ancora presente nella lista `utente.organizzazioni`;
 * - in mancanza, si seleziona la prima organizzazione della lista;
 * - se l'utente non ha organizzazioni il contesto resta `null`.
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
     * Inizializza il contesto a partire dal profilo utente. Cerca
     * nell'ordine: org persistita, prima org della lista, null.
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
        const next = restored || orgs[0];
        this.setCurrent(next || null);
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

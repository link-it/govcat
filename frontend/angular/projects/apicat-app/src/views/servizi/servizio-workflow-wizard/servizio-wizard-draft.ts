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

/**
 * Evolutiva wizard servizio (creazione unificata): modello "draft" client-side
 * e orchestrazione del salvataggio A CASCATA delle sotto-risorse.
 *
 * In creazione il servizio non esiste ancora, quindi le sotto-risorse (API,
 * gruppi, allegati, referenti aggiuntivi) — che richiedono l'`id_servizio` —
 * vengono raccolte nel draft e persistite dopo la POST del servizio.
 *
 * Non esiste un endpoint atomico lato BE: la cascata e' orchestrata qui, con
 * strategia BEST-EFFORT (il servizio nasce comunque; le voci fallite si
 * completano poi in modifica) e ordine: servizio -> API -> gruppi -> allegati
 * -> referenti.
 */

import { Observable, concat, of } from 'rxjs';
import { catchError, map, switchMap, toArray } from 'rxjs/operators';

import { OpenAPIService } from '@app/services/openAPI.service';

/** Allegato pending (pre-id): payload accettato da `POST /servizi/:id/allegati`. */
export interface AllegatoDraft {
  tipologia: string;
  visibilita: string;
  descrizione?: string;
  filename: string;
  content_type: string;
  content: string;
}

/** Referente aggiuntivo pending: payload di `POST /servizi/:id/referenti`. */
export interface ReferenteDraft {
  id_utente: string;
  tipo: string;
}

/**
 * Bozza client-side del servizio in creazione: raccoglie tutti i dati, inclusi
 * quelli che richiedono l'`id_servizio` per essere persistiti.
 */
export interface ServizioWizardDraft {
  /** Body per `POST /servizi` (include `referente`/`referente_tecnico` inline). */
  servizio: any;
  /** API pending (senza `id_servizio`, aggiunto in cascata). */
  api: any[];
  /** `id_gruppo` selezionati. */
  gruppi: string[];
  /** Allegati pending (con `content` base64). */
  allegati: AllegatoDraft[];
  /** Referenti aggiuntivi oltre a referente/referente_tecnico. */
  referentiAggiuntivi: ReferenteDraft[];
}

/** Esito di una singola operazione della cascata. */
export interface CascadeItemResult {
  step: 'servizio' | 'api' | 'gruppo' | 'allegati' | 'referente';
  ok: boolean;
  ref?: any;
  error?: any;
}

/** Esito complessivo della cascata. */
export interface CascadeResult {
  idServizio: string | null;
  servizioOk: boolean;
  items: CascadeItemResult[];
}

/** Draft vuoto di default. */
export function emptyServizioWizardDraft(): ServizioWizardDraft {
  return { servizio: {}, api: [], gruppi: [], allegati: [], referentiAggiuntivi: [] };
}

/** True se ci sono sotto-risorse fallite. */
export function cascadeHasErrors(result: CascadeResult): boolean {
  return !result.servizioOk || result.items.some((i) => !i.ok);
}

/**
 * Salvataggio a cascata del servizio e delle sotto-risorse (best-effort).
 *
 * 1) `POST /servizi` -> `id_servizio`. Se fallisce, si interrompe (servizio non creato).
 * 2) Per ogni sotto-risorsa, in ordine, una chiamata che cattura l'errore e prosegue.
 *
 * Ritorna un `CascadeResult` con l'esito per voce (mai in errore: gli errori sono
 * riportati negli item, non propagati).
 */
export function cascadeCreateServizio(
  apiService: OpenAPIService,
  draft: ServizioWizardDraft
): Observable<CascadeResult> {
  return apiService.saveElement('servizi', draft.servizio).pipe(
    switchMap((res: any) => {
      const idServizio: string | null = res?.id_servizio ?? null;
      if (!idServizio) {
        return of<CascadeResult>({
          idServizio: null,
          servizioOk: false,
          items: [{ step: 'servizio', ok: false, error: 'missing id_servizio' }]
        });
      }

      const ops: Array<{ step: CascadeItemResult['step']; ref?: any; call: () => Observable<any> }> = [];

      (draft.api || []).forEach((a: any, i: number) => ops.push({
        step: 'api',
        ref: a?.nome ?? i,
        call: () => apiService.saveElement('api', { ...a, id_servizio: idServizio })
      }));

      (draft.gruppi || []).forEach((idGruppo: string) => ops.push({
        step: 'gruppo',
        ref: idGruppo,
        call: () => apiService.postElementRelated('servizi', idServizio, `gruppi/${idGruppo}`, {})
      }));

      if (draft.allegati?.length) {
        ops.push({
          step: 'allegati',
          ref: draft.allegati.length,
          call: () => apiService.postElementRelated('servizi', idServizio, 'allegati', draft.allegati)
        });
      }

      (draft.referentiAggiuntivi || []).forEach((r: ReferenteDraft) => ops.push({
        step: 'referente',
        ref: r?.id_utente,
        call: () => apiService.postElementRelated('servizi', idServizio, 'referenti', r)
      }));

      if (!ops.length) {
        return of<CascadeResult>({ idServizio, servizioOk: true, items: [] });
      }

      return concat(
        ...ops.map((op) => op.call().pipe(
          map(() => ({ step: op.step, ok: true, ref: op.ref } as CascadeItemResult)),
          catchError((err) => of({ step: op.step, ok: false, ref: op.ref, error: err } as CascadeItemResult))
        ))
      ).pipe(
        toArray(),
        map((items) => ({ idServizio, servizioOk: true, items } as CascadeResult))
      );
    }),
    catchError((err) => of<CascadeResult>({
      idServizio: null,
      servizioOk: false,
      items: [{ step: 'servizio', ok: false, error: err }]
    }))
  );
}

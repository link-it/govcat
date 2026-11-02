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
import { EMPTY, Observable, forkJoin, of } from 'rxjs';
import { catchError, expand, map, reduce, switchMap } from 'rxjs/operators';

import { getPdndEserviceId } from './pdnd-menu.util';

export interface PdndProducerIds {
  producerIdCollaudo: string;
  producerIdProduzione: string;
}

const AMBIENTI_PDND = ['collaudo', 'produzione'];

/** Accordi di fruizione dell'e-service, seguendo tutte le pagine della lista fruitori. */
function accordiEservice(apiService: any, ambiente: string, eserviceId: string, producerId: string): Observable<any[]> {
  const _nome = `${ambiente}/subscribers`;
  const _prima = apiService.getListPDND(_nome, { params: { eserviceId, producerId } });
  return _prima.pipe(
    expand((resp: any) => resp?._links?.next?.href ? apiService.getListPDND(_nome, undefined, resp._links.next.href) : EMPTY),
    map((resp: any) => resp?.subscribers || []),
    reduce((tutti: any[], pagina: any[]) => [...tutti, ...pagina], [] as any[]),
    catchError(() => of([]))
  );
}

/** Accordi in attesa di approvazione e finalita` con una versione da approvare, per un e-service. */
function inAttesaEservice(apiService: any, pdndService: any, ambiente: string, eserviceId: string, producerId: string): Observable<number> {
  return accordiEservice(apiService, ambiente, eserviceId, producerId).pipe(
    switchMap((accordi: any[]) => {
      const _accordiInAttesa = accordi.filter((a: any) => a?.state === 'PENDING').length;
      const _conAccordo = accordi.filter((a: any) => !!a?.agreementId);
      if (!_conAccordo.length) { return of(_accordiInAttesa); }
      return forkJoin(_conAccordo.map((a: any) => pdndService.agreementPurposes(ambiente, a.agreementId).pipe(
        map((res: any) => (res?.data?.purposes || []).filter((p: any) => !!p?.waitingForApproval).length),
        catchError(() => of(0))
      ))).pipe(map((finalita: number[]) => _accordiInAttesa + finalita.reduce((t, n) => t + n, 0)));
    }),
    catchError(() => of(0))
  );
}

/**
 * Azioni PDND in attesa sulle API indicate, in entrambi gli ambienti: accordi `PENDING` e finalita`
 * con una versione da approvare. Stesse chiamate della dialog dei fruitori.
 */
export function contaAzioniPdndInAttesa(apiService: any, pdndService: any, apis: any[], producerIds: PdndProducerIds | null): Observable<number> {
  const _richieste: Observable<number>[] = [];
  (apis || []).forEach((api: any) => {
    AMBIENTI_PDND.forEach((ambiente) => {
      const _eserviceId = getPdndEserviceId(api, ambiente);
      const _producerId = ambiente === 'collaudo' ? producerIds?.producerIdCollaudo : producerIds?.producerIdProduzione;
      if (_eserviceId && _producerId) {
        _richieste.push(inAttesaEservice(apiService, pdndService, ambiente, _eserviceId, _producerId));
      }
    });
  });
  if (!_richieste.length) { return of(0); }
  return forkJoin(_richieste).pipe(map((parziali: number[]) => parziali.reduce((t, n) => t + n, 0)));
}

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
import { TranslateService } from '@ngx-translate/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';

import { YesnoDialogBsComponent } from '@linkit/components';

/** Errore del cambio di ruolo (o della rimozione) di un utente referente nell'organizzazione. */
export const ERRORE_UTENTE_REFERENTE = 'ORG.409.UTENTE.REFERENTE';

export function isErroreUtenteReferente(error: any): boolean {
  return error?.error?.detail === ERRORE_UTENTE_REFERENTE;
}

/** Messaggio dell'errore seguito dagli elenchi di servizi, domini e adesioni di cui l'utente e' referente. */
export function messaggiUtenteReferente(error: any, translate: TranslateService): string[] {
  const params = error?.error?.errori?.[0]?.params || {};
  const messaggi: string[] = [translate.instant(`APP.MESSAGE.ERROR.${ERRORE_UTENTE_REFERENTE}`, params)];
  const elenchi: [string, string][] = [
    ['servizi', 'APP.UTENTI_ORG.LABEL.ReferenteServizi'],
    ['domini', 'APP.UTENTI_ORG.LABEL.ReferenteDomini'],
    ['adesioni', 'APP.UTENTI_ORG.LABEL.ReferenteAdesioni']
  ];
  elenchi.forEach(([campo, etichetta]) => {
    if (params[campo]) { messaggi.push(`${translate.instant(etichetta)}: ${params[campo]}`); }
  });
  return messaggi;
}

/** Chiede di confermare l'operazione anche se l'utente non sara' piu' un referente valido. */
export function confermaUtenteReferente(error: any, modalService: BsModalService, translate: TranslateService): Observable<boolean> {
  const modalRef = modalService.show(YesnoDialogBsComponent, {
    ignoreBackdropClick: true,
    initialState: {
      title: translate.instant('APP.TITLE.Attention'),
      messages: messaggiUtenteReferente(error, translate),
      cancelText: translate.instant('APP.BUTTON.Cancel'),
      confirmText: translate.instant('APP.BUTTON.Confirm'),
      confirmColor: 'danger'
    }
  });
  return modalRef?.content?.onClose ? modalRef.content.onClose.pipe(take(1)) : of(false);
}

import { describe, it, expect, vi } from 'vitest';
import { Subject } from 'rxjs';

import { confermaUtenteReferente, isErroreUtenteReferente, messaggiUtenteReferente } from './utente-referente-conferma';

describe('utente-referente-conferma', () => {
  const translate: any = { instant: vi.fn((key: string) => key) };
  const errore = (params: any = {}) => ({ error: { detail: 'ORG.409.UTENTE.REFERENTE', errori: [{ params }] } });

  it('should recognise only the referent user error', () => {
    expect(isErroreUtenteReferente(errore())).toBe(true);
    expect(isErroreUtenteReferente({ error: { detail: 'ORG.409.USER' } })).toBe(false);
    expect(isErroreUtenteReferente(null)).toBe(false);
  });

  it('should list only the services, domains and subscriptions received', () => {
    const messaggi = messaggiUtenteReferente(errore({ servizi: 'Anagrafe v1, Tributi v2', domini: '', adesioni: 'Anagrafe v1 - SoggettoX' }), translate);
    expect(messaggi).toEqual([
      'APP.MESSAGE.ERROR.ORG.409.UTENTE.REFERENTE',
      'APP.UTENTI_ORG.LABEL.ReferenteServizi: Anagrafe v1, Tributi v2',
      'APP.UTENTI_ORG.LABEL.ReferenteAdesioni: Anagrafe v1 - SoggettoX'
    ]);
    expect(translate.instant).toHaveBeenCalledWith('APP.MESSAGE.ERROR.ORG.409.UTENTE.REFERENTE', expect.objectContaining({ servizi: 'Anagrafe v1, Tributi v2' }));
  });

  it('should return the answer of the confirmation dialog', () => {
    const onClose = new Subject<boolean>();
    const modalService: any = { show: vi.fn().mockReturnValue({ content: { onClose } }) };
    const risposte: boolean[] = [];
    confermaUtenteReferente(errore({ servizi: 'S1' }), modalService, translate).subscribe((ok) => risposte.push(ok));
    onClose.next(true);
    onClose.next(false);
    expect(risposte).toEqual([true]);
    const initialState = modalService.show.mock.calls[0][1].initialState;
    expect(initialState.messages.length).toBe(2);
  });

  it('should answer no without a dialog', () => {
    const modalService: any = { show: vi.fn().mockReturnValue(null) };
    const risposte: boolean[] = [];
    confermaUtenteReferente(errore(), modalService, translate).subscribe((ok) => risposte.push(ok));
    expect(risposte).toEqual([false]);
  });
});

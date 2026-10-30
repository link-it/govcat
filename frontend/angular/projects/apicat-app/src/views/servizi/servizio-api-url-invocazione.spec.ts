import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Tools } from '@linkit/components';
import { etichettaUrlInvocazione, etichettaUrlPredefinita, urlInvocazioneConfigurate, URL_INVOCAZIONE_DEFAULT } from './servizio-api-url-invocazione';

describe('servizio-api-url-invocazione', () => {
  let savedConfigurazione: any;

  beforeEach(() => {
    savedConfigurazione = Tools.Configurazione;
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should return empty values without configuration', () => {
    Tools.Configurazione = { servizio: { api: {} } } as any;
    expect(urlInvocazioneConfigurate('collaudo')).toEqual([]);
    expect(etichettaUrlPredefinita()).toBeNull();
    expect(etichettaUrlInvocazione(URL_INVOCAZIONE_DEFAULT, 'collaudo')).toBeNull();
  });

  it('should read the URLs of each environment independently', () => {
    Tools.Configurazione = { servizio: { api: { url_invocazione: {
      etichetta_default: 'Rete interna',
      collaudo: [{ identificativo: 'gw_test', etichetta: 'Gateway di test' }, { etichetta: 'senza identificativo' }],
      produzione: [{ identificativo: 'gw_esterno', etichetta: 'Rete internet' }]
    } } } } as any;
    expect(urlInvocazioneConfigurate('collaudo').map(u => u.identificativo)).toEqual(['gw_test']);
    expect(etichettaUrlInvocazione('gw_esterno', 'produzione')).toBe('Rete internet');
    expect(etichettaUrlInvocazione('gw_esterno', 'collaudo')).toBeNull();
    expect(etichettaUrlInvocazione(URL_INVOCAZIONE_DEFAULT, 'produzione')).toBe('Rete interna');
    expect(etichettaUrlInvocazione(null, 'produzione')).toBeNull();
  });
});

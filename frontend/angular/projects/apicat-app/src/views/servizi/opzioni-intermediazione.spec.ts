import { describe, it, expect } from 'vitest';

import { opzioneIntermediazione, opzioniIntermediazione } from './opzioni-intermediazione';

describe('opzioniIntermediazione', () => {
    it('should name the context organization in the default option', () => {
        const opzioni = opzioniIntermediazione('Regione Toscana');
        expect(opzioni.map((o) => o.value)).toEqual([false, true]);
        expect(opzioni[0]).toEqual({
            value: false,
            label: 'APP.SERVICES.INTERMEDIAZIONE.Interna',
            params: { organizzazione: 'Regione Toscana' },
            help: 'fruizione_interna'
        });
        expect(opzioni[1].label).toBe('APP.SERVICES.INTERMEDIAZIONE.Esterna');
        expect(opzioni[1].help).toBe('fruizione_esterna');
    });

    it('should use the label without the name when there is no context organization', () => {
        expect(opzioniIntermediazione(null)[0].label).toBe('APP.SERVICES.INTERMEDIAZIONE.InternaSenzaNome');
    });

    it('should find the option of the fruizione value, the internal one by default', () => {
        const opzioni = opzioniIntermediazione('Ente');
        expect(opzioneIntermediazione(opzioni, true).value).toBe(true);
        expect(opzioneIntermediazione(opzioni, false).value).toBe(false);
        expect(opzioneIntermediazione(opzioni, null).value).toBe(false);
    });
});

import { describe, it, expect } from 'vitest';

import { ambienteServizio, collaudoSaltato } from './ambiente-servizio';

describe('ambienteServizio', () => {
    it('should open the testing environment for a service configured only in testing', () => {
        expect(ambienteServizio({ stato: 'pubblicato_collaudo' })).toBe('collaudo');
        expect(ambienteServizio({ stato: 'in_configurazione_produzione' })).toBe('collaudo');
        expect(ambienteServizio(null)).toBe('collaudo');
    });

    it('should open the production environment for a service published in production', () => {
        expect(ambienteServizio({ stato: 'pubblicato_produzione' })).toBe('produzione');
        expect(ambienteServizio({ stato: 'pubblicato_produzione_senza_collaudo' })).toBe('produzione');
    });

    it('should follow the requested environment, except testing for a service without testing', () => {
        expect(ambienteServizio({ stato: 'pubblicato_produzione' }, 'collaudo')).toBe('collaudo');
        expect(ambienteServizio({ stato: 'pubblicato_collaudo' }, 'produzione')).toBe('produzione');
        expect(ambienteServizio({ stato: 'pubblicato_collaudo' }, 'altro')).toBe('collaudo');
        expect(ambienteServizio({ stato: 'bozza', skip_collaudo: true }, 'collaudo')).toBe('produzione');
    });

    it('should detect a skipped testing phase', () => {
        expect(collaudoSaltato({ skip_collaudo: true, stato: 'pubblicato_produzione' })).toBe(true);
        expect(collaudoSaltato({ skip_collaudo: true, stato: 'pubblicato_produzione_senza_collaudo' })).toBe(true);
        expect(collaudoSaltato({})).toBe(false);
    });

    it('should keep the testing environment of a service published in testing despite the skip flag', () => {
        const servizio = { skip_collaudo: true, stato: 'pubblicato_collaudo' };
        expect(collaudoSaltato(servizio)).toBe(false);
        expect(ambienteServizio(servizio)).toBe('collaudo');
    });
});

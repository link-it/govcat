import { Page } from '@playwright/test';

export interface UserSession {
  principal: string;
  roles: string[];
  utente: {
    id_utente: string;
    nome: string;
    cognome: string;
    ruolo: string;
    email?: string;
  };
  settings?: Record<string, unknown>;
}

const STORAGE_KEY = 'GWAC_SESSION';

export const gestoreSession: UserSession = {
  principal: 'gestore@test.local',
  roles: ['apicat_adm'],
  utente: {
    id_utente: '1',
    nome: 'Admin',
    cognome: 'Gestore',
    ruolo: 'gestore',
    email: 'gestore@test.local'
  },
  settings: {
    version: '0.1',
    servizi: {
      view: 'card',
      viewBoxed: false,
      showImage: true,
      showEmptyImage: false,
      fillBox: true,
      showMasonry: false,
      editSingleColumn: false,
      showMarkdown: true,
      showPresentation: true,
      showTechnicalReferent: false
    }
  }
};

export const referenteSession: UserSession = {
  principal: 'referente@test.local',
  roles: ['apicat_user'],
  utente: {
    id_utente: '2',
    nome: 'Mario',
    cognome: 'Rossi',
    ruolo: 'referente',
    email: 'referente@test.local'
  },
  settings: {
    version: '0.1',
    servizi: {
      view: 'card',
      viewBoxed: false,
      showImage: true,
      showEmptyImage: false,
      fillBox: true,
      showMasonry: false,
      editSingleColumn: false,
      showMarkdown: true,
      showPresentation: true,
      showTechnicalReferent: false
    }
  }
};

function encodeSession(session: UserSession): string {
  return btoa(encodeURI(JSON.stringify(session)));
}

export async function injectSession(page: Page, session: UserSession): Promise<void> {
  await page.addInitScript(({ key, value }: { key: string; value: string }) => {
    localStorage.setItem(key, value);
  }, { key: STORAGE_KEY, value: encodeSession(session) });
}

export async function clearSession(page: Page): Promise<void> {
  await page.addInitScript(({ key }: { key: string }) => {
    localStorage.removeItem(key);
  }, { key: STORAGE_KEY });
}

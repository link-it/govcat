import { Page } from '@playwright/test';

const API_BASE = '/govcat-api/api/v1';

export const mockServizi = [
  {
    id: 1,
    id_servizio: 1,
    nome: 'Servizio Anagrafe',
    versione: 1,
    stato: 'pubblicato',
    descrizione_sintetica: 'Servizio per consultazione anagrafe',
    descrizione: 'API per la consultazione dei dati anagrafici dei cittadini',
    immagine: null,
    dominio: 'Comune di Test',
    id_dominio: 1,
    visibilita: 'pubblica',
    gruppo: 'Anagrafe',
    tags: ['anagrafe', 'cittadini'],
    data_creazione: '2026-01-15T10:00:00Z',
    data_ultima_modifica: '2026-02-01T14:30:00Z'
  },
  {
    id: 2,
    id_servizio: 2,
    nome: 'Servizio Tributi',
    versione: 1,
    stato: 'pubblicato',
    descrizione_sintetica: 'Servizio per gestione tributi',
    descrizione: 'API per la gestione e consultazione dei tributi comunali',
    immagine: null,
    dominio: 'Comune di Test',
    id_dominio: 1,
    visibilita: 'pubblica',
    gruppo: 'Tributi',
    tags: ['tributi', 'pagamenti'],
    data_creazione: '2026-01-20T10:00:00Z',
    data_ultima_modifica: '2026-02-10T09:00:00Z'
  }
];

export const mockAdesioni = [
  {
    id: 1,
    id_adesione: 1,
    id_servizio: 1,
    servizio_nome: 'Servizio Anagrafe',
    organizzazione_nome: 'Ente Test',
    soggetto_nome: 'Soggetto Test',
    stato: 'configurata',
    data_creazione: '2026-02-01T10:00:00Z'
  }
];

export const mockOrganizzazioni = [
  { id: 1, id_organizzazione: 1, nome: 'Ente Test', codice_ipa: 'ente_test', external_id: 'ext1' },
  { id: 2, id_organizzazione: 2, nome: 'Comune di Roma', codice_ipa: 'c_h501', external_id: 'ext2' }
];

export const mockSoggetti = [
  { id: 1, id_soggetto: 1, nome: 'Soggetto Test', id_organizzazione: 1, organizzazione_nome: 'Ente Test', referente: true, aderente: false },
  { id: 2, id_soggetto: 2, nome: 'Soggetto Due', id_organizzazione: 2, organizzazione_nome: 'Comune di Roma', referente: false, aderente: true }
];

export const mockDashboard = {
  totale_servizi: 42,
  totale_adesioni: 128,
  totale_organizzazioni: 15,
  totale_soggetti: 23,
  servizi_per_stato: [
    { stato: 'pubblicato', count: 30 },
    { stato: 'bozza', count: 8 },
    { stato: 'in_configurazione', count: 4 }
  ]
};

export const mockConfigurazione = {
  servizio: {
    workflow: {
      cambi_stato: [
        {
          stato_attuale: 'bozza',
          stato_successivo: { nome: 'pubblicato', ruoli_abilitati: ['gestore', 'referente'] },
          dati_non_modificabili: [],
          dati_obbligatori: ['identificativo', 'generico']
        }
      ]
    },
    stati_adesione_consentita: ['pubblicato']
  },
  adesione: {
    workflow: {
      cambi_stato: [
        {
          stato_attuale: 'richiesta',
          stato_successivo: { nome: 'configurata', ruoli_abilitati: ['gestore', 'referente'] },
          dati_non_modificabili: [],
          dati_obbligatori: []
        }
      ]
    },
    stati_scheda_adesione: ['configurata', 'pubblicata']
  }
};

export const mockProfile = {
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

function wrapList(items: unknown[], offset = 0, limit = 25) {
  return {
    content: items.slice(offset, offset + limit),
    page: { offset, limit, total: items.length }
  };
}

export async function setupApiMocks(page: Page): Promise<void> {
  // Profile
  await page.route(`${API_BASE}/profile`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProfile) })
  );

  // Configurazione
  await page.route(`${API_BASE}/configurazione`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockConfigurazione) })
  );

  // Servizi list
  await page.route(`${API_BASE}/servizi?**`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(wrapList(mockServizi)) })
  );

  // Servizi detail
  await page.route(`${API_BASE}/servizi/*`, route => {
    const url = route.request().url();
    const match = url.match(/\/servizi\/(\d+)/);
    const id = match ? parseInt(match[1]) : 1;
    const servizio = mockServizi.find(s => s.id === id) || mockServizi[0];
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(servizio) });
  });

  // Adesioni list
  await page.route(`${API_BASE}/adesioni?**`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(wrapList(mockAdesioni)) })
  );

  // Organizzazioni list
  await page.route(`${API_BASE}/organizzazioni?**`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(wrapList(mockOrganizzazioni)) })
  );

  // Soggetti list
  await page.route(`${API_BASE}/soggetti?**`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(wrapList(mockSoggetti)) })
  );

  // Dashboard stats
  await page.route(`${API_BASE}/dashboard/**`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockDashboard) })
  );

  // Notifications
  await page.route(`${API_BASE}/notifiche?**`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(wrapList([])) })
  );

  // Pending actions (dashboard)
  await page.route(`${API_BASE}/pending-actions?**`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(wrapList([])) })
  );

  // Settings
  await page.route(`${API_BASE}/utenti/*/settings`, route => {
    if (route.request().method() === 'PUT') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: route.request().postData() || '{}' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  // Catch-all for other API calls - return empty
  await page.route(`${API_BASE}/**`, route => {
    if (!route.request().isNavigationRequest()) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    return route.continue();
  });
}

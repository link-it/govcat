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
export enum SectionType {
  Certificati = 'certificati',
  Connettivita = 'connettivita',
  Violazioni = 'violazioni',
  EventiConnection = 'eventi-connection',
  EventiRead = 'eventi-read',
}

export enum ModelType {
  Servizi = 'servizi',
  Clients = 'clients'
}

export const DashboardSections: any = {
  [SectionType.Certificati]: {
    title: 'APP.TITLE.Certificati',
    type: SectionType.Certificati,
    icon: 'shield-check',
    enabled: true,
    class: 'col-12',
    sections: [
      {
        title: 'APP.DASHBOARD.DominioPDND',
        icon: 'cloud',
        type: 'pdnd',
        path: '/servizi/pdnd/certificati/stato',
        enabled: true,
        class: 'primary',
        range: false,
        blocks: [
          { label: 'APP.LABEL.Errori', name: 'scaduti', path: 'servizi/pdnd/certificati/scaduti', model: ModelType.Servizi, type: SectionType.Certificati, enabled: true, count: 0, color: '#dd2b0e', col: 6 },
          { label: 'APP.LABEL.Warning', name: 'in_scadenza', path: 'servizi/pdnd/certificati/in-scadenza', model: ModelType.Servizi, type: SectionType.Certificati, enabled: true, count: 0, color: '#ff8f52', col: 6 }
        ]
      },
      {
        title: 'APP.DASHBOARD.DominioModi',
        icon: 'cloud',
        type: 'modi',
        path: '/servizi/modi/certificati/stato',
        enabled: true,
        class: 'primary',
        range: false,
        blocks: [
          { label: 'APP.LABEL.Errori', name: 'scaduti', path: 'servizi/modi/certificati/scaduti', model: ModelType.Servizi, type: SectionType.Certificati, enabled: true, count: 0, color: '#dd2b0e', col: 6 },
          { label: 'APP.LABEL.Warning', name: 'in_scadenza', path: 'servizi/modi/certificati/in-scadenza', model: ModelType.Servizi, type: SectionType.Certificati, enabled: true, count: 0, color: '#ff8f52', col: 6 }
        ]
      },
      {
        title: 'APP.DASHBOARD.client',
        icon: 'person',
        type: '',
        path: '/applicativi/certificati/stato',
        enabled: true,
        class: 'primary',
        range: false,
        blocks: [
          { label: 'APP.LABEL.Errori', name: 'scaduti', path: 'applicativi/certificati/scaduti', model: ModelType.Clients, type: SectionType.Certificati, enabled: true, count: 0, color: '#dd2b0e', col: 6 },
          { label: 'APP.LABEL.Warning', name: 'in_scadenza', path: 'applicativi/certificati/in-scadenza', model: ModelType.Clients, type: SectionType.Certificati, enabled: true, count: 0, color: '#ff8f52', col: 6 }
        ]
      }
    ]
  },
  [SectionType.Connettivita]: {
    title: 'APP.TITLE.Connettivita',
    type: SectionType.Connettivita,
    icon: 'hdd-network',
    enabled: true,
    class: 'col-sm-12 col-lg-6',
    sections: [
      {
        title: 'APP.DASHBOARD.DominioPDND',
        icon: 'cloud',
        type: 'pdnd',
        path: '/servizi/pdnd/backend/stato',
        enabled: true,
        class: 'warning',
        range: false,
        blocks: [
          { label: 'APP.LABEL.Errori', name: 'errori', path: 'servizi/pdnd/backend/details', model: ModelType.Servizi, type: SectionType.Connettivita, enabled: true, count: 0, color: '#dd2b0e', col: 12 }
        ]
      },
      {
        title: 'APP.DASHBOARD.DominioModi',
        icon: 'cloud',
        type: 'modi',
        path: '/servizi/modi/backend/stato',
        enabled: true,
        class: 'warning',
        range: false,
        blocks: [
          { label: 'APP.LABEL.Errori', name: 'errori', path: 'servizi/modi/backend/details', model: ModelType.Servizi, type: SectionType.Connettivita, enabled: true, count: 0, color: '#dd2b0e', col: 12 }
        ]
      }
    ]
  },
  [SectionType.Violazioni]: {
    title: 'APP.TITLE.ViolazioniPolicyRateLimiting',
    type: SectionType.Violazioni,
    icon: 'triangle',
    enabled: true,
    class: 'col-sm-12 col-lg-6',
    sections: [
      {
        title: 'APP.DASHBOARD.DominioPDND',
        icon: 'cloud',
        type: 'pdnd',
        path: '/servizi/pdnd/rate-limiting/stato',
        enabled: true,
        class: 'danger',
        range: true,
        blocks: [
          { label: 'APP.LABEL.LastHour', name: 'periodo1', path: 'servizi/pdnd/rate-limiting/details', model: ModelType.Servizi, type: SectionType.Violazioni, enabled: true, count: 0, color: '#dd2b0e', col: 6 },
          { label: 'APP.LABEL.Last24Hours', name: 'periodo2', path: 'servizi/pdnd/rate-limiting/details', model: ModelType.Servizi, type: SectionType.Violazioni, enabled: true, count: 0, color: '#dd2b0e', col: 6 }
        ]
      },
      {
        title: 'APP.DASHBOARD.DominioModi',
        icon: 'cloud',
        type: 'modi',
        path: '/servizi/modi/rate-limiting/stato',
        enabled: true,
        class: 'danger',
        range: true,
        blocks: [
          { label: 'APP.LABEL.LastHour', name: 'periodo1', path: 'servizi/modi/rate-limiting/details', model: ModelType.Servizi, type: SectionType.Violazioni, enabled: true, count: 0, color: '#dd2b0e', col: 6 },
          { label: 'APP.LABEL.Last24Hours', name: 'periodo2', path: 'servizi/modi/rate-limiting/details', model: ModelType.Servizi, type: SectionType.Violazioni, enabled: true, count: 0, color: '#dd2b0e', col: 6 }
        ]
      }
    ]
  },
  [SectionType.EventiConnection]: {
    title: 'APP.TITLE.EventiConnectionTimeout',
    type: SectionType.EventiConnection,
    icon: 'clock',
    enabled: true,
    class: 'col-sm-12 col-lg-6',
    sections: [
      {
        title: 'APP.DASHBOARD.DominioPDND',
        icon: 'cloud',
        type: 'pdnd',
        path: '/servizi/pdnd/connection-timeout/stato',
        enabled: true,
        class: 'success',
        range: true,
        blocks: [
          { label: 'APP.LABEL.LastHour', name: 'periodo1', path: 'servizi/pdnd/connection-timeout/details', model: ModelType.Servizi, type: SectionType.EventiConnection, enabled: true, count: 0, color: '#dd2b0e', col: 6 },
          { label: 'APP.LABEL.Last24Hours', name: 'periodo2', path: 'servizi/pdnd/connection-timeout/details', model: ModelType.Servizi, type: SectionType.EventiConnection, enabled: true, count: 0, color: '#dd2b0e', col: 6 }
        ]
      },
      {
        title: 'APP.DASHBOARD.DominioModi',
        icon: 'cloud',
        type: 'modi',
        path: '/servizi/modi/connection-timeout/stato',
        enabled: true,
        class: 'success',
        range: true,
        blocks: [
          { label: 'APP.LABEL.LastHour', name: 'periodo1', path: 'servizi/modi/connection-timeout/details', model: ModelType.Servizi, type: SectionType.EventiConnection, enabled: true, count: 0, color: '#dd2b0e', col: 6 },
          { label: 'APP.LABEL.Last24Hours', name: 'periodo2', path: 'servizi/modi/connection-timeout/details', model: ModelType.Servizi, type: SectionType.EventiConnection, enabled: true, count: 0, color: '#dd2b0e', col: 6 }
        ]
      }
    ]
  },
  [SectionType.EventiRead]: {
    title: 'APP.TITLE.EventiReadTimeout',
    type: SectionType.EventiRead,
    icon: 'clock',
    enabled: true,
    class: 'col-sm-12 col-lg-6',
    sections: [
      {
        title: 'APP.DASHBOARD.DominioPDND',
        icon: 'cloud',
        type: 'pdnd',
        path: '/servizi/pdnd/read-timeout/stato',
        enabled: true,
        class: 'success',
        range: true,
        blocks: [
          { label: 'APP.LABEL.LastHour', name: 'periodo1', path: 'servizi/pdnd/read-timeout/details', model: ModelType.Servizi, type: SectionType.EventiRead, enabled: true, count: 0, color: '#dd2b0e', col: 6 },
          { label: 'APP.LABEL.Last24Hours', name: 'periodo2', path: 'servizi/pdnd/read-timeout/details', model: ModelType.Servizi, type: SectionType.EventiRead, enabled: true, count: 0, color: '#dd2b0e', col: 6 }
        ]
      },
      {
        title: 'APP.DASHBOARD.DominioModi',
        icon: 'cloud',
        type: 'modi',
        path: '/servizi/modi/read-timeout/stato',
        enabled: true,
        class: 'success',
        range: true,
        blocks: [
          { label: 'APP.LABEL.LastHour', name: 'periodo1', path: 'servizi/modi/read-timeout/details', model: ModelType.Servizi, type: SectionType.EventiRead, enabled: true, count: 0, color: '#dd2b0e', col: 6 },
          { label: 'APP.LABEL.Last24Hours', name: 'periodo2', path: 'servizi/modi/read-timeout/details', model: ModelType.Servizi, type: SectionType.EventiRead, enabled: true, count: 0, color: '#dd2b0e', col: 6 }
        ]
      }
    ]
  }
};

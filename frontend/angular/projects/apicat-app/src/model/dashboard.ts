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

export interface DashboardItemServizio {
  id_servizio: string;
  nome: string;
  versione: string;
  tipo: string;
  stato: string;
  visibilita: string;
  descrizione_sintetica: string;
  multi_adesione: boolean;
  data_creazione: string;
  data_ultimo_aggiornamento: string;
}

export interface DashboardItemAdesione {
  id_adesione: string;
  soggetto: { id_soggetto: string; nome: string };
  servizio: { id_servizio: string; nome: string; versione: string };
  id_logico?: string;
  stato: string;
  skip_collaudo: boolean;
  stato_configurazione_automatica: string;
  messaggio_configurazione?: string;
  data_creazione: string;
  data_ultimo_aggiornamento: string;
  utente_creazione: { id_utente: string; nome: string; cognome: string };
}

export interface DashboardItemClient {
  id_client: string;
  soggetto: { id_soggetto: string; nome: string };
  ambiente: string;
  nome: string;
  stato: string;
  indirizzo_ip?: string;
  descrizione: string;
}

export interface DashboardItemComunicazione {
  uuid: string;
  tipo: string;
  data: string;
  oggetto: string;
  stato?: string;
  testo?: string;
  autore: { id_utente: string; nome: string; cognome: string };
  allegati?: any[];
  entita: { tipo: 'servizio' | 'adesione'; id: string; nome: string };
}

export interface DashboardItemUtente {
  id_utente: string;
  principal: string;
  nome: string;
  cognome: string;
  telefono_aziendale: string;
  email_aziendale: string;
  stato: string;
}

export interface DashboardPagedResponse<T> {
  content: T[];
  page: { size: number; totalElements: number; totalPages: number; number: number };
}

export interface DashboardRoleConfig {
  servizi: boolean;
  adesioni: boolean;
  client: boolean;
  comunicazioni: boolean;
  utenti: boolean;
}

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
 *
 */
package org.govway.catalogo.monitoraggioutils;

import java.util.Optional;

import org.govway.catalogo.gest.clients.govwaymonitor.PatchedApiClient;

import httpauth.OutboundAuthentication;

public class AbstractGovwayMonitorClient {

	protected PatchedApiClient getClient(ConfigurazioneConnessione configurazioneConnessione) {
		OutboundAuthentication autenticazione = configurazioneConnessione.getAutenticazione();

		PatchedApiClient client = new PatchedApiClient(
				credenzialeBasic(configurazioneConnessione.getUsername(), autenticazione),
				credenzialeBasic(configurazioneConnessione.getPassword(), autenticazione)
				);		
		client.setDebugging(true);
		client.setBasePath(configurazioneConnessione.getUrl());
		aggiungiAutenticazione(client, autenticazione);
		return client;
	}

	/**
	 * Con il token negoziato le credenziali basic non vengono presentate; senza di esso restano
	 * quelle della configurazione, passate al client cosi' come sono sempre state.
	 */
	private static Optional<String> credenzialeBasic(String valore, OutboundAuthentication autenticazione) {
		return autenticazione.isOauthClientCredentials() ? Optional.empty() : Optional.ofNullable(valore);
	}

	/**
	 * Aggiunge l'interceptor che autentica le richieste quando l'integrazione usa un token
	 * negoziato. Il token arriva dalla cache condivisa, quindi non c'e' una negoziazione per
	 * chiamata anche se il client viene ricostruito ogni volta.
	 *
	 * L'interceptor va aggiunto dopo setDebugging: gli application interceptor vengono eseguiti
	 * nell'ordine di registrazione, cosi' il logging della richiesta avviene prima che l'header
	 * Authorization sia presente e il token non finisce nei log.
	 */
	public static void aggiungiAutenticazione(PatchedApiClient client, OutboundAuthentication autenticazione) {
		autenticazione.interceptor().ifPresent(interceptor ->
				client.setHttpClient(client.getHttpClient().newBuilder().addInterceptor(interceptor).build()));
	}

}

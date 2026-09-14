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

import java.io.IOException;
import java.util.EnumMap;
import java.util.Map;

import jakarta.annotation.PostConstruct;

import org.govway.catalogo.servlets.monitor.model.AmbienteEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import httpauth.OutboundAuthentication;
import httpauth.OutboundAuthRegistry;

/**
 * Autenticazione con cui le integrazioni di monitoraggio si presentano a govway, per ambiente.
 *
 * Ogni integrazione puo' referenziare un profilo di autenticazione con la property
 * <code>&lt;integrazione&gt;.&lt;ambiente&gt;.authn.ref</code>. In assenza del riferimento questo
 * componente restituisce null e la {@link ConfigurazioneConnessione} continua a usare le
 * credenziali basic dell'integrazione, esattamente come prima.
 *
 * I riferimenti sono risolti all'avvio: un profilo referenziato ma non configurato impedisce il
 * deploy invece di degradare silenziosamente su credenziali diverse da quelle attese.
 */
@Component
public class AutenticazioniMonitoraggio {

	private static final Logger logger = LoggerFactory.getLogger(AutenticazioniMonitoraggio.class);

	@Value("${monitor.collaudo.authn.ref:#{null}}")
	private String refMonitorCollaudo;

	@Value("${monitor.produzione.authn.ref:#{null}}")
	private String refMonitorProduzione;

	@Value("${statistiche.collaudo.authn.ref:#{null}}")
	private String refStatisticheCollaudo;

	@Value("${statistiche.produzione.authn.ref:#{null}}")
	private String refStatisticheProduzione;

	@Value("${allarmi.collaudo.authn.ref:#{null}}")
	private String refAllarmiCollaudo;

	@Value("${allarmi.produzione.authn.ref:#{null}}")
	private String refAllarmiProduzione;

	@Autowired
	private OutboundAuthRegistry authRegistry;

	private Map<AmbienteEnum, OutboundAuthentication> monitor;
	private Map<AmbienteEnum, OutboundAuthentication> statistiche;
	private Map<AmbienteEnum, OutboundAuthentication> allarmi;

	@PostConstruct
	void init() throws IOException {
		this.monitor = risolvi("monitor", this.refMonitorCollaudo, this.refMonitorProduzione);
		this.statistiche = risolvi("statistiche", this.refStatisticheCollaudo, this.refStatisticheProduzione);
		this.allarmi = risolvi("allarmi", this.refAllarmiCollaudo, this.refAllarmiProduzione);
	}

	/**
	 * @param ambiente ambiente dell'integrazione
	 * @return autenticazione verso l'API di monitoraggio, null se resta quella basic storica
	 */
	public OutboundAuthentication monitor(AmbienteEnum ambiente) {
		return this.monitor.get(ambiente);
	}

	/**
	 * @param ambiente ambiente dell'integrazione
	 * @return autenticazione verso l'API delle statistiche, null se resta quella basic storica
	 */
	public OutboundAuthentication statistiche(AmbienteEnum ambiente) {
		return this.statistiche.get(ambiente);
	}

	/**
	 * @param ambiente ambiente dell'integrazione
	 * @return autenticazione verso l'API degli allarmi, null se resta quella basic storica
	 */
	public OutboundAuthentication allarmi(AmbienteEnum ambiente) {
		return this.allarmi.get(ambiente);
	}

	private Map<AmbienteEnum, OutboundAuthentication> risolvi(String integrazione, String refCollaudo,
			String refProduzione) throws IOException {
		Map<AmbienteEnum, OutboundAuthentication> risolte = new EnumMap<>(AmbienteEnum.class);

		aggiungi(risolte, integrazione, AmbienteEnum.COLLAUDO, refCollaudo);
		aggiungi(risolte, integrazione, AmbienteEnum.PRODUZIONE, refProduzione);

		return risolte;
	}

	private void aggiungi(Map<AmbienteEnum, OutboundAuthentication> risolte, String integrazione,
			AmbienteEnum ambiente, String ref) throws IOException {
		if(ref == null || ref.isBlank()) {
			return;
		}

		OutboundAuthentication autenticazione = this.authRegistry.resolve(ref, null, null);

		if(!autenticazione.isOauthClientCredentials()) {
			// profilo disattivato con mode=none: restano le credenziali basic dell'integrazione
			logger.info("integrazione {} ambiente {}: profilo '{}' disattivato, si usano le credenziali basic",
					integrazione, ambiente, ref);
			return;
		}

		risolte.put(ambiente, autenticazione);
		logger.info("integrazione {} ambiente {}: autenticazione {}", integrazione, ambiente, autenticazione);
	}
}

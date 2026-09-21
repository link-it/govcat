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
package org.govway.catalogo.pdnd.controllers;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.UUID;
import java.util.concurrent.ConcurrentSkipListMap;

import org.govway.catalogo.servlets.pdnd.model.Event;
import org.govway.catalogo.servlets.pdnd.model.Events;
import org.govway.catalogo.servlets.pdnd.v3.client.api.GatewayApi;
import org.govway.catalogo.servlets.pdnd.v3.client.api.impl.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Espone gli eventi dell'API PDND v3 nel modello dell'API esposta da GovCat.
 *
 * L'API v1 identifica gli eventi con un progressivo numerico, mentre la v3 li identifica con
 * un UUID e non restituisce alcun progressivo. Poiche' i flussi di eventi sono in sola
 * aggiunta e restituiti in ordine cronologico, il progressivo esposto e' la <b>posizione</b>
 * dell'evento nel flusso: stabile nel tempo e confrontabile come richiede il contratto.
 *
 * Per non rileggere il flusso dall'inizio a ogni invocazione, le posizioni gia' incontrate
 * vengono annotate come punti di ripresa (posizione - UUID). La memoria non e' necessaria
 * alla correttezza: in sua assenza il flusso viene semplicemente riletto.
 */
public class PDNDEventiV3 {

	/** Numero massimo di eventi per pagina consentito dall'API PDND v3. */
	private static final int PAGINA = 500;

	/** Numero massimo di pagine lette per singola invocazione, a tutela di loop non terminanti. */
	private static final int MAX_PAGINE = 1000;

	/**
	 * Flussi di eventi della v3, con il tipo di oggetto riportato nel modello esposto.
	 */
	public enum Flusso {
		ESERVICE("ESERVICE"),
		KEY("KEY"),
		AGREEMENT("AGREEMENT"),
		PURPOSE("PURPOSE"),
		TENANT("TENANT"),
		ATTRIBUTE("ATTRIBUTE"),
		CLIENT("CLIENT"),
		PRODUCER_KEY("PRODUCER_KEY"),
		PRODUCER_KEYCHAIN("PRODUCER_KEYCHAIN"),
		CONSUMER_DELEGATION("CONSUMER_DELEGATION"),
		PRODUCER_DELEGATION("PRODUCER_DELEGATION"),
		ESERVICE_TEMPLATE("ESERVICE_TEMPLATE"),
		PURPOSE_TEMPLATE("PURPOSE_TEMPLATE");

		private final String tipoOggetto;

		Flusso(String tipoOggetto) {
			this.tipoOggetto = tipoOggetto;
		}

		public String getTipoOggetto() {
			return tipoOggetto;
		}
	}

	private Logger logger = LoggerFactory.getLogger(PDNDEventiV3.class);

	private GatewayApi gatewayApiClient;

	/** Punti di ripresa per flusso: posizione dell'evento nel flusso e relativo UUID. */
	private Map<Flusso, NavigableMap<Long, UUID>> ripresa = new EnumMap<>(Flusso.class);

	public PDNDEventiV3(GatewayApi gatewayApiClient) {
		this.gatewayApiClient = gatewayApiClient;
	}

	/**
	 * Restituisce gli eventi di un singolo flusso successivi alla posizione indicata.
	 *
	 * @param flusso flusso da leggere
	 * @param lastEventId posizione dell'ultimo evento gia' ricevuto, 0 o null per iniziare
	 * @param limit numero massimo di eventi restituiti
	 */
	public Events getEventi(Flusso flusso, Long lastEventId, Integer limit) throws ApiException {
		long da = lastEventId != null && lastEventId > 0 ? lastEventId : 0L;
		int massimo = limit != null && limit > 0 ? limit : PAGINA;

		List<EventoPdnd> eventi = leggiFlusso(flusso, da, massimo);

		return toEvents(eventi);
	}

	/**
	 * Restituisce gli eventi di tutti i flussi, ordinati cronologicamente, successivi alla
	 * posizione indicata: e' il flusso unico previsto dall'API esposta.
	 *
	 * Le posizioni della sequenza aggregata sono indipendenti da quelle dei singoli flussi.
	 */
	public Events getEventi(Long lastEventId, Integer limit) throws ApiException {
		long da = lastEventId != null && lastEventId > 0 ? lastEventId : 0L;
		int massimo = limit != null && limit > 0 ? limit : PAGINA;

		// la sequenza aggregata si ottiene ordinando cronologicamente gli eventi di tutti i
		// flussi: la posizione richiesta e' quindi calcolata sull'insieme ordinato
		List<EventoPdnd> tutti = new ArrayList<>();
		for(Flusso flusso: Flusso.values()) {
			tutti.addAll(leggiFlusso(flusso, 0L, (int) da + massimo));
		}

		tutti.sort(Comparator
				.comparing(EventoPdnd::getIstante, Comparator.nullsLast(Comparator.naturalOrder()))
				.thenComparing(EventoPdnd::getIdPdnd));

		List<EventoPdnd> eventi = new ArrayList<>();
		long posizione = 0;
		for(EventoPdnd evento: tutti) {
			posizione++;
			if(posizione <= da) {
				continue;
			}

			eventi.add(evento.conPosizione(posizione));

			if(eventi.size() >= massimo) {
				break;
			}
		}

		return toEvents(eventi);
	}

	/**
	 * Legge dal flusso indicato gli eventi successivi alla posizione richiesta, riprendendo
	 * dal punto annotato piu' vicino.
	 */
	private List<EventoPdnd> leggiFlusso(Flusso flusso, long da, int massimo) throws ApiException {
		NavigableMap<Long, UUID> punti = this.ripresa.computeIfAbsent(flusso,
				f -> new ConcurrentSkipListMap<>());

		Map.Entry<Long, UUID> punto = punti.floorEntry(da);
		long posizione = punto != null ? punto.getKey() : 0L;
		UUID cursore = punto != null ? punto.getValue() : null;

		List<EventoPdnd> eventi = new ArrayList<>();

		for(int pagina = 0; pagina < MAX_PAGINE; pagina++) {
			List<EventoPdnd> lette = leggiPagina(flusso, cursore);
			if(lette.isEmpty()) {
				return eventi;
			}

			for(EventoPdnd evento: lette) {
				posizione++;
				punti.put(posizione, evento.getIdPdnd());

				if(posizione > da) {
					eventi.add(evento.conPosizione(posizione));
				}

				if(eventi.size() >= massimo) {
					return eventi;
				}
			}

			cursore = lette.get(lette.size() - 1).getIdPdnd();

			if(lette.size() < PAGINA) {
				return eventi;
			}
		}

		this.logger.warn("Raggiunto il numero massimo di pagine ({}) nella lettura del flusso eventi [{}]: "
				+ "i risultati potrebbero essere incompleti", MAX_PAGINE, flusso);

		return eventi;
	}

	private List<EventoPdnd> leggiPagina(Flusso flusso, UUID cursore) throws ApiException {
		List<EventoPdnd> eventi = new ArrayList<>();

		switch(flusso) {
		case ESERVICE:
			this.gatewayApiClient.getEServicesEvents(PAGINA, null, cursore).getEvents()
				.forEach(e -> eventi.add(new EventoPdnd(flusso, e.getId(), e.getEventTimestamp(),
						e.getEventType() != null ? e.getEventType().getValue() : null,
						riferimenti("eserviceId", e.getEserviceId(), "descriptorId", e.getDescriptorId()))));
			break;
		case KEY:
			this.gatewayApiClient.getKeyEvents(PAGINA, cursore).getEvents()
				.forEach(e -> eventi.add(new EventoPdnd(flusso, e.getId(), e.getEventTimestamp(),
						e.getEventType() != null ? e.getEventType().getValue() : null,
						riferimenti("kid", e.getKid(), "clientId", e.getClientId()))));
			break;
		case AGREEMENT:
			this.gatewayApiClient.getAgreementsEvents(PAGINA, cursore, null).getEvents()
				.forEach(e -> eventi.add(new EventoPdnd(flusso, e.getId(), e.getEventTimestamp(),
						e.getEventType() != null ? e.getEventType().getValue() : null,
						riferimenti("agreementId", e.getAgreementId()))));
			break;
		case PURPOSE:
			this.gatewayApiClient.getPurposeEvents(PAGINA, cursore, null).getEvents()
				.forEach(e -> eventi.add(new EventoPdnd(flusso, e.getId(), e.getEventTimestamp(),
						e.getEventType() != null ? e.getEventType().getValue() : null,
						riferimenti("purposeId", e.getPurposeId(), "purposeVersionId", e.getPurposeVersionId()))));
			break;
		case TENANT:
			this.gatewayApiClient.getTenantEvents(PAGINA, cursore).getEvents()
				.forEach(e -> eventi.add(new EventoPdnd(flusso, e.getId(), e.getEventTimestamp(),
						e.getEventType() != null ? e.getEventType().getValue() : null,
						riferimenti("tenantId", e.getTenantId()))));
			break;
		case ATTRIBUTE:
			this.gatewayApiClient.getAttributesEvents(PAGINA, cursore).getEvents()
				.forEach(e -> eventi.add(new EventoPdnd(flusso, e.getId(), e.getEventTimestamp(),
						e.getEventType() != null ? e.getEventType().getValue() : null,
						riferimenti("attributeId", e.getAttributeId()))));
			break;
		case CLIENT:
			this.gatewayApiClient.getClientEvents(PAGINA, cursore).getEvents()
				.forEach(e -> eventi.add(new EventoPdnd(flusso, e.getId(), e.getEventTimestamp(),
						e.getEventType() != null ? e.getEventType().getValue() : null,
						riferimenti("clientId", e.getClientId()))));
			break;
		case PRODUCER_KEY:
			this.gatewayApiClient.getProducerKeyEvents(PAGINA, cursore).getEvents()
				.forEach(e -> eventi.add(new EventoPdnd(flusso, e.getId(), e.getEventTimestamp(),
						e.getEventType() != null ? e.getEventType().getValue() : null,
						riferimenti("kid", e.getKid(), "producerKeychainId", e.getProducerKeychainId()))));
			break;
		case PRODUCER_KEYCHAIN:
			this.gatewayApiClient.getProducerKeychainEvents(PAGINA, cursore).getEvents()
				.forEach(e -> eventi.add(new EventoPdnd(flusso, e.getId(), e.getEventTimestamp(),
						e.getEventType() != null ? e.getEventType().getValue() : null,
						riferimenti("producerKeychainId", e.getProducerKeychainId()))));
			break;
		case CONSUMER_DELEGATION:
			this.gatewayApiClient.getConsumerDelegationEvents(PAGINA, cursore).getEvents()
				.forEach(e -> eventi.add(new EventoPdnd(flusso, e.getId(), e.getEventTimestamp(),
						e.getEventType() != null ? e.getEventType().getValue() : null,
						riferimenti("delegationId", e.getDelegationId()))));
			break;
		case PRODUCER_DELEGATION:
			this.gatewayApiClient.getProducerDelegationEvents(PAGINA, cursore).getEvents()
				.forEach(e -> eventi.add(new EventoPdnd(flusso, e.getId(), e.getEventTimestamp(),
						e.getEventType() != null ? e.getEventType().getValue() : null,
						riferimenti("delegationId", e.getDelegationId()))));
			break;
		case ESERVICE_TEMPLATE:
			this.gatewayApiClient.getEServiceTemplateEvents(PAGINA, cursore).getEvents()
				.forEach(e -> eventi.add(new EventoPdnd(flusso, e.getId(), e.getEventTimestamp(),
						e.getEventType() != null ? e.getEventType().getValue() : null,
						riferimenti("eserviceTemplateId", e.getEserviceTemplateId(),
								"eserviceTemplateVersionId", e.getEserviceTemplateVersionId()))));
			break;
		case PURPOSE_TEMPLATE:
			this.gatewayApiClient.getPurposeTemplateEvents(PAGINA, cursore).getEvents()
				.forEach(e -> eventi.add(new EventoPdnd(flusso, e.getId(), e.getEventTimestamp(),
						e.getEventType() != null ? e.getEventType().getValue() : null,
						riferimenti("purposeTemplateId", e.getPurposeTemplateId()))));
			break;
		}

		return eventi;
	}

	private Map<String, String> riferimenti(Object... chiaviValori) {
		Map<String, String> riferimenti = new LinkedHashMap<>();

		for(int i = 0; i + 1 < chiaviValori.length; i = i + 2) {
			if(chiaviValori[i + 1] != null) {
				riferimenti.put((String) chiaviValori[i], chiaviValori[i + 1].toString());
			}
		}

		return riferimenti;
	}

	private Events toEvents(List<EventoPdnd> eventi) {
		Events response = new Events();
		response.setEvents(new ArrayList<>());

		for(EventoPdnd evento: eventi) {
			Event event = new Event();
			event.setEventId(evento.getPosizione());
			event.setEventType(evento.getTipoEvento());
			event.setObjectType(evento.getFlusso().getTipoOggetto());
			event.setObjectId(evento.getRiferimenti());

			response.addEventsItem(event);
			response.setLastEventId(evento.getPosizione());
		}

		return response;
	}

	/**
	 * Evento della PDND normalizzato: identificativo di origine, istante, tipo e riferimenti
	 * all'oggetto coinvolto, piu' la posizione assegnata nella sequenza.
	 */
	private static class EventoPdnd {

		private final Flusso flusso;
		private final UUID idPdnd;
		private final OffsetDateTime istante;
		private final String tipoEvento;
		private final Map<String, String> riferimenti;
		private final Long posizione;

		EventoPdnd(Flusso flusso, UUID idPdnd, OffsetDateTime istante, String tipoEvento,
				Map<String, String> riferimenti) {
			this(flusso, idPdnd, istante, tipoEvento, riferimenti, null);
		}

		private EventoPdnd(Flusso flusso, UUID idPdnd, OffsetDateTime istante, String tipoEvento,
				Map<String, String> riferimenti, Long posizione) {
			this.flusso = flusso;
			this.idPdnd = idPdnd;
			this.istante = istante;
			this.tipoEvento = tipoEvento;
			this.riferimenti = riferimenti;
			this.posizione = posizione;
		}

		EventoPdnd conPosizione(long posizione) {
			return new EventoPdnd(this.flusso, this.idPdnd, this.istante, this.tipoEvento,
					this.riferimenti, posizione);
		}

		Flusso getFlusso() {
			return flusso;
		}

		UUID getIdPdnd() {
			return idPdnd;
		}

		OffsetDateTime getIstante() {
			return istante;
		}

		String getTipoEvento() {
			return tipoEvento;
		}

		Map<String, String> getRiferimenti() {
			return riferimenti;
		}

		Long getPosizione() {
			return posizione;
		}
	}
}

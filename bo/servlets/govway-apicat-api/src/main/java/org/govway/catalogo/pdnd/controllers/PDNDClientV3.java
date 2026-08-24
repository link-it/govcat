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

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.govway.catalogo.exception.ClientApiException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.NotImplementedException;
import org.govway.catalogo.servlets.pdnd.model.Agreement;
import org.govway.catalogo.servlets.pdnd.model.AgreementState;
import org.govway.catalogo.servlets.pdnd.model.Agreements;
import org.govway.catalogo.servlets.pdnd.model.Attribute;
import org.govway.catalogo.servlets.pdnd.model.AttributeKind;
import org.govway.catalogo.servlets.pdnd.model.AttributeSeed;
import org.govway.catalogo.servlets.pdnd.model.Attributes;
import org.govway.catalogo.servlets.pdnd.model.Client;
import org.govway.catalogo.servlets.pdnd.model.EService;
import org.govway.catalogo.servlets.pdnd.model.EServiceAttribute;
import org.govway.catalogo.servlets.pdnd.model.EServiceAttributeValue;
import org.govway.catalogo.servlets.pdnd.model.EServiceAttributes;
import org.govway.catalogo.servlets.pdnd.model.EServiceDescriptor;
import org.govway.catalogo.servlets.pdnd.model.EServiceDescriptorState;
import org.govway.catalogo.servlets.pdnd.model.EServiceDescriptors;
import org.govway.catalogo.servlets.pdnd.model.EServiceDoc;
import org.govway.catalogo.servlets.pdnd.model.EServiceTechnology;
import org.govway.catalogo.servlets.pdnd.model.EServices;
import org.govway.catalogo.servlets.pdnd.model.Events;
import org.govway.catalogo.servlets.pdnd.model.ExternalId;
import org.govway.catalogo.servlets.pdnd.model.JWK;
import org.govway.catalogo.servlets.pdnd.model.Organization;
import org.govway.catalogo.servlets.pdnd.model.OtherPrimeInfo;
import org.govway.catalogo.servlets.pdnd.model.Problem;
import org.govway.catalogo.servlets.pdnd.model.ProblemError;
import org.govway.catalogo.servlets.pdnd.model.Purpose;
import org.govway.catalogo.servlets.pdnd.model.PurposeState;
import org.govway.catalogo.servlets.pdnd.model.Purposes;
import org.govway.catalogo.servlets.pdnd.model.Subscriber;
import org.govway.catalogo.servlets.pdnd.model.Subscribers;
import org.govway.catalogo.servlets.pdnd.v3.client.api.GatewayApi;
import org.govway.catalogo.servlets.pdnd.v3.client.api.impl.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;

/**
 * Implementazione basata sull'API PDND core v3.
 *
 * L'interfaccia esposta da GovCat resta quella modellata sull'API PDND v1: questa classe
 * si occupa di orchestrare le operazioni v3 necessarie e di riportare i risultati nel
 * modello dati v1. Le operazioni per le quali la v3 non offre un equivalente sono
 * segnalate con {@link NotImplementedException} (HTTP 501).
 */
public class PDNDClientV3 implements IPDNDClient {

	/** Numero massimo di elementi per pagina consentito dall'API PDND v3. */
	private static final int PAGE_SIZE = 50;

	/** Numero massimo di pagine richieste per singola collezione, a tutela di loop non terminanti. */
	private static final int MAX_PAGES = 1000;

	private static final String ORIGIN_IPA = "IPA";

	private Logger logger = LoggerFactory.getLogger(PDNDClientV3.class);

	private GatewayApi gatewayApiClient;

	public PDNDClientV3(GatewayApi gatewayApiClient) {
		this.gatewayApiClient = gatewayApiClient;
	}

	@Override
	public ResponseEntity<Problem> getStatus() {
		try {
			return ResponseEntity.ok(toProblem(this.gatewayApiClient.getStatus()));
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<Subscribers> getSubscribers(UUID producerId, UUID eserviceId) {
		try {
			List<org.govway.catalogo.servlets.pdnd.v3.model.Agreement> agreements =
					getAgreementsV3(producerId, null, eserviceId, null, null);

			Map<UUID, org.govway.catalogo.servlets.pdnd.v3.model.Tenant> tenants = new HashMap<>();

			Subscribers response = new Subscribers();
			for(org.govway.catalogo.servlets.pdnd.v3.model.Agreement agreement: agreements) {
				Subscriber subscriber = new Subscriber();
				subscriber.setState(toAgreementState(agreement.getState()));
				subscriber.setConsumerId(agreement.getConsumerId());

				org.govway.catalogo.servlets.pdnd.v3.model.Tenant tenant =
						tenants.get(agreement.getConsumerId());
				if(tenant == null) {
					tenant = this.gatewayApiClient.getTenant(agreement.getConsumerId());
					tenants.put(agreement.getConsumerId(), tenant);
				}

				subscriber.setCategory(toCategory(tenant));
				subscriber.setExternalId(toExternalId(tenant));
				subscriber.setName(tenant.getName());

				response.addSubscribersItem(subscriber);
			}

			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.INT_500_PDND, e);
		}
	}

	@Override
	public ResponseEntity<Attribute> createCertifiedAttribute(AttributeSeed attributeSeed) {
		try {
			org.govway.catalogo.servlets.pdnd.v3.model.CertifiedAttributeSeed seed =
					new org.govway.catalogo.servlets.pdnd.v3.model.CertifiedAttributeSeed();
			seed.setCode(attributeSeed.getCode());
			seed.setName(attributeSeed.getName());
			seed.setDescription(attributeSeed.getDescription());

			org.govway.catalogo.servlets.pdnd.v3.model.CertifiedAttribute response =
					this.gatewayApiClient.createCertifiedAttribute(seed);

			return ResponseEntity.ok(toAttribute(response.getId(), response.getName(), AttributeKind.CERTIFIED));
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<Agreement> getAgreement(UUID agreementId) {
		try {
			return ResponseEntity.ok(toAgreement(this.gatewayApiClient.getAgreement(agreementId)));
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<Attributes> getAgreementAttributes(UUID agreementId) {
		throw notImplemented("getAgreementAttributes");
	}

	@Override
	public ResponseEntity<Agreement> getAgreementByPurpose(UUID purposeId) {
		try {
			return ResponseEntity.ok(toAgreement(this.gatewayApiClient.getPurposeAgreement(purposeId)));
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<Purposes> getAgreementPurposes(UUID agreementId) {
		try {
			Purposes response = new Purposes();
			response.setPurposes(new ArrayList<>());

			for(org.govway.catalogo.servlets.pdnd.v3.model.Purpose purpose:
					fetchAll(offset -> this.gatewayApiClient.getAgreementPurposes(agreementId, PAGE_SIZE, offset).getResults())) {
				toPurpose(purpose).ifPresent(response::addPurposesItem);
			}

			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<Agreements> getAgreements(UUID producerId, UUID consumerId, UUID eserviceId,
			UUID descriptorId, List<AgreementState> states) {
		try {
			Agreements response = new Agreements();
			response.setAgreements(new ArrayList<>());

			for(org.govway.catalogo.servlets.pdnd.v3.model.Agreement agreement:
					getAgreementsV3(producerId, consumerId, eserviceId, descriptorId, states)) {
				response.addAgreementsItem(toAgreement(agreement));
			}

			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<Attribute> getAttribute(UUID attributeId) {
		try {
			try {
				org.govway.catalogo.servlets.pdnd.v3.model.CertifiedAttribute certified =
						this.gatewayApiClient.getCertifiedAttribute(attributeId);
				return ResponseEntity.ok(toAttribute(certified.getId(), certified.getName(), AttributeKind.CERTIFIED));
			} catch(ApiException e) {
				rethrowIfNotNotFound(e);
			}

			try {
				org.govway.catalogo.servlets.pdnd.v3.model.DeclaredAttribute declared =
						this.gatewayApiClient.getDeclaredAttribute(attributeId);
				return ResponseEntity.ok(toAttribute(declared.getId(), declared.getName(), AttributeKind.DECLARED));
			} catch(ApiException e) {
				rethrowIfNotNotFound(e);
			}

			org.govway.catalogo.servlets.pdnd.v3.model.VerifiedAttribute verified =
					this.gatewayApiClient.getVerifiedAttribute(attributeId);
			return ResponseEntity.ok(toAttribute(verified.getId(), verified.getName(), AttributeKind.VERIFIED));
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<Client> getClient(UUID clientId) {
		try {
			org.govway.catalogo.servlets.pdnd.v3.model.Client client = this.gatewayApiClient.getClient(clientId);

			Client response = new Client();
			response.setId(client.getId());
			response.setConsumerId(client.getConsumerId());

			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<EService> getEService(UUID eserviceId) {
		try {
			return ResponseEntity.ok(toEService(this.gatewayApiClient.getEService(eserviceId)));
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<EServiceDescriptor> getEServiceDescriptor(UUID eserviceId, UUID descriptorId) {
		try {
			org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptor descriptor =
					this.gatewayApiClient.getEServiceDescriptor(eserviceId, descriptorId);

			return ResponseEntity.ok(toEServiceDescriptor(eserviceId, descriptor));
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<EServiceDescriptors> getEServiceDescriptors(UUID eserviceId) {
		try {
			EServiceDescriptors response = new EServiceDescriptors();
			response.setDescriptors(new ArrayList<>());

			for(org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptor descriptor:
					getEServiceDescriptorsV3(eserviceId)) {
				if(toEServiceDescriptorState(descriptor.getState()).isPresent()) {
					response.addDescriptorsItem(toEServiceDescriptor(eserviceId, descriptor));
				}
			}

			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<Events> getEservicesEventsFromId(Long lastEventId, Integer limit) {
		throw notImplemented("getEservicesEventsFromId");
	}

	@Override
	public ResponseEntity<Events> getEventsFromId(Long lastEventId, Integer limit) {
		throw notImplemented("getEventsFromId");
	}

	@Override
	public ResponseEntity<JWK> getJWKPublicKey(String kid) {
		try {
			org.govway.catalogo.servlets.pdnd.v3.model.Key key = this.gatewayApiClient.getJWKByKid(kid);
			return ResponseEntity.ok(toJWK(key.getJwk()));
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<Events> getKeysEventsFromId(Long lastEventId, Integer limit) {
		throw notImplemented("getKeysEventsFromId");
	}

	@Override
	public ResponseEntity<Organization> getOrganization(UUID organizationId) {
		try {
			return ResponseEntity.ok(toOrganization(this.gatewayApiClient.getTenant(organizationId)));
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<EServices> getOrganizationEServices(String origin, String externalId, String attributeOrigin,
			String attributeCode) {
		try {
			org.govway.catalogo.servlets.pdnd.v3.model.Tenant tenant = findTenant(origin, externalId);

			EServices response = new EServices();
			response.setEservices(new ArrayList<>());

			for(org.govway.catalogo.servlets.pdnd.v3.model.EService eservice:
					fetchAll(offset -> this.gatewayApiClient.getEServices(offset, PAGE_SIZE, List.of(tenant.getId()),
							null, null, null, null, null, null, null).getResults())) {

				EService converted = toEService(eservice, tenant);
				if(hasAttribute(converted, attributeOrigin, attributeCode)) {
					response.addEservicesItem(converted);
				}
			}

			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<Purpose> getPurpose(UUID purposeId) {
		try {
			org.govway.catalogo.servlets.pdnd.v3.model.Purpose purpose = this.gatewayApiClient.getPurpose(purposeId);

			return ResponseEntity.ok(toPurpose(purpose).orElseThrow(() ->
					new InternalException(ErrorCode.INT_500_PDND, Map.of("dettagli",
							"stato della finalita' ["+purposeId+"] non rappresentabile nel modello dati esposto"))));
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw toClientApiException(e);
		}
	}

	@Override
	public ResponseEntity<Void> revokeTenantAttribute(String origin, String externalId, String code) {
		throw notImplemented("revokeTenantAttribute");
	}

	@Override
	public ResponseEntity<Void> upsertTenant(String origin, String externalId, String code) {
		throw notImplemented("upsertTenant");
	}


	// ==================== invocazioni v3 ====================

	private List<org.govway.catalogo.servlets.pdnd.v3.model.Agreement> getAgreementsV3(UUID producerId,
			UUID consumerId, UUID eserviceId, UUID descriptorId, List<AgreementState> states) throws ApiException {

		List<org.govway.catalogo.servlets.pdnd.v3.model.AgreementState> statesV3 = null;
		if(states != null && !states.isEmpty()) {
			statesV3 = new ArrayList<>();
			for(AgreementState state: states) {
				statesV3.add(org.govway.catalogo.servlets.pdnd.v3.model.AgreementState.fromValue(state.getValue()));
			}
		}

		final List<org.govway.catalogo.servlets.pdnd.v3.model.AgreementState> statesFilter = statesV3;

		List<org.govway.catalogo.servlets.pdnd.v3.model.Agreement> agreements = fetchAll(offset ->
				this.gatewayApiClient.getAgreements(offset, PAGE_SIZE, statesFilter, toList(producerId),
						toList(consumerId), toList(descriptorId), toList(eserviceId)).getResults());

		// gli accordi in bozza non sono rappresentabili nel modello dati esposto, che non prevede lo stato DRAFT
		List<org.govway.catalogo.servlets.pdnd.v3.model.Agreement> filtrati = new ArrayList<>();
		for(org.govway.catalogo.servlets.pdnd.v3.model.Agreement agreement: agreements) {
			if(org.govway.catalogo.servlets.pdnd.v3.model.AgreementState.DRAFT.equals(agreement.getState())) {
				this.logger.debug("Accordo [{}] in stato DRAFT escluso dai risultati", agreement.getId());
			} else {
				filtrati.add(agreement);
			}
		}

		return filtrati;
	}

	private List<org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptor> getEServiceDescriptorsV3(UUID eserviceId)
			throws ApiException {
		return fetchAll(offset ->
				this.gatewayApiClient.getEServiceDescriptors(eserviceId, offset, PAGE_SIZE, null).getResults());
	}

	private org.govway.catalogo.servlets.pdnd.v3.model.Tenant findTenant(String origin, String externalId)
			throws ApiException {

		boolean ipa = ORIGIN_IPA.equalsIgnoreCase(origin);
		String ipaCode = ipa ? externalId : null;
		String taxCode = ipa ? null : externalId;

		List<org.govway.catalogo.servlets.pdnd.v3.model.Tenant> tenants =
				this.gatewayApiClient.getTenants(0, PAGE_SIZE, ipaCode, taxCode).getResults();

		if(tenants == null || tenants.isEmpty()) {
			throw new NotFoundException(ErrorCode.GEN_404,
					Map.of("risorsa", "organizzazione ["+origin+"/"+externalId+"]"));
		}

		return tenants.get(0);
	}

	/**
	 * Scorre tutte le pagine di una collezione paginata dell'API v3.
	 */
	private <T> List<T> fetchAll(PageFetcher<T> fetcher) throws ApiException {
		List<T> risultati = new ArrayList<>();

		int offset = 0;
		for(int pagina = 0; pagina < MAX_PAGES; pagina++) {
			List<T> pagec = fetcher.fetch(offset);
			if(pagec == null || pagec.isEmpty()) {
				return risultati;
			}

			risultati.addAll(pagec);

			if(pagec.size() < PAGE_SIZE) {
				return risultati;
			}

			offset = offset + PAGE_SIZE;
		}

		this.logger.warn("Raggiunto il numero massimo di pagine ({}) nel recupero di una collezione PDND: "
				+ "i risultati potrebbero essere incompleti", MAX_PAGES);

		return risultati;
	}

	private interface PageFetcher<T> {
		List<T> fetch(Integer offset) throws ApiException;
	}


	// ==================== conversioni verso il modello esposto ====================

	private Problem toProblem(org.govway.catalogo.servlets.pdnd.v3.model.Problem problem) {
		if(problem == null) {
			return null;
		}

		Problem response = new Problem();
		response.setType(problem.getType());
		response.setStatus(problem.getStatus());
		response.setTitle(problem.getTitle());
		response.setCorrelationId(problem.getCorrelationId());
		response.setDetail(problem.getDetail());

		if(problem.getErrors() != null) {
			for(org.govway.catalogo.servlets.pdnd.v3.model.ProblemError error: problem.getErrors()) {
				ProblemError converted = new ProblemError();
				converted.setCode(error.getCode());
				converted.setDetail(error.getDetail());
				response.addErrorsItem(converted);
			}
		}

		return response;
	}

	private Agreement toAgreement(org.govway.catalogo.servlets.pdnd.v3.model.Agreement agreement) {
		Agreement response = new Agreement();
		response.setId(agreement.getId());
		response.setEserviceId(agreement.getEserviceId());
		response.setDescriptorId(agreement.getDescriptorId());
		response.setProducerId(agreement.getProducerId());
		response.setConsumerId(agreement.getConsumerId());
		response.setState(toAgreementState(agreement.getState()));
		return response;
	}

	private AgreementState toAgreementState(org.govway.catalogo.servlets.pdnd.v3.model.AgreementState state) {
		if(state == null) {
			return null;
		}

		switch(state) {
		case ACTIVE: return AgreementState.ACTIVE;
		case PENDING: return AgreementState.PENDING;
		case SUSPENDED: return AgreementState.SUSPENDED;
		case ARCHIVED: return AgreementState.ARCHIVED;
		case MISSING_CERTIFIED_ATTRIBUTES: return AgreementState.MISSING_CERTIFIED_ATTRIBUTES;
		case REJECTED: return AgreementState.REJECTED;
		case DRAFT:
		}

		throw new InternalException(ErrorCode.INT_500_PDND, Map.of("dettagli",
				"stato accordo ["+state.getValue()+"] non rappresentabile nel modello dati esposto"));
	}

	private Optional<Purpose> toPurpose(org.govway.catalogo.servlets.pdnd.v3.model.Purpose purpose) {
		org.govway.catalogo.servlets.pdnd.v3.model.PurposeVersion version = purpose.getCurrentVersion();
		if(version == null) {
			version = purpose.getWaitingForApprovalVersion();
		}
		if(version == null) {
			version = purpose.getRejectedVersion();
		}

		Optional<PurposeState> state = toPurposeState(version);
		if(state.isEmpty()) {
			this.logger.debug("Finalita' [{}] esclusa dai risultati: stato non rappresentabile", purpose.getId());
			return Optional.empty();
		}

		Purpose response = new Purpose();
		response.setId(purpose.getId());
		response.setThroughput(version != null ? version.getDailyCalls() : null);
		response.setState(state.get());

		return Optional.of(response);
	}

	private Optional<PurposeState> toPurposeState(org.govway.catalogo.servlets.pdnd.v3.model.PurposeVersion version) {
		if(version == null || version.getState() == null) {
			return Optional.empty();
		}

		switch(version.getState()) {
		case ACTIVE: return Optional.of(PurposeState.ACTIVE);
		case DRAFT: return Optional.of(PurposeState.DRAFT);
		case SUSPENDED: return Optional.of(PurposeState.SUSPENDED);
		case WAITING_FOR_APPROVAL: return Optional.of(PurposeState.WAITING_FOR_APPROVAL);
		case ARCHIVED: return Optional.of(PurposeState.ARCHIVED);
		case REJECTED:
		}

		return Optional.empty();
	}

	private Attribute toAttribute(UUID id, String name, AttributeKind kind) {
		Attribute response = new Attribute();
		response.setId(id);
		response.setName(name);
		response.setKind(kind);
		return response;
	}

	private Organization toOrganization(org.govway.catalogo.servlets.pdnd.v3.model.Tenant tenant) {
		Organization response = new Organization();
		response.setId(tenant.getId());
		response.setExternalId(toExternalId(tenant));
		response.setName(tenant.getName());
		response.setCategory(toCategory(tenant));
		return response;
	}

	private ExternalId toExternalId(org.govway.catalogo.servlets.pdnd.v3.model.Tenant tenant) {
		if(tenant.getExternalId() == null) {
			return null;
		}

		ExternalId response = new ExternalId();
		response.setOrigin(tenant.getExternalId().getOrigin());
		response.setId(tenant.getExternalId().getValue());
		return response;
	}

	/**
	 * L'API v3 non espone la categoria IPA dell'organizzazione: viene riportata la
	 * tipologia di tenant (PA, PRIVATE, GSP, SCP).
	 */
	private String toCategory(org.govway.catalogo.servlets.pdnd.v3.model.Tenant tenant) {
		return tenant.getKind() != null ? tenant.getKind().getValue() : null;
	}

	private JWK toJWK(org.govway.catalogo.servlets.pdnd.v3.model.JWK jwk) {
		if(jwk == null) {
			return null;
		}

		JWK response = new JWK();
		response.setKty(jwk.getKty());
		response.setKeyOps(jwk.getKeyOps());
		response.setUse(jwk.getUse());
		response.setAlg(jwk.getAlg());
		response.setKid(jwk.getKid());
		response.setX5u(jwk.getX5u());
		response.setX5t(jwk.getX5t());
		response.setX5tHashS256(jwk.getX5tHashS256());
		response.setX5c(jwk.getX5c());
		response.setCrv(jwk.getCrv());
		response.setX(jwk.getX());
		response.setY(jwk.getY());
		response.setD(jwk.getD());
		response.setK(jwk.getK());
		response.setN(jwk.getN());
		response.setE(jwk.getE());
		response.setP(jwk.getP());
		response.setQ(jwk.getQ());
		response.setDp(jwk.getDp());
		response.setDq(jwk.getDq());
		response.setQi(jwk.getQi());

		if(jwk.getOth() != null) {
			for(org.govway.catalogo.servlets.pdnd.v3.model.OtherPrimeInfo oth: jwk.getOth()) {
				OtherPrimeInfo converted = new OtherPrimeInfo();
				converted.setR(oth.getR());
				converted.setD(oth.getD());
				converted.setT(oth.getT());
				response.addOthItem(converted);
			}
		}

		return response;
	}

	private EService toEService(org.govway.catalogo.servlets.pdnd.v3.model.EService eservice) throws ApiException {
		return toEService(eservice, this.gatewayApiClient.getTenant(eservice.getProducerId()));
	}

	private EService toEService(org.govway.catalogo.servlets.pdnd.v3.model.EService eservice,
			org.govway.catalogo.servlets.pdnd.v3.model.Tenant producer) throws ApiException {

		EService response = new EService();
		response.setId(eservice.getId());
		response.setProducer(toOrganization(producer));
		response.setName(eservice.getName());
		response.setDescription(eservice.getDescription());
		response.setTechnology(toTechnology(eservice.getTechnology()));
		response.setIsSignalHubEnabled(eservice.isIsSignalHubEnabled());
		response.setIsConsumerDelegable(eservice.isIsConsumerDelegable());
		response.setIsClientAccessDelegable(eservice.isIsClientAccessDelegable());

		// nell'API v3 versione, stato, url di invocazione e attributi appartengono al descrittore
		Optional<org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptor> descriptor =
				getDescriptorCorrente(eservice.getId());

		if(descriptor.isPresent()) {
			response.setVersion(descriptor.get().getVersion());
			response.setState(toEServiceDescriptorState(descriptor.get().getState()).orElse(null));
			response.setServerUrls(descriptor.get().getServerUrls());
			response.setAttributes(getAttributi(eservice.getId(), descriptor.get().getId()));
		} else {
			response.setAttributes(new EServiceAttributes());
		}

		return response;
	}

	/**
	 * Individua il descrittore che nell'API v1 caratterizzava l'e-service: il piu' recente tra
	 * quelli rappresentabili nel modello dati esposto, dando precedenza allo stato pubblicato.
	 */
	private Optional<org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptor> getDescriptorCorrente(UUID eserviceId)
			throws ApiException {

		List<org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptor> descriptors = new ArrayList<>();
		for(org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptor descriptor: getEServiceDescriptorsV3(eserviceId)) {
			if(toEServiceDescriptorState(descriptor.getState()).isPresent()) {
				descriptors.add(descriptor);
			}
		}

		return descriptors.stream()
				.sorted(Comparator
						.comparingInt((org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptor d) -> getPrioritaStato(d.getState()))
						.thenComparing(Comparator.comparingLong(
								(org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptor d) -> getVersione(d.getVersion())).reversed()))
				.findFirst();
	}

	private int getPrioritaStato(org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorState state) {
		if(state == null) {
			return Integer.MAX_VALUE;
		}

		switch(state) {
		case PUBLISHED:
		case ARCHIVING: return 0;
		case SUSPENDED:
		case ARCHIVING_SUSPENDED: return 1;
		case DEPRECATED: return 2;
		case ARCHIVED: return 3;
		case DRAFT:
		case WAITING_FOR_APPROVAL:
		}

		return Integer.MAX_VALUE;
	}

	private long getVersione(String version) {
		try {
			return version != null ? Long.parseLong(version) : -1L;
		} catch(NumberFormatException e) {
			return -1L;
		}
	}

	private EServiceTechnology toTechnology(org.govway.catalogo.servlets.pdnd.v3.model.EServiceTechnology technology) {
		if(technology == null) {
			return null;
		}

		switch(technology) {
		case REST: return EServiceTechnology.REST;
		case SOAP: return EServiceTechnology.SOAP;
		}

		return null;
	}

	private Optional<EServiceDescriptorState> toEServiceDescriptorState(
			org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorState state) {

		if(state == null) {
			return Optional.empty();
		}

		switch(state) {
		case PUBLISHED:
		case ARCHIVING: return Optional.of(EServiceDescriptorState.PUBLISHED);
		case DEPRECATED: return Optional.of(EServiceDescriptorState.DEPRECATED);
		case SUSPENDED:
		case ARCHIVING_SUSPENDED: return Optional.of(EServiceDescriptorState.SUSPENDED);
		case ARCHIVED: return Optional.of(EServiceDescriptorState.ARCHIVED);
		case DRAFT:
		case WAITING_FOR_APPROVAL:
		}

		return Optional.empty();
	}

	private EServiceDescriptor toEServiceDescriptor(UUID eserviceId,
			org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptor descriptor) throws ApiException {

		EServiceDescriptor response = new EServiceDescriptor();
		response.setId(descriptor.getId());
		response.setVersion(descriptor.getVersion());
		response.setDescription(descriptor.getDescription());
		response.setAudience(descriptor.getAudience());
		response.setVoucherLifespan(descriptor.getVoucherLifespan());
		response.setDailyCallsPerConsumer(descriptor.getDailyCallsPerConsumer());
		response.setDailyCallsTotal(descriptor.getDailyCallsTotal());
		response.setState(toEServiceDescriptorState(descriptor.getState()).orElse(null));
		response.setServerUrls(descriptor.getServerUrls());
		response.setDocs(getDocumenti(eserviceId, descriptor.getId()));

		return response;
	}

	private List<EServiceDoc> getDocumenti(UUID eserviceId, UUID descriptorId) throws ApiException {
		List<EServiceDoc> docs = new ArrayList<>();

		for(org.govway.catalogo.servlets.pdnd.v3.model.Document document:
				fetchAll(offset -> this.gatewayApiClient.getEServiceDescriptorDocuments(eserviceId, descriptorId,
						offset, PAGE_SIZE).getResults())) {

			EServiceDoc doc = new EServiceDoc();
			doc.setId(document.getId());
			doc.setName(document.getName());
			doc.setContentType(document.getContentType());
			docs.add(doc);
		}

		return docs;
	}

	private EServiceAttributes getAttributi(UUID eserviceId, UUID descriptorId) throws ApiException {
		EServiceAttributes attributes = new EServiceAttributes();

		Map<Integer, List<EServiceAttributeValue>> certified = new LinkedHashMap<>();
		for(org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorCertifiedAttribute attribute:
				fetchAll(offset -> this.gatewayApiClient.getEServiceDescriptorCertifiedAttributes(eserviceId,
						descriptorId, offset, PAGE_SIZE).getResults())) {

			EServiceAttributeValue value = new EServiceAttributeValue();
			if(attribute.getAttribute() != null) {
				value.setId(attribute.getAttribute().getId());
				value.setCode(attribute.getAttribute().getCode());
				value.setOrigin(attribute.getAttribute().getOrigin());
			}
			certified.computeIfAbsent(attribute.getGroupIndex(), k -> new ArrayList<>()).add(value);
		}
		attributes.setCertified(toEServiceAttributes(certified));

		Map<Integer, List<EServiceAttributeValue>> declared = new LinkedHashMap<>();
		for(org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorDeclaredAttribute attribute:
				fetchAll(offset -> this.gatewayApiClient.getEServiceDescriptorDeclaredAttributes(eserviceId,
						descriptorId, offset, PAGE_SIZE).getResults())) {

			EServiceAttributeValue value = new EServiceAttributeValue();
			if(attribute.getAttribute() != null) {
				value.setId(attribute.getAttribute().getId());
			}
			declared.computeIfAbsent(attribute.getGroupIndex(), k -> new ArrayList<>()).add(value);
		}
		attributes.setDeclared(toEServiceAttributes(declared));

		Map<Integer, List<EServiceAttributeValue>> verified = new LinkedHashMap<>();
		for(org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorVerifiedAttribute attribute:
				fetchAll(offset -> this.gatewayApiClient.getEServiceDescriptorVerifiedAttributes(eserviceId,
						descriptorId, offset, PAGE_SIZE).getResults())) {

			EServiceAttributeValue value = new EServiceAttributeValue();
			if(attribute.getAttribute() != null) {
				value.setId(attribute.getAttribute().getId());
			}
			verified.computeIfAbsent(attribute.getGroupIndex(), k -> new ArrayList<>()).add(value);
		}
		attributes.setVerified(toEServiceAttributes(verified));

		return attributes;
	}

	/**
	 * Riporta i gruppi di attributi dell'API v3 (identificati da groupIndex) nella
	 * rappresentazione dell'API v1: gruppi di un solo elemento come attributo singolo,
	 * gruppi di piu' elementi come alternativa in OR.
	 */
	private List<EServiceAttribute> toEServiceAttributes(Map<Integer, List<EServiceAttributeValue>> gruppi) {
		List<EServiceAttribute> attributes = new ArrayList<>();

		for(List<EServiceAttributeValue> gruppo: gruppi.values()) {
			EServiceAttribute attribute = new EServiceAttribute();
			if(gruppo.size() == 1) {
				attribute.setSingle(gruppo.get(0));
			} else {
				attribute.setGroup(gruppo);
			}
			attributes.add(attribute);
		}

		return attributes;
	}

	/**
	 * L'API v3 espone codice e origine dei soli attributi certificati: il filtro per
	 * attributo si applica quindi a questi ultimi.
	 */
	private boolean hasAttribute(EService eservice, String attributeOrigin, String attributeCode) {
		if(attributeOrigin == null && attributeCode == null) {
			return true;
		}

		if(eservice.getAttributes() == null || eservice.getAttributes().getCertified() == null) {
			return false;
		}

		for(EServiceAttribute attribute: eservice.getAttributes().getCertified()) {
			if(matchAttribute(attribute.getSingle(), attributeOrigin, attributeCode)) {
				return true;
			}

			if(attribute.getGroup() != null) {
				for(EServiceAttributeValue value: attribute.getGroup()) {
					if(matchAttribute(value, attributeOrigin, attributeCode)) {
						return true;
					}
				}
			}
		}

		return false;
	}

	private boolean matchAttribute(EServiceAttributeValue value, String attributeOrigin, String attributeCode) {
		if(value == null) {
			return false;
		}

		boolean originOk = attributeOrigin == null || attributeOrigin.equals(value.getOrigin());
		boolean codeOk = attributeCode == null || attributeCode.equals(value.getCode());

		return originOk && codeOk;
	}


	// ==================== utility ====================

	private <T> List<T> toList(T value) {
		return value != null ? List.of(value) : null;
	}

	private NotImplementedException notImplemented(String operazione) {
		this.logger.error("Operazione [{}] non supportata dall'API PDND v3", operazione);
		return new NotImplementedException(ErrorCode.SYS_501, Map.of("operazione", operazione));
	}

	private void rethrowIfNotNotFound(ApiException e) throws ApiException {
		if(e.getCode() != 404) {
			throw e;
		}
	}

	/**
	 * Riporta l'errore del client v3 sull'eccezione utilizzata dal resto dell'applicazione,
	 * che incapsula l'ApiException del client v1.
	 */
	private ClientApiException toClientApiException(ApiException e) {
		return new ClientApiException(new org.govway.catalogo.servlets.pdnd.client.api.impl.ApiException(
				e.getMessage(), e, e.getCode(), e.getResponseHeaders(), e.getResponseBody()));
	}
}

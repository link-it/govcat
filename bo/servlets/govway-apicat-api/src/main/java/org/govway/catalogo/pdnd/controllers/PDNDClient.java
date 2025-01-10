/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
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

import java.util.List;
import java.util.UUID;

import org.govway.catalogo.exception.ClientApiException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.servlets.pdnd.client.api.impl.ApiException;
import org.govway.catalogo.servlets.pdnd.model.Agreement;
import org.govway.catalogo.servlets.pdnd.model.AgreementState;
import org.govway.catalogo.servlets.pdnd.model.Agreements;
import org.govway.catalogo.servlets.pdnd.model.Attribute;
import org.govway.catalogo.servlets.pdnd.model.AttributeSeed;
import org.govway.catalogo.servlets.pdnd.model.Attributes;
import org.govway.catalogo.servlets.pdnd.model.Client;
import org.govway.catalogo.servlets.pdnd.model.EService;
import org.govway.catalogo.servlets.pdnd.model.EServiceDescriptor;
import org.govway.catalogo.servlets.pdnd.model.EServiceDescriptors;
import org.govway.catalogo.servlets.pdnd.model.EServices;
import org.govway.catalogo.servlets.pdnd.model.Events;
import org.govway.catalogo.servlets.pdnd.model.JWK;
import org.govway.catalogo.servlets.pdnd.model.Organization;
import org.govway.catalogo.servlets.pdnd.model.Problem;
import org.govway.catalogo.servlets.pdnd.model.Purpose;
import org.govway.catalogo.servlets.pdnd.model.Purposes;
import org.govway.catalogo.servlets.pdnd.model.Subscriber;
import org.govway.catalogo.servlets.pdnd.model.Subscribers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;

public class PDNDClient {


	private Logger logger = LoggerFactory.getLogger(PDNDClient.class);

	private org.govway.catalogo.servlets.pdnd.client.api.GatewayApi gatewayApiClient;
	private org.govway.catalogo.servlets.pdnd.client.api.HealthApi healthApiClient;

	public PDNDClient(org.govway.catalogo.servlets.pdnd.client.api.GatewayApi gatewayApiClient,
			org.govway.catalogo.servlets.pdnd.client.api.HealthApi healthApiClient) {
		this.gatewayApiClient=gatewayApiClient;
		this.healthApiClient = healthApiClient;
	}
	
	public ResponseEntity<Problem> getStatus() {
		try {
			Problem response = this.healthApiClient.getStatus();
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}
	
	public ResponseEntity<Subscribers> getSubscribers(UUID producerId,
			UUID eserviceId) {
		try {
			
			Agreements agreements = this.gatewayApiClient.getAgreements(producerId, null, eserviceId, null, null);
			
			Subscribers response = new Subscribers();
			for(Agreement agreement: agreements.getAgreements()) {
				Subscriber subscriber = new Subscriber();
				subscriber.setState(agreement.getState());
				subscriber.setConsumerId(agreement.getConsumerId());
				
				Organization organization = this.gatewayApiClient.getOrganization(agreement.getConsumerId());
				
				subscriber.setCategory(organization.getCategory());
				subscriber.setExternalId(organization.getExternalId());
				subscriber.setName(organization.getName());
				
				response.addSubscribersItem(subscriber);
			}
			
			
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(e);
		}

	}

	public ResponseEntity<Attribute> createCertifiedAttribute(AttributeSeed attributeSeed) {
		try {
			Attribute response = this.gatewayApiClient.createCertifiedAttribute(attributeSeed);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<Agreement> getAgreement(UUID agreementId) {
		try {
			Agreement agreement = this.gatewayApiClient.getAgreement(agreementId);
			return ResponseEntity.ok(agreement);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<Attributes> getAgreementAttributes(UUID agreementId) {
		try {
			Attributes response = this.gatewayApiClient.getAgreementAttributes(agreementId);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}

	}

	public ResponseEntity<Agreement> getAgreementByPurpose(UUID purposeId) {
		try {
			Agreement response = this.gatewayApiClient.getAgreementByPurpose(purposeId);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<Purposes> getAgreementPurposes(UUID agreementId) {
		try {
			Purposes response = this.gatewayApiClient.getAgreementPurposes(agreementId);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<Agreements> getAgreements(UUID producerId, UUID consumerId,
			UUID eserviceId, UUID descriptorId, List<AgreementState> states) {
		try {
			Agreements response = this.gatewayApiClient.getAgreements(producerId, consumerId, eserviceId, descriptorId, states);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<Attribute> getAttribute(UUID attributeId) {
		try {
			Attribute response = this.gatewayApiClient.getAttribute(attributeId);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<Client> getClient(UUID clientId) {
		try {
			Client response = this.gatewayApiClient.getClient(clientId);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<EService> getEService(UUID eserviceId) {
		try {
			EService response = this.gatewayApiClient.getEService(eserviceId);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<EServiceDescriptor> getEServiceDescriptor(UUID eserviceId, UUID descriptorId) {
		try {
			EServiceDescriptor response = this.gatewayApiClient.getEServiceDescriptor(eserviceId, descriptorId);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<EServiceDescriptors> getEServiceDescriptors(UUID eserviceId) {
		try {
			EServiceDescriptors response = this.gatewayApiClient.getEServiceDescriptors(eserviceId);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<Events> getEservicesEventsFromId(Long lastEventId,
			Integer limit) {
		try {
			Events response = this.gatewayApiClient.getEservicesEventsFromId(lastEventId, limit);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<Events> getEventsFromId(Long lastEventId,
			Integer limit) {
		try {
			Events response = this.gatewayApiClient.getEventsFromId(lastEventId, limit);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<JWK> getJWKPublicKey(String kid) {
		try {
			JWK response = this.gatewayApiClient.getJWKPublicKey(kid);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<Events> getKeysEventsFromId(Long lastEventId,
			Integer limit) {
		try {
			Events response = this.gatewayApiClient.getKeysEventsFromId(lastEventId, limit);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<Organization> getOrganization(UUID organizationId) {
		try {
			Organization response = this.gatewayApiClient.getOrganization(organizationId);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<EServices> getOrganizationEServices(String origin, String externalId,
			String attributeOrigin, String attributeCode) {
		try {
			EServices response = this.gatewayApiClient.getOrganizationEServices(origin, externalId, attributeOrigin, attributeCode);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<Purpose> getPurpose(UUID purposeId) {
		try {
			Purpose response = this.gatewayApiClient.getPurpose(purposeId);
			return ResponseEntity.ok(response);
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<Void> revokeTenantAttribute(String origin, String externalId, String code) {
		try {
			this.gatewayApiClient.revokeTenantAttribute(origin, externalId, code);
			return ResponseEntity.ok().build();
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}

	public ResponseEntity<Void> upsertTenant(String origin, String externalId, String code) {
		try {
			this.gatewayApiClient.upsertTenant(origin, externalId, code);
			return ResponseEntity.ok().build();
		} catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		} catch(ApiException e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new ClientApiException(e);
		}
	}
}

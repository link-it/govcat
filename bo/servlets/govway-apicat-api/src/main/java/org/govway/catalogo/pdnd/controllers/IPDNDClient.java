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

import java.util.List;
import java.util.UUID;

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
import org.govway.catalogo.servlets.pdnd.model.Subscribers;
import org.springframework.http.ResponseEntity;

/**
 * Operazioni verso la PDND utilizzate da GovCat, espresse nel modello dati
 * dell'API PDND esposta da GovCat.
 *
 * Le implementazioni si differenziano per la versione dell'API PDND invocata:
 * {@link PDNDClient} (API Interoperability API Gateway v1) e
 * {@link PDNDClientV3} (API PDND core v3). La scelta dell'implementazione e'
 * a carico di {@link PDNDClientFactory}.
 */
public interface IPDNDClient {

	ResponseEntity<Problem> getStatus();

	ResponseEntity<Subscribers> getSubscribers(UUID producerId, UUID eserviceId);

	ResponseEntity<Attribute> createCertifiedAttribute(AttributeSeed attributeSeed);

	ResponseEntity<Agreement> getAgreement(UUID agreementId);

	/**
	 * Operazione di scrittura: approva l'accordo di fruizione in stato PENDING.
	 */
	ResponseEntity<Agreement> approveAgreement(UUID agreementId);

	/**
	 * Operazione di scrittura: approva la finalita' in stato WAITING_FOR_APPROVAL.
	 */
	ResponseEntity<Purpose> approvePurpose(UUID purposeId);

	ResponseEntity<Attributes> getAgreementAttributes(UUID agreementId);

	ResponseEntity<Agreement> getAgreementByPurpose(UUID purposeId);

	ResponseEntity<Purposes> getAgreementPurposes(UUID agreementId);

	ResponseEntity<Agreements> getAgreements(UUID producerId, UUID consumerId, UUID eserviceId, UUID descriptorId,
			List<AgreementState> states);

	ResponseEntity<Attribute> getAttribute(UUID attributeId);

	ResponseEntity<Client> getClient(UUID clientId);

	ResponseEntity<EService> getEService(UUID eserviceId);

	ResponseEntity<EServiceDescriptor> getEServiceDescriptor(UUID eserviceId, UUID descriptorId);

	ResponseEntity<EServiceDescriptors> getEServiceDescriptors(UUID eserviceId);

	ResponseEntity<Events> getEservicesEventsFromId(Long lastEventId, Integer limit);

	ResponseEntity<Events> getEventsFromId(Long lastEventId, Integer limit);

	ResponseEntity<JWK> getJWKPublicKey(String kid);

	ResponseEntity<Events> getKeysEventsFromId(Long lastEventId, Integer limit);

	ResponseEntity<Organization> getOrganization(UUID organizationId);

	ResponseEntity<EServices> getOrganizationEServices(String origin, String externalId, String attributeOrigin,
			String attributeCode);

	ResponseEntity<Purpose> getPurpose(UUID purposeId);

	ResponseEntity<Void> revokeTenantAttribute(String origin, String externalId, String code);

	ResponseEntity<Void> upsertTenant(String origin, String externalId, String code);
}

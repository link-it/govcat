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

import org.govway.catalogo.PdndMockControllerCollaudo;
import org.govway.catalogo.servlets.pdnd.mockserver.api.GatewayApi;
import org.govway.catalogo.servlets.pdnd.mockserver.api.HealthApi;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Agreement;
import org.govway.catalogo.servlets.pdnd.mockserver.model.AgreementState;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Agreements;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Attribute;
import org.govway.catalogo.servlets.pdnd.mockserver.model.AttributeSeed;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Attributes;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Client;
import org.govway.catalogo.servlets.pdnd.mockserver.model.EService;
import org.govway.catalogo.servlets.pdnd.mockserver.model.EServiceDescriptor;
import org.govway.catalogo.servlets.pdnd.mockserver.model.EServiceDescriptors;
import org.govway.catalogo.servlets.pdnd.mockserver.model.EServices;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Events;
import org.govway.catalogo.servlets.pdnd.mockserver.model.JWK;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Organization;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Problem;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Purpose;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Purposes;
import org.springframework.http.ResponseEntity;

@PdndMockControllerCollaudo
public class PDNDControllerMockCollaudo implements GatewayApi, HealthApi {


	private PDNDMockServer server;

	public PDNDControllerMockCollaudo() {
		this.server = new PDNDMockServer("collaudo");
	}
	
	@Override
	public ResponseEntity<Attribute> createCertifiedAttribute(AttributeSeed attributeSeed) {
		return this.server.createCertifiedAttribute(attributeSeed);
	}

	@Override
	public ResponseEntity<Agreement> getAgreement(UUID agreementId) {
		return this.server.getAgreement(agreementId);
	}

	@Override
	public ResponseEntity<Attributes> getAgreementAttributes(UUID agreementId) {
		return this.server.getAgreementAttributes(agreementId);
	}

	@Override
	public ResponseEntity<Agreement> getAgreementByPurpose(UUID purposeId) {
		return this.server.getAgreementByPurpose(purposeId);
	}

	@Override
	public ResponseEntity<Purposes> getAgreementPurposes(UUID agreementId) {
		return this.server.getAgreementPurposes(agreementId);
	}

	@Override
	public ResponseEntity<Agreements> getAgreements(UUID producerId, UUID consumerId,
			UUID eserviceId, UUID descriptorId, List<AgreementState> states) {
		return this.server.getAgreements(producerId, consumerId, eserviceId, descriptorId, states);
	}
	@Override
	public ResponseEntity<Attribute> getAttribute(UUID attributeId) {
		return this.server.getAttribute(attributeId);
	}

	@Override
	public ResponseEntity<Client> getClient(UUID clientId) {
		return this.server.getClient(clientId);
	}

	@Override
	public ResponseEntity<EService> getEService(UUID eserviceId) {
		return this.server.getEService(eserviceId);
	}

	@Override
	public ResponseEntity<EServiceDescriptor> getEServiceDescriptor(UUID eserviceId, UUID descriptorId) {
		return this.server.getEServiceDescriptor(eserviceId, descriptorId);
	}

	@Override
	public ResponseEntity<EServiceDescriptors> getEServiceDescriptors(UUID eserviceId) {
		return this.server.getEServiceDescriptors(eserviceId);
	}

	@Override
	public ResponseEntity<Events> getEservicesEventsFromId(Long lastEventId,
			Integer limit) {
		return this.server.getEservicesEventsFromId(lastEventId, limit);
	}

	@Override
	public ResponseEntity<Events> getEventsFromId(Long lastEventId,
			Integer limit) {
		return this.server.getEventsFromId(lastEventId, limit);
	}

	@Override
	public ResponseEntity<JWK> getJWKPublicKey(String kid) {
		return this.server.getJWKPublicKey(kid);
	}

	@Override
	public ResponseEntity<Events> getKeysEventsFromId(Long lastEventId,
			Integer limit) {
		return this.server.getKeysEventsFromId(lastEventId, limit);
	}

	@Override
	public ResponseEntity<Organization> getOrganization(UUID organizationId) {
		return this.server.getOrganization(organizationId);
	}

	@Override
	public ResponseEntity<EServices> getOrganizationEServices(String origin, String externalId,
			String attributeOrigin, String attributeCode) {
		return this.server.getOrganizationEServices(origin, externalId, attributeOrigin, attributeCode);
	}

	@Override
	public ResponseEntity<Purpose> getPurpose(UUID purposeId) {
		return this.server.getPurpose(purposeId);
	}

	@Override
	public ResponseEntity<Void> revokeTenantAttribute(String origin, String externalId, String code) {
		return this.server.revokeTenantAttribute(origin, externalId, code);
	}

	@Override
	public ResponseEntity<Void> upsertTenant(String origin, String externalId, String code) {
		return this.server.upsertTenant(origin, externalId, code);
	}

	@Override
	public ResponseEntity<Problem> getStatus() {
		return ResponseEntity.ok().build(); 
	}


}

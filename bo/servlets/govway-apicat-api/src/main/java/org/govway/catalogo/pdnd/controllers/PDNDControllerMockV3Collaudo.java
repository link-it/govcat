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

import org.govway.catalogo.PdndMockV3ControllerCollaudo;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.api.GatewayApi;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Agreement;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.AgreementState;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Agreements;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.CertifiedAttribute;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.CertifiedAttributeSeed;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Client;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.DeclaredAttribute;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Documents;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.EService;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.EServiceDescriptor;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.EServiceDescriptorCertifiedAttributes;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.EServiceDescriptorDeclaredAttributes;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.EServiceDescriptorState;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.EServiceDescriptorVerifiedAttributes;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.EServiceDescriptors;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.EServiceMode;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.EServiceTechnology;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.EServices;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Key;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Problem;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Purpose;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Purposes;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Tenant;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Tenants;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.VerifiedAttribute;
import org.springframework.http.ResponseEntity;

@PdndMockV3ControllerCollaudo
public class PDNDControllerMockV3Collaudo implements GatewayApi {

	private PDNDMockServerV3 server;

	public PDNDControllerMockV3Collaudo() {
		this.server = new PDNDMockServerV3("collaudo");
	}

	@Override
	public ResponseEntity<Problem> getStatus() {
		return this.server.getStatus();
	}

	@Override
	public ResponseEntity<CertifiedAttribute> createCertifiedAttribute(CertifiedAttributeSeed certifiedAttributeSeed) {
		return this.server.createCertifiedAttribute(certifiedAttributeSeed);
	}

	@Override
	public ResponseEntity<Agreement> getAgreement(UUID agreementId) {
		return this.server.getAgreement(agreementId);
	}

	@Override
	public ResponseEntity<Agreements> getAgreements(Integer offset, Integer limit, List<AgreementState> states,
			List<UUID> producerIds, List<UUID> consumerIds, List<UUID> descriptorIds, List<UUID> eserviceIds) {
		return this.server.getAgreements(offset, limit, states, producerIds, consumerIds, descriptorIds, eserviceIds);
	}

	@Override
	public ResponseEntity<Purposes> getAgreementPurposes(UUID agreementId, Integer limit, Integer offset) {
		return this.server.getAgreementPurposes(agreementId, limit, offset);
	}

	@Override
	public ResponseEntity<Purpose> getPurpose(UUID purposeId) {
		return this.server.getPurpose(purposeId);
	}

	@Override
	public ResponseEntity<Agreement> getPurposeAgreement(UUID purposeId) {
		return this.server.getPurposeAgreement(purposeId);
	}

	@Override
	public ResponseEntity<CertifiedAttribute> getCertifiedAttribute(UUID attributeId) {
		return this.server.getCertifiedAttribute(attributeId);
	}

	@Override
	public ResponseEntity<DeclaredAttribute> getDeclaredAttribute(UUID attributeId) {
		return this.server.getDeclaredAttribute(attributeId);
	}

	@Override
	public ResponseEntity<VerifiedAttribute> getVerifiedAttribute(UUID attributeId) {
		return this.server.getVerifiedAttribute(attributeId);
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
	public ResponseEntity<EServices> getEServices(Integer offset, Integer limit, List<UUID> producerIds,
			List<UUID> templateIds, String name, EServiceTechnology technology, EServiceMode mode,
			Boolean isSignalHubEnabled, Boolean isConsumerDelegable, Boolean isClientAccessDelegable) {
		return this.server.getEServices(offset, limit, producerIds, templateIds, name, technology, mode,
				isSignalHubEnabled, isConsumerDelegable, isClientAccessDelegable);
	}

	@Override
	public ResponseEntity<EServiceDescriptor> getEServiceDescriptor(UUID eserviceId, UUID descriptorId) {
		return this.server.getEServiceDescriptor(eserviceId, descriptorId);
	}

	@Override
	public ResponseEntity<EServiceDescriptors> getEServiceDescriptors(UUID eserviceId, Integer offset, Integer limit,
			EServiceDescriptorState state) {
		return this.server.getEServiceDescriptors(eserviceId, offset, limit, state);
	}

	@Override
	public ResponseEntity<Documents> getEServiceDescriptorDocuments(UUID eserviceId, UUID descriptorId, Integer offset,
			Integer limit) {
		return this.server.getEServiceDescriptorDocuments(eserviceId, descriptorId, offset, limit);
	}

	@Override
	public ResponseEntity<EServiceDescriptorCertifiedAttributes> getEServiceDescriptorCertifiedAttributes(
			UUID eserviceId, UUID descriptorId, Integer offset, Integer limit) {
		return this.server.getEServiceDescriptorCertifiedAttributes(eserviceId, descriptorId, offset, limit);
	}

	@Override
	public ResponseEntity<EServiceDescriptorDeclaredAttributes> getEServiceDescriptorDeclaredAttributes(UUID eserviceId,
			UUID descriptorId, Integer offset, Integer limit) {
		return this.server.getEServiceDescriptorDeclaredAttributes(eserviceId, descriptorId, offset, limit);
	}

	@Override
	public ResponseEntity<EServiceDescriptorVerifiedAttributes> getEServiceDescriptorVerifiedAttributes(UUID eserviceId,
			UUID descriptorId, Integer offset, Integer limit) {
		return this.server.getEServiceDescriptorVerifiedAttributes(eserviceId, descriptorId, offset, limit);
	}

	@Override
	public ResponseEntity<Key> getJWKByKid(String kid) {
		return this.server.getJWKByKid(kid);
	}

	@Override
	public ResponseEntity<Tenant> getTenant(UUID tenantId) {
		return this.server.getTenant(tenantId);
	}

	@Override
	public ResponseEntity<Tenants> getTenants(Integer offset, Integer limit, String ipACode, String taxCode) {
		return this.server.getTenants(offset, limit, ipACode, taxCode);
	}
}

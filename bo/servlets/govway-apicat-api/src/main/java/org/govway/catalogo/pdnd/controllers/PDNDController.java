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
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.govway.catalogo.PdndV1Controller;
import org.govway.catalogo.servlets.pdnd.client.api.GatewayApi;
import org.govway.catalogo.servlets.pdnd.client.api.HealthApi;
import org.govway.catalogo.servlets.pdnd.client.api.impl.ApiClient;
import org.govway.catalogo.servlets.pdnd.model.Agreement;
import org.govway.catalogo.servlets.pdnd.model.AgreementState;
import org.govway.catalogo.servlets.pdnd.model.Agreements;
import org.govway.catalogo.servlets.pdnd.model.AmbienteEnum;
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
import org.govway.catalogo.servlets.pdnd.model.ProblemError;
import org.govway.catalogo.servlets.pdnd.model.Purpose;
import org.govway.catalogo.servlets.pdnd.model.Purposes;
import org.govway.catalogo.servlets.pdnd.model.Subscribers;
import org.govway.catalogo.servlets.pdnd.server.api.CatalogApi;
import org.govway.catalogo.servlets.pdnd.server.api.ConfigurazioneApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ResponseBody;

@PdndV1Controller
public class PDNDController implements CatalogApi, ConfigurazioneApi, org.govway.catalogo.servlets.pdnd.server.api.GatewayApi, org.govway.catalogo.servlets.pdnd.server.api.HealthApi {


	@Autowired
	@Qualifier("PDNDClientCollaudo")
	private ApiClient apiClientCollaudo;

	@Autowired
	@Qualifier("PDNDClientProduzione")
	private ApiClient apiClientProduzione;


	private PDNDClient clientCollaudo;
	private PDNDClient clientProduzione;
	
	private static String collaudo = "collaudo";

	private PDNDClient getClientCollaudo() {
		if(this.clientCollaudo == null) {
			this.clientCollaudo = new PDNDClient(new GatewayApi(this.apiClientCollaudo), new HealthApi(this.apiClientCollaudo));
		}

		return this.clientCollaudo;
	}

	private PDNDClient getClientProduzione() {
		if(this.clientProduzione == null) {
			this.clientProduzione = new PDNDClient(new GatewayApi(this.apiClientProduzione), new HealthApi(this.apiClientProduzione));
		}

		return this.clientProduzione;
	}

	@Override
	public ResponseEntity<String> getStatus() {
		StringBuilder sb = new StringBuilder();

		String collStatusString= getProblem(this.getClientCollaudo().getStatus());
		if(collStatusString!=null) {
			sb.append(collStatusString);
		}
		String prodStatusString= getProblem(this.getClientProduzione().getStatus());
		if(prodStatusString!=null) {
			sb.append(prodStatusString);
		}

		if(sb.length()> 0) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(sb.toString());
		} else {
			return ResponseEntity.ok().build();
		}
	}

	private String getProblem(ResponseEntity<Problem> status) {
		
		if (status != null) {
		    Problem body = status.getBody();

		    if (body != null) {
		        List<ProblemError> errors = body.getErrors();

		        if (errors != null && !errors.isEmpty()) {
		            return errors.stream()
		                         .map(e -> e.getCode() + " " + e.getDetail())
		                         .collect(Collectors.joining(","));
		        }
		    }
		}

		return null;
	}

	@Override
	public ResponseEntity<Subscribers> getSubscribers(AmbienteEnum ambiente, UUID producerId,
			UUID eserviceId) {
		if (ambiente.getValue().equals(collaudo))
			return this.getClientCollaudo().getSubscribers(producerId, eserviceId);
		else
			return this.getClientProduzione().getSubscribers(producerId, eserviceId);

	}

	@Override
	public ResponseEntity<Problem> getStatus(AmbienteEnum ambiente) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getStatus();
		else 
			return this.getClientProduzione().getStatus();
	}

	@Override
	public ResponseEntity<Attribute> createCertifiedAttribute(AmbienteEnum ambiente,
			AttributeSeed attributeSeed) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().createCertifiedAttribute(attributeSeed);
		else 
			return this.getClientProduzione().createCertifiedAttribute(attributeSeed);
	}

	@Override
	public ResponseEntity<Agreement> getAgreement(AmbienteEnum ambiente, UUID agreementId) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getAgreement(agreementId);
		else 
			return this.getClientProduzione().getAgreement(agreementId);
	}

	@Override
	public ResponseEntity<Attributes> getAgreementAttributes(AmbienteEnum ambiente, UUID agreementId) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getAgreementAttributes(agreementId);
		else 
			return this.getClientProduzione().getAgreementAttributes(agreementId);
	}

	@Override
	public ResponseEntity<Agreement> getAgreementByPurpose(AmbienteEnum ambiente, UUID purposeId) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getAgreementByPurpose(purposeId);
		else
			return this.getClientProduzione().getAgreementByPurpose(purposeId);
	}

	@Override
	public ResponseEntity<Purposes> getAgreementPurposes(AmbienteEnum ambiente, UUID agreementId) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getAgreementPurposes(agreementId);
		else 
			return this.getClientProduzione().getAgreementPurposes(agreementId);
	}

	@Override
	public ResponseEntity<Agreements> getAgreements(AmbienteEnum ambiente, UUID producerId,
			UUID consumerId, UUID eserviceId, UUID descriptorId,
			List<AgreementState> states) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getAgreements(producerId, consumerId, eserviceId, descriptorId, states);
		else 
			return this.getClientProduzione().getAgreements(producerId, consumerId, eserviceId, descriptorId, states);
	}

	@Override
	public ResponseEntity<Attribute> getAttribute(AmbienteEnum ambiente, UUID attributeId) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getAttribute(attributeId);
		else
			return this.getClientProduzione().getAttribute(attributeId);
	}

	@Override
	public ResponseEntity<Client> getClient(AmbienteEnum ambiente, UUID clientId) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getClient(clientId);
		else
			return this.getClientProduzione().getClient(clientId);
	}

	@Override
	public ResponseEntity<EService> getEService(AmbienteEnum ambiente, UUID eserviceId) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getEService(eserviceId);
		else
			return this.getClientProduzione().getEService(eserviceId);		
	}

	@Override
	public ResponseEntity<EServiceDescriptor> getEServiceDescriptor(AmbienteEnum ambiente, UUID eserviceId,
			UUID descriptorId) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getEServiceDescriptor(eserviceId, descriptorId);
		else
			return this.getClientProduzione().getEServiceDescriptor(eserviceId, descriptorId);
	}

	@Override
	public ResponseEntity<EServiceDescriptors> getEServiceDescriptors(AmbienteEnum ambiente, UUID eserviceId) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getEServiceDescriptors(eserviceId);
		else
			return this.getClientProduzione().getEServiceDescriptors(eserviceId);
	}

	@Override
	public ResponseEntity<Events> getEservicesEventsFromId(AmbienteEnum ambiente, Long lastEventId,
			Integer limit) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getEservicesEventsFromId(lastEventId, limit);
		else
			return this.getClientProduzione().getEservicesEventsFromId(lastEventId, limit);
	}

	@Override
	public ResponseEntity<Events> getEventsFromId(AmbienteEnum ambiente, Long lastEventId,
			Integer limit) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getEventsFromId(lastEventId, limit);
		else
			return this.getClientProduzione().getEventsFromId(lastEventId, limit);
	}

	@Override
	public ResponseEntity<JWK> getJWKPublicKey(AmbienteEnum ambiente, String kid) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getJWKPublicKey(kid);
		else
			return this.getClientProduzione().getJWKPublicKey(kid);
	}

	@Override
	public ResponseEntity<Events> getKeysEventsFromId(AmbienteEnum ambiente, Long lastEventId,
			Integer limit) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getKeysEventsFromId(lastEventId, limit);
		else
			return this.getClientProduzione().getKeysEventsFromId(lastEventId, limit);
	}

	@Override
	public ResponseEntity<Organization> getOrganization(AmbienteEnum ambiente, UUID organizationId) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getOrganization(organizationId);
		else
			return this.getClientProduzione().getOrganization(organizationId);
	}

	@Override
	public ResponseEntity<EServices> getOrganizationEServices(AmbienteEnum ambiente, String origin, String externalId,
			String attributeOrigin, String attributeCode) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getOrganizationEServices(origin, externalId, attributeOrigin, attributeCode);
		else
			return this.getClientProduzione().getOrganizationEServices(origin, externalId, attributeOrigin, attributeCode);
	}

	@Override
	public ResponseEntity<Purpose> getPurpose(AmbienteEnum ambiente, UUID purposeId) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().getPurpose(purposeId);
		else
			return this.getClientProduzione().getPurpose(purposeId);
	}

	@Override
	public ResponseEntity<Void> revokeTenantAttribute(AmbienteEnum ambiente, String origin, String externalId,
			String code) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().revokeTenantAttribute(origin, externalId, code);
		else
			return this.getClientProduzione().revokeTenantAttribute(origin, externalId, code);

	}

	@Override
	public ResponseEntity<Void> upsertTenant(AmbienteEnum ambiente, String origin, String externalId, String code) {
		if (ambiente.getValue().equals(collaudo))

			return this.getClientCollaudo().upsertTenant(origin, externalId, code);
		else
			return this.getClientProduzione().upsertTenant(origin, externalId, code);

	}
}
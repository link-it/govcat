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

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.commons.io.IOUtils;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotFoundException;
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
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.ExternalId;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Key;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Problem;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Purpose;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Purposes;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Tenant;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Tenants;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.VerifiedAttribute;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * Simulazione delle operazioni PDND v3 utilizzate da GovCat, analoga a {@link PDNDMockServer}
 * per l'API v1: le risposte sono lette dai file json presenti in {@code /pdnd/mock/v3/<ambiente>}.
 *
 * Come nel mock v1, gli identificativi che iniziano per {@code eeeee400}, {@code eeeee404} e
 * {@code eeeee500} consentono di simulare rispettivamente un errore 400, 404 e 500.
 */
public class PDNDMockServerV3 {

	private Logger logger = LoggerFactory.getLogger(PDNDMockServerV3.class);

	private String prefix = "/pdnd/mock/v3";
	private String environment;

	private Map<String, Object> files = new HashMap<>();

	public PDNDMockServerV3(String environment) {
		this.environment = environment;
	}

	private String getPrefix() {
		return prefix + "/" + environment + "/";
	}

	private <T> T readMockResponse(Class<T> valueType) {
		try {
			String key = valueType.getSimpleName() + ".json";

			this.logger.debug("Cerco key: " + key);
			if(!files.containsKey(key)) {
				this.logger.debug("Key non trovata: " + key);
				InputStream is = null;
				try {
					is = PDNDMockServerV3.class.getResourceAsStream(getPrefix() + key);
					if(is != null) {
						// il modello v3 utilizza OffsetDateTime: senza il modulo dedicato le date
						// presenti nelle risposte simulate non sarebbero leggibili
						ObjectMapper om = new ObjectMapper().registerModule(new JavaTimeModule());
						byte[] value = IOUtils.toByteArray(is);

						Object obj = om.readValue(value, valueType);
						files.put(key, obj);
						this.logger.debug("Key aggiunta: " + key);
					} else {
						this.logger.debug("Risorsa "+getPrefix()+key+" non trovata");
					}
				} catch (Exception e) {
					this.logger.error("Errore durante la lettura della risorsa: " + e.getMessage(), e);
					try {
						if(is!=null) {
							is.close();
						}
					} catch(IOException ex) {}
				}
			}

			if(files.containsKey(key)) {
				this.logger.debug("Restituisco il file: " + key);
				return valueType.cast(files.get(key));
			} else {
				this.logger.debug("File "+key+" non trovato. Restituisco BadRequest");
				throw new BadRequestException(ErrorCode.GEN_400);
			}
		} catch(RuntimeException e) {
			this.logger.error("Errore durante la getMockResponse: " + e.getMessage(), e);
			throw e;
		}
	}

	private void checkInput(String id) {
		if(id == null) return;

		if(id.startsWith("eeeee400")) {
			throw new BadRequestException(ErrorCode.GEN_400);
		}

		if(id.startsWith("eeeee404")) {
			throw new NotFoundException(ErrorCode.GEN_404);
		}

		if(id.startsWith("eeeee500")) {
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	private void checkInput(UUID id) {
		if(id == null) return;
		checkInput(id.toString());
	}

	/**
	 * Le collezioni simulate contengono una sola pagina: le richieste successive alla prima
	 * restituiscono un risultato vuoto.
	 */
	private boolean isPrimaPagina(Integer offset) {
		return offset == null || offset.intValue() == 0;
	}

	public ResponseEntity<Problem> getStatus() {
		return ResponseEntity.ok(readMockResponse(Problem.class));
	}

	public ResponseEntity<CertifiedAttribute> createCertifiedAttribute(CertifiedAttributeSeed certifiedAttributeSeed) {
		return ResponseEntity.ok(readMockResponse(CertifiedAttribute.class));
	}

	public ResponseEntity<Agreement> getAgreement(UUID agreementId) {
		checkInput(agreementId);
		return ResponseEntity.ok(readMockResponse(Agreement.class));
	}

	public ResponseEntity<Agreements> getAgreements(Integer offset, Integer limit, List<AgreementState> states,
			List<UUID> producerIds, List<UUID> consumerIds, List<UUID> descriptorIds, List<UUID> eserviceIds) {
		if(!isPrimaPagina(offset)) {
			return ResponseEntity.ok(new Agreements());
		}

		return ResponseEntity.ok(readMockResponse(Agreements.class));
	}

	public ResponseEntity<Agreement> approveAgreement(UUID agreementId) {
		checkInput(agreementId);
		return ResponseEntity.ok(readMockResponse(Agreement.class));
	}

	public ResponseEntity<Purpose> approvePurpose(UUID purposeId) {
		checkInput(purposeId);
		return ResponseEntity.ok(readMockResponse(Purpose.class));
	}

	public ResponseEntity<Purposes> getAgreementPurposes(UUID agreementId, Integer limit, Integer offset) {
		checkInput(agreementId);
		if(!isPrimaPagina(offset)) {
			return ResponseEntity.ok(new Purposes());
		}

		return ResponseEntity.ok(readMockResponse(Purposes.class));
	}

	public ResponseEntity<Purpose> getPurpose(UUID purposeId) {
		checkInput(purposeId);
		return ResponseEntity.ok(readMockResponse(Purpose.class));
	}

	public ResponseEntity<Agreement> getPurposeAgreement(UUID purposeId) {
		checkInput(purposeId);
		return ResponseEntity.ok(readMockResponse(Agreement.class));
	}

	public ResponseEntity<CertifiedAttribute> getCertifiedAttribute(UUID attributeId) {
		checkInput(attributeId);
		return ResponseEntity.ok(readMockResponse(CertifiedAttribute.class));
	}

	public ResponseEntity<DeclaredAttribute> getDeclaredAttribute(UUID attributeId) {
		checkInput(attributeId);
		return ResponseEntity.ok(readMockResponse(DeclaredAttribute.class));
	}

	public ResponseEntity<VerifiedAttribute> getVerifiedAttribute(UUID attributeId) {
		checkInput(attributeId);
		return ResponseEntity.ok(readMockResponse(VerifiedAttribute.class));
	}

	public ResponseEntity<Client> getClient(UUID clientId) {
		checkInput(clientId);
		return ResponseEntity.ok(readMockResponse(Client.class));
	}

	public ResponseEntity<EService> getEService(UUID eserviceId) {
		checkInput(eserviceId);
		return ResponseEntity.ok(readMockResponse(EService.class));
	}

	public ResponseEntity<EServices> getEServices(Integer offset, Integer limit, List<UUID> producerIds,
			List<UUID> templateIds, String name, EServiceTechnology technology, EServiceMode mode,
			Boolean isSignalHubEnabled, Boolean isConsumerDelegable, Boolean isClientAccessDelegable) {
		if(!isPrimaPagina(offset)) {
			return ResponseEntity.ok(new EServices());
		}

		return ResponseEntity.ok(readMockResponse(EServices.class));
	}

	public ResponseEntity<EServiceDescriptor> getEServiceDescriptor(UUID eserviceId, UUID descriptorId) {
		checkInput(eserviceId);
		checkInput(descriptorId);
		return ResponseEntity.ok(readMockResponse(EServiceDescriptor.class));
	}

	public ResponseEntity<EServiceDescriptors> getEServiceDescriptors(UUID eserviceId, Integer offset, Integer limit,
			EServiceDescriptorState state) {
		checkInput(eserviceId);
		if(!isPrimaPagina(offset)) {
			return ResponseEntity.ok(new EServiceDescriptors());
		}

		return ResponseEntity.ok(readMockResponse(EServiceDescriptors.class));
	}

	public ResponseEntity<Documents> getEServiceDescriptorDocuments(UUID eserviceId, UUID descriptorId, Integer offset,
			Integer limit) {
		checkInput(eserviceId);
		checkInput(descriptorId);
		if(!isPrimaPagina(offset)) {
			return ResponseEntity.ok(new Documents());
		}

		return ResponseEntity.ok(readMockResponse(Documents.class));
	}

	public ResponseEntity<EServiceDescriptorCertifiedAttributes> getEServiceDescriptorCertifiedAttributes(
			UUID eserviceId, UUID descriptorId, Integer offset, Integer limit) {
		checkInput(eserviceId);
		checkInput(descriptorId);
		if(!isPrimaPagina(offset)) {
			return ResponseEntity.ok(new EServiceDescriptorCertifiedAttributes());
		}

		return ResponseEntity.ok(readMockResponse(EServiceDescriptorCertifiedAttributes.class));
	}

	public ResponseEntity<EServiceDescriptorDeclaredAttributes> getEServiceDescriptorDeclaredAttributes(
			UUID eserviceId, UUID descriptorId, Integer offset, Integer limit) {
		checkInput(eserviceId);
		checkInput(descriptorId);
		if(!isPrimaPagina(offset)) {
			return ResponseEntity.ok(new EServiceDescriptorDeclaredAttributes());
		}

		return ResponseEntity.ok(readMockResponse(EServiceDescriptorDeclaredAttributes.class));
	}

	public ResponseEntity<EServiceDescriptorVerifiedAttributes> getEServiceDescriptorVerifiedAttributes(
			UUID eserviceId, UUID descriptorId, Integer offset, Integer limit) {
		checkInput(eserviceId);
		checkInput(descriptorId);
		if(!isPrimaPagina(offset)) {
			return ResponseEntity.ok(new EServiceDescriptorVerifiedAttributes());
		}

		return ResponseEntity.ok(readMockResponse(EServiceDescriptorVerifiedAttributes.class));
	}

	public ResponseEntity<Key> getJWKByKid(String kid) {
		checkInput(kid);
		return ResponseEntity.ok(readMockResponse(Key.class));
	}

	public ResponseEntity<Tenant> getTenant(UUID tenantId) {
		checkInput(tenantId);
		return ResponseEntity.ok(readMockResponseTenant(tenantId));
	}

	/**
	 * Il mock non dispone di un registro di organizzazioni: per gli identificativi diversi da
	 * quello della risposta simulata (ad esempio i fruitori presenti negli accordi) vengono
	 * restituiti nome e codice IPA derivati dall'identificativo richiesto, in modo che le
	 * organizzazioni risultino distinguibili.
	 */
	private Tenant readMockResponseTenant(UUID tenantId) {
		Tenant tenant = readMockResponse(Tenant.class);

		if(tenantId == null || tenantId.equals(tenant.getId())) {
			return tenant;
		}

		String suffisso = tenantId.toString().substring(0, 4);

		ExternalId externalId = new ExternalId();
		externalId.setOrigin(tenant.getExternalId() != null ? tenant.getExternalId().getOrigin() : "IPA");
		externalId.setValue("c_" + suffisso);

		Tenant fruitore = new Tenant();
		fruitore.setId(tenantId);
		fruitore.setExternalId(externalId);
		fruitore.setName("Ente fruitore " + suffisso);
		fruitore.setKind(tenant.getKind());
		fruitore.setCreatedAt(tenant.getCreatedAt());

		return fruitore;
	}

	public ResponseEntity<Tenants> getTenants(Integer offset, Integer limit, String ipACode, String taxCode) {
		checkInput(ipACode);
		checkInput(taxCode);
		if(!isPrimaPagina(offset)) {
			return ResponseEntity.ok(new Tenants());
		}

		return ResponseEntity.ok(readMockResponse(Tenants.class));
	}
}

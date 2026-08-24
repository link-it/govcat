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
package org.govway.catalogo.pdnd;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.exception.ClientApiException;
import org.govway.catalogo.exception.NotImplementedException;
import org.govway.catalogo.pdnd.controllers.PDNDClientV3;
import org.govway.catalogo.servlets.pdnd.model.AgreementState;
import org.govway.catalogo.servlets.pdnd.model.AttributeKind;
import org.govway.catalogo.servlets.pdnd.model.EService;
import org.govway.catalogo.servlets.pdnd.model.EServiceAttribute;
import org.govway.catalogo.servlets.pdnd.model.EServiceDescriptorState;
import org.govway.catalogo.servlets.pdnd.model.EServiceTechnology;
import org.govway.catalogo.servlets.pdnd.model.EServices;
import org.govway.catalogo.servlets.pdnd.model.PurposeState;
import org.govway.catalogo.servlets.pdnd.model.Subscribers;
import org.govway.catalogo.servlets.pdnd.v3.client.api.GatewayApi;
import org.govway.catalogo.servlets.pdnd.v3.client.api.impl.ApiException;
import org.govway.catalogo.servlets.pdnd.v3.model.Agreement;
import org.govway.catalogo.servlets.pdnd.v3.model.Agreements;
import org.govway.catalogo.servlets.pdnd.v3.model.CertifiedAttribute;
import org.govway.catalogo.servlets.pdnd.v3.model.DeclaredAttribute;
import org.govway.catalogo.servlets.pdnd.v3.model.Documents;
import org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptor;
import org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorCertifiedAttribute;
import org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorCertifiedAttributes;
import org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorDeclaredAttributes;
import org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorVerifiedAttributes;
import org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptors;
import org.govway.catalogo.servlets.pdnd.v3.model.ExternalId;
import org.govway.catalogo.servlets.pdnd.v3.model.Purpose;
import org.govway.catalogo.servlets.pdnd.v3.model.PurposeVersion;
import org.govway.catalogo.servlets.pdnd.v3.model.PurposeVersionState;
import org.govway.catalogo.servlets.pdnd.v3.model.Tenant;
import org.govway.catalogo.servlets.pdnd.v3.model.TenantKind;
import org.govway.catalogo.servlets.pdnd.v3.model.Tenants;
import org.junit.jupiter.api.Test;

/**
 * Verifica l'adattamento delle risposte dell'API PDND v3 verso il modello dati dell'API
 * PDND esposta da GovCat, che resta quello dell'API PDND v1.
 */
class PDNDClientV3Test {

	private static final UUID PRODUCER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
	private static final UUID CONSUMER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
	private static final UUID ESERVICE_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
	private static final UUID DESCRIPTOR_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");
	private static final UUID AGREEMENT_ID = UUID.fromString("55555555-5555-5555-5555-555555555555");
	private static final UUID PURPOSE_ID = UUID.fromString("66666666-6666-6666-6666-666666666666");
	private static final UUID ATTRIBUTE_ID = UUID.fromString("88888888-8888-8888-8888-888888888888");


	// ==================== operazioni non supportate dalla v3 ====================

	@Test
	void operazioniSenzaEquivalenteV3RestituisconoNotImplemented() throws Exception {
		GatewayApi api = mock(GatewayApi.class);
		PDNDClientV3 client = new PDNDClientV3(api);

		assertThrows(NotImplementedException.class, () -> client.getAgreementAttributes(AGREEMENT_ID));
		assertThrows(NotImplementedException.class, () -> client.getEventsFromId(1L, 10));
		assertThrows(NotImplementedException.class, () -> client.getEservicesEventsFromId(1L, 10));
		assertThrows(NotImplementedException.class, () -> client.getKeysEventsFromId(1L, 10));
		assertThrows(NotImplementedException.class, () -> client.upsertTenant("IPA", "c_h501", "L5"));
		assertThrows(NotImplementedException.class, () -> client.revokeTenantAttribute("IPA", "c_h501", "L5"));
	}


	// ==================== accordi ====================

	@Test
	void gliAccordiInBozzaNonSonoEsposti() throws Exception {
		GatewayApi api = mock(GatewayApi.class);

		Agreements agreements = new Agreements();
		agreements.setResults(List.of(
				agreement(AGREEMENT_ID, org.govway.catalogo.servlets.pdnd.v3.model.AgreementState.ACTIVE),
				agreement(UUID.randomUUID(), org.govway.catalogo.servlets.pdnd.v3.model.AgreementState.DRAFT)));

		when(api.getAgreements(eq(0), any(), isNull(), any(), any(), any(), any())).thenReturn(agreements);

		org.govway.catalogo.servlets.pdnd.model.Agreements response =
				new PDNDClientV3(api).getAgreements(PRODUCER_ID, null, ESERVICE_ID, null, null).getBody();

		assertEquals(1, response.getAgreements().size());
		assertEquals(AGREEMENT_ID, response.getAgreements().get(0).getId());
		assertEquals(AgreementState.ACTIVE, response.getAgreements().get(0).getState());
	}

	@Test
	void iSottoscrittoriRiportanoIDatiDellOrganizzazione() throws Exception {
		GatewayApi api = mock(GatewayApi.class);

		Agreements agreements = new Agreements();
		agreements.setResults(List.of(
				agreement(AGREEMENT_ID, org.govway.catalogo.servlets.pdnd.v3.model.AgreementState.ACTIVE)));

		when(api.getAgreements(eq(0), any(), isNull(), any(), any(), any(), any())).thenReturn(agreements);
		when(api.getTenant(CONSUMER_ID)).thenReturn(tenant());

		Subscribers response = new PDNDClientV3(api).getSubscribers(PRODUCER_ID, ESERVICE_ID).getBody();

		assertEquals(1, response.getSubscribers().size());
		assertEquals(CONSUMER_ID, response.getSubscribers().get(0).getConsumerId());
		assertEquals("Comune di Test", response.getSubscribers().get(0).getName());
		// la v3 non espone la categoria IPA: viene riportata la tipologia di tenant
		assertEquals("PA", response.getSubscribers().get(0).getCategory());
		assertEquals("IPA", response.getSubscribers().get(0).getExternalId().getOrigin());
		assertEquals("c_h501", response.getSubscribers().get(0).getExternalId().getId());
		assertEquals(AgreementState.ACTIVE, response.getSubscribers().get(0).getState());
	}


	// ==================== finalita' ====================

	@Test
	void laFinalitaRiportaChiamateGiornaliereEStatoDellaVersioneCorrente() throws Exception {
		GatewayApi api = mock(GatewayApi.class);
		when(api.getPurpose(PURPOSE_ID)).thenReturn(purpose(PurposeVersionState.ACTIVE, 500));

		org.govway.catalogo.servlets.pdnd.model.Purpose response =
				new PDNDClientV3(api).getPurpose(PURPOSE_ID).getBody();

		assertEquals(PURPOSE_ID, response.getId());
		assertEquals(500, response.getThroughput());
		assertEquals(PurposeState.ACTIVE, response.getState());
	}

	@Test
	void leFinalitaConStatoNonRappresentabileNonSonoEsposte() throws Exception {
		GatewayApi api = mock(GatewayApi.class);

		org.govway.catalogo.servlets.pdnd.v3.model.Purposes purposes =
				new org.govway.catalogo.servlets.pdnd.v3.model.Purposes();
		purposes.setResults(List.of(purpose(PurposeVersionState.REJECTED, 100)));

		when(api.getAgreementPurposes(eq(AGREEMENT_ID), any(), eq(0))).thenReturn(purposes);

		org.govway.catalogo.servlets.pdnd.model.Purposes response =
				new PDNDClientV3(api).getAgreementPurposes(AGREEMENT_ID).getBody();

		assertTrue(response.getPurposes().isEmpty());
	}


	// ==================== attributi ====================

	@Test
	void laRicercaDellAttributoProsegueSuiTipiSuccessiviInCasoDi404() throws Exception {
		GatewayApi api = mock(GatewayApi.class);

		when(api.getCertifiedAttribute(ATTRIBUTE_ID)).thenThrow(new ApiException(404, "not found"));

		DeclaredAttribute declared = new DeclaredAttribute();
		declared.setId(ATTRIBUTE_ID);
		declared.setName("Attributo dichiarato");
		when(api.getDeclaredAttribute(ATTRIBUTE_ID)).thenReturn(declared);

		org.govway.catalogo.servlets.pdnd.model.Attribute response =
				new PDNDClientV3(api).getAttribute(ATTRIBUTE_ID).getBody();

		assertEquals(ATTRIBUTE_ID, response.getId());
		assertEquals(AttributeKind.DECLARED, response.getKind());
		verify(api, never()).getVerifiedAttribute(any());
	}

	@Test
	void gliErroriDiversiDa404NonInnescanoLaRicercaSuiTipiSuccessivi() throws Exception {
		GatewayApi api = mock(GatewayApi.class);
		when(api.getCertifiedAttribute(ATTRIBUTE_ID)).thenThrow(new ApiException(500, "errore"));

		PDNDClientV3 client = new PDNDClientV3(api);

		assertThrows(ClientApiException.class, () -> client.getAttribute(ATTRIBUTE_ID));
		verify(api, never()).getDeclaredAttribute(any());
	}


	// ==================== e-service ====================

	@Test
	void lEServiceRiportaVersioneStatoUrlEAttributiDelDescrittoreCorrente() throws Exception {
		GatewayApi api = mock(GatewayApi.class);
		mockEService(api);

		EService response = new PDNDClientV3(api).getEService(ESERVICE_ID).getBody();

		assertEquals(ESERVICE_ID, response.getId());
		assertEquals("Anagrafe", response.getName());
		assertEquals(EServiceTechnology.REST, response.getTechnology());
		assertEquals(PRODUCER_ID, response.getProducer().getId());
		assertEquals("PA", response.getProducer().getCategory());

		// dati provenienti dal descrittore
		assertEquals("2", response.getVersion());
		assertEquals(EServiceDescriptorState.PUBLISHED, response.getState());
		assertEquals(List.of("https://example.gov.it/anagrafe/v2"), response.getServerUrls());

		// un gruppo con due attributi diventa un'alternativa in OR
		assertEquals(1, response.getAttributes().getCertified().size());
		EServiceAttribute certified = response.getAttributes().getCertified().get(0);
		assertNull(certified.getSingle());
		assertEquals(2, certified.getGroup().size());
		assertEquals("L5", certified.getGroup().get(0).getCode());
		assertEquals("IPA", certified.getGroup().get(0).getOrigin());
	}

	@Test
	void laListaEServiceDiUnEnteApplicaIlFiltroPerAttributo() throws Exception {
		GatewayApi api = mock(GatewayApi.class);
		mockEService(api);

		Tenants tenants = new Tenants();
		tenants.setResults(List.of(tenantProduttore()));
		when(api.getTenants(eq(0), any(), eq("c_h501"), isNull())).thenReturn(tenants);

		org.govway.catalogo.servlets.pdnd.v3.model.EServices eservices =
				new org.govway.catalogo.servlets.pdnd.v3.model.EServices();
		eservices.setResults(List.of(eservice()));
		when(api.getEServices(eq(0), any(), any(), any(), any(), any(), any(), any(), any(), any()))
			.thenReturn(eservices);

		PDNDClientV3 client = new PDNDClientV3(api);

		EServices conAttributo = client.getOrganizationEServices("IPA", "c_h501", "IPA", "L5").getBody();
		assertEquals(1, conAttributo.getEservices().size());

		EServices senzaAttributo = client.getOrganizationEServices("IPA", "c_h501", "IPA", "L9").getBody();
		assertTrue(senzaAttributo.getEservices().isEmpty());
	}

	@Test
	void iDescrittoriInBozzaNonSonoEsposti() throws Exception {
		GatewayApi api = mock(GatewayApi.class);

		EServiceDescriptors descriptors = new EServiceDescriptors();
		descriptors.setResults(List.of(
				descriptor(DESCRIPTOR_ID, "2",
						org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorState.PUBLISHED),
				descriptor(UUID.randomUUID(), "3",
						org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorState.DRAFT)));

		when(api.getEServiceDescriptors(eq(ESERVICE_ID), eq(0), any(), isNull())).thenReturn(descriptors);
		when(api.getEServiceDescriptorDocuments(eq(ESERVICE_ID), any(), eq(0), any())).thenReturn(new Documents());

		org.govway.catalogo.servlets.pdnd.model.EServiceDescriptors response =
				new PDNDClientV3(api).getEServiceDescriptors(ESERVICE_ID).getBody();

		assertEquals(1, response.getDescriptors().size());
		assertEquals(DESCRIPTOR_ID, response.getDescriptors().get(0).getId());
	}

	@Test
	void ilDescrittoreRiportaIDocumentiPubblicati() throws Exception {
		GatewayApi api = mock(GatewayApi.class);

		when(api.getEServiceDescriptor(ESERVICE_ID, DESCRIPTOR_ID)).thenReturn(
				descriptor(DESCRIPTOR_ID, "2",
						org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorState.PUBLISHED));

		org.govway.catalogo.servlets.pdnd.v3.model.Document document =
				new org.govway.catalogo.servlets.pdnd.v3.model.Document();
		document.setId(UUID.randomUUID());
		document.setName("openapi.yaml");
		document.setContentType("application/yaml");

		Documents documents = new Documents();
		documents.setResults(List.of(document));
		when(api.getEServiceDescriptorDocuments(eq(ESERVICE_ID), eq(DESCRIPTOR_ID), eq(0), any()))
			.thenReturn(documents);

		org.govway.catalogo.servlets.pdnd.model.EServiceDescriptor response =
				new PDNDClientV3(api).getEServiceDescriptor(ESERVICE_ID, DESCRIPTOR_ID).getBody();

		assertEquals(1, response.getDocs().size());
		assertEquals("openapi.yaml", response.getDocs().get(0).getName());
		assertEquals("application/yaml", response.getDocs().get(0).getContentType());
		// l'API v3 non espone i metadati dell'interfaccia del descrittore
		assertNull(response.getInterface());
	}


	// ==================== paginazione ====================

	@Test
	void leCollezioniPaginateVengonoScorseFinoAllUltimaPagina() throws Exception {
		GatewayApi api = mock(GatewayApi.class);

		List<Agreement> primaPagina = new ArrayList<>();
		for(int i = 0; i < 50; i++) {
			primaPagina.add(agreement(UUID.randomUUID(),
					org.govway.catalogo.servlets.pdnd.v3.model.AgreementState.ACTIVE));
		}

		Agreements pagina1 = new Agreements();
		pagina1.setResults(primaPagina);

		Agreements pagina2 = new Agreements();
		pagina2.setResults(List.of(agreement(AGREEMENT_ID,
				org.govway.catalogo.servlets.pdnd.v3.model.AgreementState.ACTIVE)));

		when(api.getAgreements(eq(0), any(), any(), any(), any(), any(), any())).thenReturn(pagina1);
		when(api.getAgreements(eq(50), any(), any(), any(), any(), any(), any())).thenReturn(pagina2);

		org.govway.catalogo.servlets.pdnd.model.Agreements response =
				new PDNDClientV3(api).getAgreements(null, null, null, null, null).getBody();

		assertEquals(51, response.getAgreements().size());
	}


	// ==================== dati di test ====================

	private Agreement agreement(UUID id, org.govway.catalogo.servlets.pdnd.v3.model.AgreementState state) {
		Agreement agreement = new Agreement();
		agreement.setId(id);
		agreement.setEserviceId(ESERVICE_ID);
		agreement.setDescriptorId(DESCRIPTOR_ID);
		agreement.setProducerId(PRODUCER_ID);
		agreement.setConsumerId(CONSUMER_ID);
		agreement.setState(state);
		return agreement;
	}

	private Tenant tenant() {
		Tenant tenant = new Tenant();
		tenant.setId(CONSUMER_ID);
		tenant.setName("Comune di Test");
		tenant.setKind(TenantKind.PA);

		ExternalId externalId = new ExternalId();
		externalId.setOrigin("IPA");
		externalId.setValue("c_h501");
		tenant.setExternalId(externalId);

		return tenant;
	}

	private Tenant tenantProduttore() {
		Tenant tenant = tenant();
		tenant.setId(PRODUCER_ID);
		return tenant;
	}

	private Purpose purpose(PurposeVersionState state, int dailyCalls) {
		PurposeVersion version = new PurposeVersion();
		version.setId(UUID.randomUUID());
		version.setState(state);
		version.setDailyCalls(dailyCalls);

		Purpose purpose = new Purpose();
		purpose.setId(PURPOSE_ID);
		purpose.setEserviceId(ESERVICE_ID);
		purpose.setConsumerId(CONSUMER_ID);
		purpose.setCurrentVersion(version);

		return purpose;
	}

	private org.govway.catalogo.servlets.pdnd.v3.model.EService eservice() {
		org.govway.catalogo.servlets.pdnd.v3.model.EService eservice =
				new org.govway.catalogo.servlets.pdnd.v3.model.EService();
		eservice.setId(ESERVICE_ID);
		eservice.setProducerId(PRODUCER_ID);
		eservice.setName("Anagrafe");
		eservice.setDescription("E-service di test");
		eservice.setTechnology(org.govway.catalogo.servlets.pdnd.v3.model.EServiceTechnology.REST);
		return eservice;
	}

	private EServiceDescriptor descriptor(UUID id, String version,
			org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorState state) {
		EServiceDescriptor descriptor = new EServiceDescriptor();
		descriptor.setId(id);
		descriptor.setVersion(version);
		descriptor.setState(state);
		descriptor.setServerUrls(List.of("https://example.gov.it/anagrafe/v" + version));
		return descriptor;
	}

	/**
	 * Predispone le risposte necessarie alla ricostruzione di un e-service nel modello v1:
	 * e-service, organizzazione erogatrice, descrittori e attributi del descrittore.
	 */
	private void mockEService(GatewayApi api) throws ApiException {
		when(api.getEService(ESERVICE_ID)).thenReturn(eservice());
		when(api.getTenant(PRODUCER_ID)).thenReturn(tenantProduttore());

		EServiceDescriptors descriptors = new EServiceDescriptors();
		descriptors.setResults(List.of(
				descriptor(UUID.randomUUID(), "1",
						org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorState.DEPRECATED),
				descriptor(DESCRIPTOR_ID, "2",
						org.govway.catalogo.servlets.pdnd.v3.model.EServiceDescriptorState.PUBLISHED)));
		when(api.getEServiceDescriptors(eq(ESERVICE_ID), eq(0), any(), isNull())).thenReturn(descriptors);

		EServiceDescriptorCertifiedAttributes certified = new EServiceDescriptorCertifiedAttributes();
		certified.setResults(List.of(
				certifiedAttribute(0, "L5"),
				certifiedAttribute(0, "L6")));
		when(api.getEServiceDescriptorCertifiedAttributes(eq(ESERVICE_ID), eq(DESCRIPTOR_ID), eq(0), any()))
			.thenReturn(certified);

		when(api.getEServiceDescriptorDeclaredAttributes(eq(ESERVICE_ID), eq(DESCRIPTOR_ID), eq(0), any()))
			.thenReturn(new EServiceDescriptorDeclaredAttributes());
		when(api.getEServiceDescriptorVerifiedAttributes(eq(ESERVICE_ID), eq(DESCRIPTOR_ID), eq(0), any()))
			.thenReturn(new EServiceDescriptorVerifiedAttributes());
	}

	private EServiceDescriptorCertifiedAttribute certifiedAttribute(int groupIndex, String code) {
		CertifiedAttribute attribute = new CertifiedAttribute();
		attribute.setId(UUID.randomUUID());
		attribute.setCode(code);
		attribute.setOrigin("IPA");
		attribute.setName("Attributo " + code);

		EServiceDescriptorCertifiedAttribute descriptorAttribute = new EServiceDescriptorCertifiedAttribute();
		descriptorAttribute.setGroupIndex(groupIndex);
		descriptorAttribute.setAttribute(attribute);

		return descriptorAttribute;
	}
}

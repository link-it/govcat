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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.AdesioneService;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.monitor.model.AmbienteEnum;
import org.junit.jupiter.api.Test;

/**
 * Verifica la risoluzione del soggetto "erogatore" costruito da {@link FiltriUtils#getApi}
 * per le API {@code EROGATO_SOGGETTO_DOMINIO} (ramo senza adesione), dopo il rework dei
 * soggetti (commit Issue 292):
 * <ul>
 *   <li>fruizione: l'erogatore verso GovWay è {@code servizio.getSoggettoErogatore()} (ente
 *       erogatore / provider), NON {@code dominio.getSoggettoReferente()} che nel nuovo modello
 *       è il fruitore interno;</li>
 *   <li>erogazione: l'erogatore resta {@code dominio.getSoggettoReferente()}.</li>
 * </ul>
 * Regression test: prima del fix la fruizione inviava al monitoraggio il fruitore interno come
 * erogatore, con conseguente lista transazioni vuota.
 * <p>
 * Ramo con adesione (Issue 432): per le fruizioni l'erogatore resta l'ente erogatore del servizio e
 * l'adesione si traduce nell'applicativo fruitore (client dell'adesione); le erogazioni non cambiano.
 */
class FiltriUtilsGetApiSoggettoTest {

    private static final String EROGATORE_SERVIZIO = "EROGATORE_SERVIZIO";
    private static final String REFERENTE_DOMINIO = "REFERENTE_DOMINIO";
    private static final String SOGGETTO_ADERENTE = "SOGGETTO_ADERENTE";
    private static final String PROFILO = "MTLS_FRUIZIONI";
    private static final String ALTRO_PROFILO = "PDND";

    private FiltriUtils buildFiltriUtils(ServizioEntity servizio) throws Exception {
        FiltriUtils filtriUtils = new FiltriUtils();

        ServizioService servizioService = mock(ServizioService.class);
        when(servizioService.find(any())).thenReturn(Optional.of(servizio));
        // runTransaction esegue direttamente il supplier (nessuna transazione reale nei test).
        when(servizioService.runTransaction(any(Supplier.class)))
                .thenAnswer(inv -> ((Supplier<?>) inv.getArgument(0)).get());

        // getSoggettoNome restituisce il nome del soggetto (nomeGateway assente): così l'assert
        // sul soggetto risolto coincide con il nome del soggetto atteso in ciascuno slot.
        SoggettoService soggettoService = mock(SoggettoService.class);
        when(soggettoService.findByNome(any())).thenAnswer(inv -> Optional.of(soggetto(inv.getArgument(0))));

        inject(filtriUtils, "servizioService", servizioService);
        inject(filtriUtils, "soggettoService", soggettoService);
        return filtriUtils;
    }

    private FiltriUtils buildFiltriUtils(ServizioEntity servizio, AdesioneEntity adesione) throws Exception {
        FiltriUtils filtriUtils = buildFiltriUtils(servizio);

        AdesioneService adesioneService = mock(AdesioneService.class);
        when(adesioneService.findByIdAdesione(adesione.getIdAdesione())).thenReturn(Optional.of(adesione));

        inject(filtriUtils, "adesioneService", adesioneService);
        return filtriUtils;
    }

    private static void inject(Object target, String fieldName, Object value) throws Exception {
        Field f = FiltriUtils.class.getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(target, value);
    }

    private SoggettoEntity soggetto(String nome) {
        SoggettoEntity s = new SoggettoEntity();
        s.setNome(nome);
        return s;
    }

    private ServizioEntity servizioErogatoSoggettoDominio(boolean fruizione) {
        ServizioEntity servizio = new ServizioEntity();
        servizio.setFruizione(fruizione);

        DominioEntity dominio = new DominioEntity();
        dominio.setSoggettoReferente(soggetto(REFERENTE_DOMINIO));
        servizio.setDominio(dominio);

        if (fruizione) {
            servizio.setSoggettoErogatore(soggetto(EROGATORE_SERVIZIO));
        }

        ApiEntity api = new ApiEntity();
        api.setNome("WAAS-Flussi-OAuth");
        api.setVersione(1);
        api.setRuolo(RUOLO.EROGATO_SOGGETTO_DOMINIO);
        api.setProduzione(new ApiConfigEntity());
        AuthTypeEntity authType = new AuthTypeEntity();
        authType.setProfilo(PROFILO);
        api.getAuthType().add(authType);
        servizio.getApi().add(api);

        return servizio;
    }

    @Test
    void fruizione_erogatoreDalServizio() throws Exception {
        FiltriUtils filtriUtils = buildFiltriUtils(servizioErogatoSoggettoDominio(true));

        List<IdApi> apiLst = filtriUtils.getApi(java.util.UUID.randomUUID(), null, null, AmbienteEnum.PRODUZIONE);

        assertEquals(1, apiLst.size());
        IdApi id = apiLst.get(0);
        assertTrue(id.isFruizione(), "una fruizione deve risultare isFruizione()=true");
        // erogatore = ente erogatore (provider) indicato sul servizio, NON il referente del dominio
        assertEquals(EROGATORE_SERVIZIO, id.getSoggetto());
    }

    @Test
    void erogazione_erogatoreDalReferenteDominio() throws Exception {
        FiltriUtils filtriUtils = buildFiltriUtils(servizioErogatoSoggettoDominio(false));

        List<IdApi> apiLst = filtriUtils.getApi(java.util.UUID.randomUUID(), null, null, AmbienteEnum.PRODUZIONE);

        assertEquals(1, apiLst.size());
        IdApi id = apiLst.get(0);
        assertFalse(id.isFruizione(), "una erogazione deve risultare isFruizione()=false");
        assertEquals(REFERENTE_DOMINIO, id.getSoggetto());
    }

    /**
     * Dato sporco: servizio NON fruizione ma con soggettoErogatore valorizzato. Il flag
     * autoritativo è isFruizione()=false: deve essere trattato come erogazione, con tipo ed
     * erogatore coerenti (EROGAZIONE + referente del dominio), non FRUIZIONE.
     */
    @Test
    void datiSporchi_nonFruizioneConSoggettoErogatore_trattatoComeErogazione() throws Exception {
        ServizioEntity servizio = servizioErogatoSoggettoDominio(false);
        servizio.setSoggettoErogatore(soggetto(EROGATORE_SERVIZIO)); // incoerente: erogatore su non-fruizione
        FiltriUtils filtriUtils = buildFiltriUtils(servizio);

        List<IdApi> apiLst = filtriUtils.getApi(java.util.UUID.randomUUID(), null, null, AmbienteEnum.PRODUZIONE);

        IdApi id = apiLst.get(0);
        assertFalse(id.isFruizione(), "isFruizione() deve seguire il flag del servizio, non la presenza di soggettoErogatore");
        assertEquals(REFERENTE_DOMINIO, id.getSoggetto());
    }

    /**
     * Dato sporco: servizio fruizione ma senza soggettoErogatore. Non deve andare in NPE:
     * degrada a comportamento di erogazione (referente del dominio) in modo coerente.
     */
    @Test
    void datiSporchi_fruizioneSenzaSoggettoErogatore_nessunNpe() throws Exception {
        ServizioEntity servizio = servizioErogatoSoggettoDominio(true);
        servizio.setSoggettoErogatore(null); // incoerente: fruizione senza ente erogatore
        FiltriUtils filtriUtils = buildFiltriUtils(servizio);

        List<IdApi> apiLst = filtriUtils.getApi(java.util.UUID.randomUUID(), null, null, AmbienteEnum.PRODUZIONE);

        IdApi id = apiLst.get(0);
        assertFalse(id.isFruizione());
        assertEquals(REFERENTE_DOMINIO, id.getSoggetto());
    }

    private AdesioneEntity adesione() {
        AdesioneEntity adesione = new AdesioneEntity();
        adesione.setIdAdesione(UUID.randomUUID().toString());
        adesione.setSoggetto(soggetto(SOGGETTO_ADERENTE));
        return adesione;
    }

    private void addClient(AdesioneEntity adesione, org.govway.catalogo.core.orm.entity.AmbienteEnum ambiente, String profilo, String nomeClient) {
        ClientAdesioneEntity clientAdesione = new ClientAdesioneEntity();
        clientAdesione.setAdesione(adesione);
        clientAdesione.setAmbiente(ambiente);
        clientAdesione.setProfilo(profilo);
        if (nomeClient != null) {
            ClientEntity client = new ClientEntity();
            client.setNome(nomeClient);
            clientAdesione.setClient(client);
        }
        adesione.getClient().add(clientAdesione);
    }

    private List<IdApi> getApi(FiltriUtils filtriUtils, AdesioneEntity adesione) {
        return filtriUtils.getApi(UUID.randomUUID(), null, UUID.fromString(adesione.getIdAdesione()), AmbienteEnum.PRODUZIONE);
    }

    /**
     * Regression test Issue 432: una fruizione filtrata per adesione deve mantenere come erogatore l'ente
     * erogatore del servizio (non il soggetto dell'adesione) e distinguere l'adesione per l'applicativo fruitore,
     * cioè il client dell'adesione per l'ambiente e il profilo dell'API.
     */
    @Test
    void fruizioneConAdesione_erogatoreDalServizio_applicativoDalClient() throws Exception {
        AdesioneEntity adesione = adesione();
        addClient(adesione, org.govway.catalogo.core.orm.entity.AmbienteEnum.PRODUZIONE, PROFILO, "client-produzione");
        addClient(adesione, org.govway.catalogo.core.orm.entity.AmbienteEnum.COLLAUDO, PROFILO, "client-collaudo");
        addClient(adesione, org.govway.catalogo.core.orm.entity.AmbienteEnum.PRODUZIONE, ALTRO_PROFILO, "client-altro-profilo");
        FiltriUtils filtriUtils = buildFiltriUtils(servizioErogatoSoggettoDominio(true), adesione);

        List<IdApi> apiLst = getApi(filtriUtils, adesione);

        assertEquals(1, apiLst.size());
        IdApi id = apiLst.get(0);
        assertTrue(id.isFruizione());
        assertEquals(EROGATORE_SERVIZIO, id.getSoggetto());
        assertEquals("client-produzione", id.getApplicativoFruitore());
    }

    /**
     * Lo stesso client associato a più profili dell'API è un solo applicativo: il filtro resta applicabile.
     */
    @Test
    void fruizioneConAdesione_stessoClientSuPiuProfili() throws Exception {
        ServizioEntity servizio = servizioErogatoSoggettoDominio(true);
        AuthTypeEntity altroProfilo = new AuthTypeEntity();
        altroProfilo.setProfilo(ALTRO_PROFILO);
        servizio.getApi().iterator().next().getAuthType().add(altroProfilo);

        AdesioneEntity adesione = adesione();
        addClient(adesione, org.govway.catalogo.core.orm.entity.AmbienteEnum.PRODUZIONE, PROFILO, "client-produzione");
        addClient(adesione, org.govway.catalogo.core.orm.entity.AmbienteEnum.PRODUZIONE, ALTRO_PROFILO, "client-produzione");
        FiltriUtils filtriUtils = buildFiltriUtils(servizio, adesione);

        assertEquals("client-produzione", getApi(filtriUtils, adesione).get(0).getApplicativoFruitore());
    }

    @Test
    void fruizioneConAdesione_senzaClientNellAmbiente_400() throws Exception {
        AdesioneEntity adesione = adesione();
        addClient(adesione, org.govway.catalogo.core.orm.entity.AmbienteEnum.COLLAUDO, PROFILO, "client-collaudo");
        addClient(adesione, org.govway.catalogo.core.orm.entity.AmbienteEnum.PRODUZIONE, PROFILO, null); // solo nome proposto
        FiltriUtils filtriUtils = buildFiltriUtils(servizioErogatoSoggettoDominio(true), adesione);

        BadRequestException e = assertThrows(BadRequestException.class, () -> getApi(filtriUtils, adesione));
        assertEquals(ErrorCode.ADE_400_MONITORING_CLIENT_ASSENTE, e.getErrorCode());
    }

    @Test
    void fruizioneConAdesione_piuClientDistinti_400() throws Exception {
        ServizioEntity servizio = servizioErogatoSoggettoDominio(true);
        AuthTypeEntity altroProfilo = new AuthTypeEntity();
        altroProfilo.setProfilo(ALTRO_PROFILO);
        servizio.getApi().iterator().next().getAuthType().add(altroProfilo);

        AdesioneEntity adesione = adesione();
        addClient(adesione, org.govway.catalogo.core.orm.entity.AmbienteEnum.PRODUZIONE, PROFILO, "client-a");
        addClient(adesione, org.govway.catalogo.core.orm.entity.AmbienteEnum.PRODUZIONE, ALTRO_PROFILO, "client-b");
        FiltriUtils filtriUtils = buildFiltriUtils(servizio, adesione);

        BadRequestException e = assertThrows(BadRequestException.class, () -> getApi(filtriUtils, adesione));
        assertEquals(ErrorCode.ADE_400_MONITORING_CLIENT_MULTIPLI, e.getErrorCode());
    }

    /**
     * Non regressione: per le erogazioni filtrate per adesione il comportamento non cambia (soggetto
     * dell'adesione, nessun applicativo fruitore).
     */
    @Test
    void erogazioneConAdesione_invariata() throws Exception {
        AdesioneEntity adesione = adesione();
        addClient(adesione, org.govway.catalogo.core.orm.entity.AmbienteEnum.PRODUZIONE, PROFILO, "client-produzione");
        FiltriUtils filtriUtils = buildFiltriUtils(servizioErogatoSoggettoDominio(false), adesione);

        IdApi id = getApi(filtriUtils, adesione).get(0);

        assertFalse(id.isFruizione());
        assertEquals(SOGGETTO_ADERENTE, id.getSoggetto());
        assertNull(id.getApplicativoFruitore());
    }
}

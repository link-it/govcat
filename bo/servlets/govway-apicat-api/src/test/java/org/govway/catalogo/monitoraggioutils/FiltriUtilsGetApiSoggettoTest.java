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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.core.services.SoggettoService;
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
 */
class FiltriUtilsGetApiSoggettoTest {

    private static final String EROGATORE_SERVIZIO = "EROGATORE_SERVIZIO";
    private static final String REFERENTE_DOMINIO = "REFERENTE_DOMINIO";

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
}

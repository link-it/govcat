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
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.govway.catalogo.gest.clients.govwaymonitor.impl.JSON;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroMittenteErogazioneSoggetto;
import org.govway.catalogo.gest.clients.govwaymonitor.model.FiltroMittenteFruizioneApplicativo;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaAndamentoTemporale;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaAndamentoTemporaleAllOfMittente;
import org.govway.catalogo.gest.clients.govwaymonitor.model.RicercaStatisticaDistribuzioneSoggettoRemotoAllOfMittente;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TipoFiltroMittenteEnum;
import org.govway.catalogo.monitor.controllers.StatisticheController.ErogazioneFruizioneEnum;
import org.junit.jupiter.api.Test;

/**
 * Filtro sul mittente dei report statistici (Issue 432): per le fruizioni filtrate per adesione si filtra
 * sull'applicativo fruitore; il comportamento delle erogazioni non cambia.
 */
class GovwayMonitorStatisticheClientMittenteTest {

    private final GovwayMonitorStatisticheClient client = new GovwayMonitorStatisticheClient();

    private GetReportRequest request(ErogazioneFruizioneEnum tipo, String soggettoErogatore, String applicativoFruitore) {
        GetReportRequest request = new GetReportRequest();
        request.setErogazioneFruizioneEnum(tipo);
        request.setSoggettoReferente("Regione");
        request.setSoggettoErogatore(soggettoErogatore);
        request.setApplicativoFruitore(applicativoFruitore);
        return request;
    }

    @Test
    void fruizioneConApplicativo_filtroFruizioneApplicativo() {
        Object mittente = this.client.getMittente(request(ErogazioneFruizioneEnum.FRUIZIONE, "MinisteroInterno", "client-produzione"));

        FiltroMittenteFruizioneApplicativo filtro = assertInstanceOf(FiltroMittenteFruizioneApplicativo.class, mittente);
        assertEquals(TipoFiltroMittenteEnum.FRUIZIONE_APPLICATIVO, filtro.getIdentificazione());
        assertEquals("client-produzione", filtro.getApplicativo());

        // Il filtro è accettato anche dal report per soggetto remoto, che non ammette il filtro per soggetto
        new RicercaStatisticaDistribuzioneSoggettoRemotoAllOfMittente(mittente);

        RicercaStatisticaAndamentoTemporale ricerca = new RicercaStatisticaAndamentoTemporale();
        ricerca.setMittente(new RicercaStatisticaAndamentoTemporaleAllOfMittente(mittente));
        String json = JSON.serialize(ricerca);
        assertTrue(json.contains("\"identificazione\":\"fruizione_applicativo\""), json);
        assertTrue(json.contains("\"applicativo\":\"client-produzione\""), json);
    }

    @Test
    void fruizioneSenzaApplicativo_nessunFiltro() {
        assertNull(this.client.getMittente(request(ErogazioneFruizioneEnum.FRUIZIONE, "MinisteroInterno", null)));
    }

    @Test
    void erogazione_invariata() {
        Object mittente = this.client.getMittente(request(ErogazioneFruizioneEnum.EROGAZIONE, "Aderente", null));

        FiltroMittenteErogazioneSoggetto filtro = assertInstanceOf(FiltroMittenteErogazioneSoggetto.class, mittente);
        assertEquals(TipoFiltroMittenteEnum.EROGAZIONE_SOGGETTO, filtro.getIdentificazione());
        assertEquals("Aderente", filtro.getSoggetto());

        assertNull(this.client.getMittente(request(ErogazioneFruizioneEnum.EROGAZIONE, "Regione", null)));
    }
}

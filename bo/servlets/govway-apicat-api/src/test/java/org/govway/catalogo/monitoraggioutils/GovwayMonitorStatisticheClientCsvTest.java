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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.govway.catalogo.monitor.controllers.StatisticheController.TipologiaReportEnum;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneApplicativoItem;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzionePrincipalItem;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneTokenClientIdItem;
import org.govway.catalogo.servlets.monitor.model.ReportStatisticoDistribuzioneTokenIssuerItem;
import org.govway.catalogo.servlets.monitor.model.TipoInformazioneReportEnum;
import org.junit.jupiter.api.Test;

/**
 * Lettura del CSV dei report di distribuzione di GovWay (Issue 474). Le intestazioni sono quelle prodotte
 * dalla console di monitoraggio di GovWay 3.4.x (etichette di messages_it.properties usate da ExportUtils).
 */
class GovwayMonitorStatisticheClientCsvTest {

    private final GovwayMonitorStatisticheClient client = new GovwayMonitorStatisticheClient();

    private PostReportResponse parse(TipologiaReportEnum tipologia, String csv) throws Exception {
        GetReportRequest request = new GetReportRequest();
        request.setTipologiaReportEnum(tipologia);
        request.setTipoInformazioneReport(TipoInformazioneReportEnum.NUMERO_TRANSAZIONI);
        return this.client.toPostReportResponse(request, csv);
    }

    @Test
    void distribuzioneApplicativo_nomeESoggetto() throws Exception {
        String csv = "Applicativo,Soggetto,Numero Transazioni\n"
                + "ClientValfiorita,Comune di Valfiorita,1250\n"
                + "ClientRegione,Regione Valfiorita,3\n";

        List<ReportStatisticoDistribuzioneApplicativoItem> valori =
                parse(TipologiaReportEnum.DISTRIBUZIONE_APPLICATIVO, csv).getReportStatisticoDistribuzioneApplicativo().getValori();

        assertEquals(2, valori.size());
        assertEquals("ClientValfiorita", valori.get(0).getNome());
        assertEquals("Comune di Valfiorita", valori.get(0).getSoggetto());
        assertEquals(1250L, valori.get(0).getValore());
        assertEquals("ClientRegione", valori.get(1).getNome());
        assertEquals(3L, valori.get(1).getValore());
    }

    @Test
    void distribuzionePrincipal_principalEAutenticazione() throws Exception {
        String csv = "Principal,Autenticazione,Numero Transazioni\n"
                + "\"CN=client.valfiorita.it, O=Comune di Valfiorita, C=IT\",https,42\n";

        List<ReportStatisticoDistribuzionePrincipalItem> valori =
                parse(TipologiaReportEnum.DISTRIBUZIONE_PRINCIPAL, csv).getReportStatisticoDistribuzionePrincipal().getValori();

        assertEquals(1, valori.size());
        ReportStatisticoDistribuzionePrincipalItem item = valori.get(0);
        assertEquals("CN=client.valfiorita.it, O=Comune di Valfiorita, C=IT", item.getPrincipal());
        assertEquals("https", item.getAutenticazione());
        assertEquals(42L, item.getValore());
        // campo deprecato, valorizzato finché il frontend non legge principal
        assertEquals(item.getPrincipal(), item.getIndirizzo());
    }

    @Test
    void distribuzioneTokenClientId_intestazioniGovWay() throws Exception {
        String csv = "Token Client ID,Applicativo,Soggetto,Numero Transazioni\n"
                + "c1d2e3,ClientValfiorita,Comune di Valfiorita,7\n";

        ReportStatisticoDistribuzioneTokenClientIdItem item =
                parse(TipologiaReportEnum.DISTRIBUZIONE_TOKEN_CLIENT_ID, csv).getReportStatisticoDistribuzioneTokenClientId().getValori().get(0);

        assertEquals("c1d2e3", item.getClientId());
        assertEquals("ClientValfiorita", item.getApplicativo());
        assertEquals("Comune di Valfiorita", item.getSoggetto());
        assertEquals(7L, item.getValore());
    }

    @Test
    void distribuzioneTokenIssuer_intestazioniGovWay() throws Exception {
        String csv = "Token Issuer,Numero Transazioni\n"
                + "https://auth.interop.pagopa.it,5\n";

        ReportStatisticoDistribuzioneTokenIssuerItem item =
                parse(TipologiaReportEnum.DISTRIBUZIONE_TOKEN_ISSUER, csv).getReportStatisticoDistribuzioneTokenIssuer().getValori().get(0);

        assertEquals("https://auth.interop.pagopa.it", item.getIssuer());
        assertEquals(5L, item.getValore());
    }

    @Test
    void intestazioniPrecedenti_ancoraLette() throws Exception {
        ReportStatisticoDistribuzioneApplicativoItem applicativo = parse(TipologiaReportEnum.DISTRIBUZIONE_APPLICATIVO,
                "Soggetto,Nome,Numero Transazioni\nComune di Valfiorita,ClientValfiorita,1\n")
                .getReportStatisticoDistribuzioneApplicativo().getValori().get(0);
        assertEquals("ClientValfiorita", applicativo.getNome());

        ReportStatisticoDistribuzionePrincipalItem principal = parse(TipologiaReportEnum.DISTRIBUZIONE_PRINCIPAL,
                "Indirizzo,Numero Transazioni\nutente1,1\n")
                .getReportStatisticoDistribuzionePrincipal().getValori().get(0);
        assertEquals("utente1", principal.getPrincipal());
        assertNull(principal.getAutenticazione());

        ReportStatisticoDistribuzioneTokenClientIdItem clientId = parse(TipologiaReportEnum.DISTRIBUZIONE_TOKEN_CLIENT_ID,
                "Client ID,Numero Transazioni\nc1,1\n")
                .getReportStatisticoDistribuzioneTokenClientId().getValori().get(0);
        assertEquals("c1", clientId.getClientId());

        ReportStatisticoDistribuzioneTokenIssuerItem issuer = parse(TipologiaReportEnum.DISTRIBUZIONE_TOKEN_ISSUER,
                "Issuer,Numero Transazioni\niss,1\n")
                .getReportStatisticoDistribuzioneTokenIssuer().getValori().get(0);
        assertEquals("iss", issuer.getIssuer());
    }

    @Test
    void reportAssente_nessunValore() throws Exception {
        assertTrue(parse(TipologiaReportEnum.DISTRIBUZIONE_PRINCIPAL, null)
                .getReportStatisticoDistribuzionePrincipal().getValori().isEmpty());
    }
}

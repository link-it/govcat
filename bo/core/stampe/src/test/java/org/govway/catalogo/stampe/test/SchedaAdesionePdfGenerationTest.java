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
package org.govway.catalogo.stampe.test;

import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.govway.catalogo.stampe.StampePdf;
import org.govway.catalogo.stampe.model.*;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test per la generazione PDF di SchedaAdesione usando PDFBox
 */
public class SchedaAdesionePdfGenerationTest {

    private static final Logger logger = LoggerFactory.getLogger(SchedaAdesionePdfGenerationTest.class);

    // Immagine PNG 1x1 trasparente in base64 (data URI format)
    private static final String BASE64_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    @Test
    public void testGenerateSchedaAdesionePDF() throws Exception {
        logger.info("Starting SchedaAdesione PDF generation test");

        // Crea oggetto SchedaAdesione di test
        SchedaAdesione schedaAdesione = createTestSchedaAdesione();

        // Genera PDF
        StampePdf stampePdf = StampePdf.getInstance();
        byte[] pdfBytes = stampePdf.creaAdesionePDF(logger, schedaAdesione);

        // Verifica che il PDF sia stato generato
        assertNotNull(pdfBytes, "PDF bytes should not be null");
        assertTrue(pdfBytes.length > 0, "PDF should not be empty");

        // Verifica che inizi con header PDF
        String pdfHeader = new String(pdfBytes, 0, 4);
        assertEquals("%PDF", pdfHeader, "Should start with PDF header");

        // Salva PDF su file per ispezione manuale
        Path outputPath = Paths.get("target", "test-output");
        Files.createDirectories(outputPath);

        Path pdfFile = outputPath.resolve("scheda-adesione-test.pdf");
        try (FileOutputStream fos = new FileOutputStream(pdfFile.toFile())) {
            fos.write(pdfBytes);
        }

        logger.info("PDF generated successfully and saved to: {}", pdfFile.toAbsolutePath());
        logger.info("PDF size: {} bytes", pdfBytes.length);
    }

    private SchedaAdesione createTestSchedaAdesione() {
        SchedaAdesione scheda = new SchedaAdesione();

        // Header e logo
        scheda.setHeader("GovCat - Catalogo API");
        scheda.setLogo(BASE64_LOGO);

        // Informazioni base
        scheda.setTitolo("Richiesta di Adesione");
        scheda.setServizio("API Gestione Pagamenti");
        scheda.setVersioneServizio("2.1.0");
        scheda.setOrganizzazioneAderente("Comune di Roma");
        scheda.setSoggettoAderente("Direzione Servizi Digitali");
        scheda.setIdLogico("ROMA-PAG-001");
        scheda.setRichiedente("Mario Rossi");
        scheda.setStato("APPROVATA");
        scheda.setDescrizione("Adesione al servizio di gestione pagamenti per integrazione con il sistema di riscossione comunale");

        // Date
        String now = LocalDateTime.now().format(DATE_FORMATTER);
        scheda.setDataCreazione("15/09/2024 10:30:00");
        scheda.setDataUltimoAggiornamento("20/09/2024 14:15:00");
        scheda.setDataStampa(now);

        // Riepilogo API
        ApiType apiRiepilogo = new ApiType();
        apiRiepilogo.setTitolo("Riepilogo Informazioni");

        RowType row1 = new RowType();
        row1.setLabel("Nome Servizio");
        row1.setValore("API Gestione Pagamenti");

        RowType row2 = new RowType();
        row2.setLabel("Versione");
        row2.setValore("2.1.0");

        RowType row3 = new RowType();
        row3.setLabel("Erogatore");
        row3.setValore("Ministero dell'Economia");

        RowType row4 = new RowType();
        row4.setLabel("Tipologia");
        row4.setValore("REST");

        RowType row5 = new RowType();
        row5.setLabel("Profilo Interoperabilità");
        row5.setValore("ModI - ID_AUTH_CHANNEL_02");

        apiRiepilogo.getRow().add(row1);
        apiRiepilogo.getRow().add(row2);
        apiRiepilogo.getRow().add(row3);
        apiRiepilogo.getRow().add(row4);
        apiRiepilogo.getRow().add(row5);

        scheda.setApi(apiRiepilogo);

        // Configurazioni (opzionale - può essere vuoto per questo test)
        ConfigsType configs = new ConfigsType();
        scheda.setConfigs(configs);

        // Referenti
        ReferentsType referents = new ReferentsType();

        // Referente adesione
        ReferentType refAdesione = new ReferentType();
        ReferentItemType refAdes1 = new ReferentItemType();
        refAdes1.setTipoReferente("Referente Tecnico");
        refAdes1.setNome("Mario");
        refAdes1.setCognome("Rossi");
        refAdes1.setBusinessTelefono("+39 06 12345678");
        refAdes1.setBusinessEmail("mario.rossi@comune.roma.it");
        refAdes1.setOrganization("Comune di Roma - IT");
        refAdesione.getItem().add(refAdes1);
        referents.setSubscription(refAdesione);

        // Referente servizio
        ReferentType refServizio = new ReferentType();
        ReferentItemType refServ1 = new ReferentItemType();
        refServ1.setTipoReferente("Responsabile Servizio");
        refServ1.setNome("Laura");
        refServ1.setCognome("Bianchi");
        refServ1.setBusinessTelefono("+39 06 87654321");
        refServ1.setBusinessEmail("laura.bianchi@mef.gov.it");
        refServ1.setOrganization("Ministero dell'Economia");
        refServizio.getItem().add(refServ1);
        referents.setService(refServizio);

        // Referente gruppo/dominio
        ReferentType refGruppo = new ReferentType();
        ReferentItemType refGroup1 = new ReferentItemType();
        refGroup1.setTipoReferente("Coordinatore Dominio");
        refGroup1.setNome("Giuseppe");
        refGroup1.setCognome("Verdi");
        refGroup1.setBusinessTelefono("+39 06 11111111");
        refGroup1.setBusinessEmail("giuseppe.verdi@agid.gov.it");
        refGroup1.setOrganization("AgID");
        refGruppo.getItem().add(refGroup1);
        referents.setGroup(refGruppo);

        scheda.setReferents(referents);

        // Base URL Collaudo
        ApiType baseUrlCollaudo = new ApiType();
        baseUrlCollaudo.setTitolo("Endpoint Ambiente di Collaudo");

        RowType urlColl1 = new RowType();
        urlColl1.setLabel("Base URL");
        urlColl1.setValore("https://api-test.comune.roma.it/pagamenti/v2");

        RowType urlColl2 = new RowType();
        urlColl2.setLabel("Client ID");
        urlColl2.setValore("roma-pagamenti-test-001");

        baseUrlCollaudo.getRow().add(urlColl1);
        baseUrlCollaudo.getRow().add(urlColl2);
        scheda.setBaseUrlCollaudo(baseUrlCollaudo);

        // Base URL Produzione
        ApiType baseUrlProduzione = new ApiType();
        baseUrlProduzione.setTitolo("Endpoint Ambiente di Produzione");

        RowType urlProd1 = new RowType();
        urlProd1.setLabel("Base URL");
        urlProd1.setValore("https://api.comune.roma.it/pagamenti/v2");

        RowType urlProd2 = new RowType();
        urlProd2.setLabel("Client ID");
        urlProd2.setValore("roma-pagamenti-prod-001");

        RowType urlProd3 = new RowType();
        urlProd3.setLabel("Rate Limit");
        urlProd3.setValore("1000 richieste/minuto");

        baseUrlProduzione.getRow().add(urlProd1);
        baseUrlProduzione.getRow().add(urlProd2);
        baseUrlProduzione.getRow().add(urlProd3);
        scheda.setBaseUrlProduzione(baseUrlProduzione);

        return scheda;
    }
}

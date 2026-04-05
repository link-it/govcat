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

    @Test
    public void testGenerateSchedaAdesionePDFWithAccentedCharacters() throws Exception {
        logger.info("Starting SchedaAdesione PDF generation test with accented characters (UTF-8)");

        // Crea oggetto SchedaAdesione con caratteri accentati
        SchedaAdesione scheda = new SchedaAdesione();

        scheda.setHeader("Scheda Adesione - Test Caratteri Accentati");
        scheda.setLogo(BASE64_LOGO);
        scheda.setTitolo("Test Modalità di Autenticazione");
        scheda.setServizio("API con caratteri àèìòù");
        scheda.setVersioneServizio("1.0.0");
        scheda.setOrganizzazioneAderente("Città Metropolitana");
        scheda.setSoggettoAderente("Società per Azioni");
        scheda.setIdLogico("TEST-UTF8-001");
        scheda.setRichiedente("François Müller");
        scheda.setStato("APPROVATA");
        scheda.setDescrizione("Test con caratteri accentati: àèìòù, éêë, ñ, ü, ß, così, perché, più");

        String now = LocalDateTime.now().format(DATE_FORMATTER);
        scheda.setDataCreazione("15/09/2024 10:30:00");
        scheda.setDataUltimoAggiornamento("20/09/2024 14:15:00");
        scheda.setDataStampa(now);

        // Riepilogo API con caratteri accentati
        ApiType apiRiepilogo = new ApiType();
        apiRiepilogo.setTitolo("Riepilogo Informazioni");

        RowType row1 = new RowType();
        row1.setLabel("Modalità di autenticazione");
        row1.setValore("Certificato + PDND (così configurato)");

        RowType row2 = new RowType();
        row2.setLabel("Descrizione estesa");
        row2.setValore("L'API è accessibile tramite autenticazione mTLS. È necessario un certificato valido.");

        RowType row3 = new RowType();
        row3.setLabel("Note aggiuntive");
        row3.setValore("Perché la configurazione sia corretta, è più sicuro utilizzare un certificato con validità limitata.");

        apiRiepilogo.getRow().add(row1);
        apiRiepilogo.getRow().add(row2);
        apiRiepilogo.getRow().add(row3);

        scheda.setApi(apiRiepilogo);

        ConfigsType configs = new ConfigsType();
        scheda.setConfigs(configs);

        // BaseURL vuoti per questo test
        ApiType baseUrlCollaudo = new ApiType();
        baseUrlCollaudo.setTitolo("Endpoint Collaudo");
        scheda.setBaseUrlCollaudo(baseUrlCollaudo);

        ApiType baseUrlProduzione = new ApiType();
        baseUrlProduzione.setTitolo("Endpoint Produzione");
        scheda.setBaseUrlProduzione(baseUrlProduzione);

        // Genera PDF
        StampePdf stampePdf = StampePdf.getInstance();
        byte[] pdfBytes = stampePdf.creaAdesionePDF(logger, scheda);

        // Verifica che il PDF sia stato generato
        assertNotNull(pdfBytes, "PDF bytes should not be null");
        assertTrue(pdfBytes.length > 0, "PDF should not be empty");

        // Verifica che inizi con header PDF
        String pdfHeader = new String(pdfBytes, 0, 4);
        assertEquals("%PDF", pdfHeader, "Should start with PDF header");

        // Salva PDF su file per ispezione manuale
        Path outputPath = Paths.get("target", "test-output");
        Files.createDirectories(outputPath);

        Path pdfFile = outputPath.resolve("scheda-adesione-utf8-test.pdf");
        try (FileOutputStream fos = new FileOutputStream(pdfFile.toFile())) {
            fos.write(pdfBytes);
        }

        logger.info("UTF-8 PDF generated successfully and saved to: {}", pdfFile.toAbsolutePath());
        logger.info("PDF size: {} bytes", pdfBytes.length);
    }

    @Test
    public void testGenerateSchedaAdesionePDFMultiPage() throws Exception {
        logger.info("Starting SchedaAdesione PDF multi-page generation test");

        // Crea oggetto SchedaAdesione con molti dati per testare paginazione
        SchedaAdesione schedaAdesione = createTestSchedaAdesioneMultiPage();

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

        Path pdfFile = outputPath.resolve("scheda-adesione-multipage-test.pdf");
        try (FileOutputStream fos = new FileOutputStream(pdfFile.toFile())) {
            fos.write(pdfBytes);
        }

        logger.info("Multi-page PDF generated successfully and saved to: {}", pdfFile.toAbsolutePath());
        logger.info("PDF size: {} bytes", pdfBytes.length);
    }

    private SchedaAdesione createTestSchedaAdesioneMultiPage() {
        SchedaAdesione scheda = new SchedaAdesione();

        // Header e logo
        scheda.setHeader("GovCat - Catalogo API");
        scheda.setLogo(BASE64_LOGO);

        // Informazioni base
        scheda.setTitolo("Richiesta di Adesione");
        scheda.setServizio("API Gestione Pagamenti Multi-Canale");
        scheda.setVersioneServizio("3.0.0");
        scheda.setOrganizzazioneAderente("Regione Lombardia");
        scheda.setSoggettoAderente("Direzione Generale Sistemi Informativi");
        scheda.setIdLogico("LOMBARDIA-PAG-MULTI-001");
        scheda.setRichiedente("Giuseppe Verdi");
        scheda.setStato("APPROVATA");
        scheda.setDescrizione("Adesione completa al servizio di gestione pagamenti multi-canale con integrazione per tutti i sistemi regionali di riscossione, gestione tributi, pagamenti PagoPA e servizi aggiuntivi per il cittadino digitale.");

        // Date
        String now = LocalDateTime.now().format(DATE_FORMATTER);
        scheda.setDataCreazione("01/01/2024 09:00:00");
        scheda.setDataUltimoAggiornamento("15/03/2024 16:30:00");
        scheda.setDataStampa(now);

        // Riepilogo API con molte righe
        ApiType apiRiepilogo = new ApiType();
        apiRiepilogo.setTitolo("Riepilogo Informazioni");

        String[] labels = {"Nome Servizio", "Versione", "Erogatore", "Tipologia", "Profilo Interoperabilità",
            "Dominio Applicativo", "Categoria", "SLA Garantito", "Disponibilità", "Throughput Massimo",
            "Latenza Media", "Timeout", "Retry Policy", "Autenticazione", "Autorizzazione"};
        String[] values = {"API Gestione Pagamenti Multi-Canale", "3.0.0", "Agenzia per l'Italia Digitale",
            "REST/JSON", "ModI - ID_AUTH_CHANNEL_02 + INTEGRITY_REST_01",
            "Servizi Finanziari PA", "Core Services", "99.9%", "24/7 con manutenzione programmata",
            "10000 TPS", "<100ms (p95)", "30 secondi", "3 tentativi con backoff esponenziale",
            "mTLS + JWT Bearer", "OAuth2 + RBAC"};

        for (int i = 0; i < labels.length; i++) {
            RowType row = new RowType();
            row.setLabel(labels[i]);
            row.setValore(values[i]);
            apiRiepilogo.getRow().add(row);
        }

        scheda.setApi(apiRiepilogo);

        // Configurazioni
        ConfigsType configs = new ConfigsType();
        scheda.setConfigs(configs);

        // Configurazioni Collaudo con molte righe
        ApiType configsCollaudo = new ApiType();
        configsCollaudo.setTitolo("Configurazioni (Ambiente di Collaudo)");

        for (int i = 1; i <= 5; i++) {
            RowType confRow = new RowType();
            confRow.setLabel("App Test Collaudo " + i);
            confRow.setValore("ModI | CN=AppTestCollaudo" + i + ",O=RegioneLombardia,C=IT | Scadenza Certificato: 31/12/202" + (5+i));
            configsCollaudo.getRow().add(confRow);
        }
        scheda.setConfigsCollaudo(configsCollaudo);

        // Configurazioni Produzione con molte righe
        ApiType configsProduzione = new ApiType();
        configsProduzione.setTitolo("Configurazioni (Ambiente di Produzione)");

        for (int i = 1; i <= 8; i++) {
            RowType confRow = new RowType();
            confRow.setLabel("App Produzione " + i);
            confRow.setValore("ModI | CN=AppProduzione" + i + ",O=RegioneLombardia,C=IT | Scadenza Certificato: 30/06/202" + (6+i) + " | PDND Client ID: lombardia-prod-" + String.format("%03d", i));
            configsProduzione.getRow().add(confRow);
        }
        scheda.setConfigsProduzione(configsProduzione);

        // Molti referenti per testare paginazione
        ReferentsType referents = new ReferentsType();

        // Referenti adesione (multipli)
        ReferentType refAdesione = new ReferentType();
        String[] nomiAdesione = {"Mario", "Luigi", "Anna", "Carla"};
        String[] cognomiAdesione = {"Rossi", "Bianchi", "Verdi", "Neri"};
        for (int i = 0; i < nomiAdesione.length; i++) {
            ReferentItemType ref = new ReferentItemType();
            ref.setTipoReferente(i == 0 ? "Referente Tecnico Principale" : "Referente Tecnico");
            ref.setNome(nomiAdesione[i]);
            ref.setCognome(cognomiAdesione[i]);
            ref.setBusinessTelefono("+39 02 " + String.format("%08d", 10000000 + i * 1111111));
            ref.setBusinessEmail(nomiAdesione[i].toLowerCase() + "." + cognomiAdesione[i].toLowerCase() + "@regione.lombardia.it");
            ref.setOrganization("Regione Lombardia - DG Sistemi Informativi");
            refAdesione.getItem().add(ref);
        }
        referents.setSubscription(refAdesione);

        // Referenti servizio (multipli)
        ReferentType refServizio = new ReferentType();
        String[] nomiServizio = {"Paolo", "Francesca", "Giulia"};
        String[] cognomiServizio = {"Colombo", "Ferrari", "Romano"};
        for (int i = 0; i < nomiServizio.length; i++) {
            ReferentItemType ref = new ReferentItemType();
            ref.setTipoReferente(i == 0 ? "Responsabile Servizio" : "Deputy Responsabile Servizio");
            ref.setNome(nomiServizio[i]);
            ref.setCognome(cognomiServizio[i]);
            ref.setBusinessTelefono("+39 06 " + String.format("%08d", 50000000 + i * 2222222));
            ref.setBusinessEmail(nomiServizio[i].toLowerCase() + "." + cognomiServizio[i].toLowerCase() + "@agid.gov.it");
            ref.setOrganization("AgID - Area Servizi Digitali");
            refServizio.getItem().add(ref);
        }
        referents.setService(refServizio);

        // Referenti gruppo/dominio (multipli)
        ReferentType refGruppo = new ReferentType();
        String[] nomiGruppo = {"Alessandro", "Valentina"};
        String[] cognomiGruppo = {"Moretti", "Galli"};
        for (int i = 0; i < nomiGruppo.length; i++) {
            ReferentItemType ref = new ReferentItemType();
            ref.setTipoReferente("Coordinatore Dominio");
            ref.setNome(nomiGruppo[i]);
            ref.setCognome(cognomiGruppo[i]);
            ref.setBusinessTelefono("+39 06 " + String.format("%08d", 70000000 + i * 3333333));
            ref.setBusinessEmail(nomiGruppo[i].toLowerCase() + "." + cognomiGruppo[i].toLowerCase() + "@governo.it");
            ref.setOrganization("Presidenza del Consiglio - Dipartimento Trasformazione Digitale");
            refGruppo.getItem().add(ref);
        }
        referents.setGroup(refGruppo);

        scheda.setReferents(referents);

        // Base URL Collaudo con molte righe
        ApiType baseUrlCollaudo = new ApiType();
        baseUrlCollaudo.setTitolo("Endpoint Ambiente di Collaudo");

        RowType urlColl1 = new RowType();
        urlColl1.setLabel("Base URL API v3");
        urlColl1.setValore("https://api-test.servizipubblici.lombardia.it/pagamenti/v3");
        baseUrlCollaudo.getRow().add(urlColl1);

        RowType urlColl2 = new RowType();
        urlColl2.setLabel("Base URL Notifiche");
        urlColl2.setValore("https://api-test.servizipubblici.lombardia.it/notifiche/v2");
        baseUrlCollaudo.getRow().add(urlColl2);

        RowType urlColl3 = new RowType();
        urlColl3.setLabel("Base URL Ricevute");
        urlColl3.setValore("https://api-test.servizipubblici.lombardia.it/ricevute/v1");
        baseUrlCollaudo.getRow().add(urlColl3);

        RowType urlColl4 = new RowType();
        urlColl4.setLabel("Client ID");
        urlColl4.setValore("lombardia-pagamenti-test-multicanale-001");
        baseUrlCollaudo.getRow().add(urlColl4);

        scheda.setBaseUrlCollaudo(baseUrlCollaudo);

        // Base URL Produzione con molte righe
        ApiType baseUrlProduzione = new ApiType();
        baseUrlProduzione.setTitolo("Endpoint Ambiente di Produzione");

        RowType urlProd1 = new RowType();
        urlProd1.setLabel("Base URL API v3");
        urlProd1.setValore("https://api.servizipubblici.lombardia.it/pagamenti/v3");
        baseUrlProduzione.getRow().add(urlProd1);

        RowType urlProd2 = new RowType();
        urlProd2.setLabel("Base URL Notifiche");
        urlProd2.setValore("https://api.servizipubblici.lombardia.it/notifiche/v2");
        baseUrlProduzione.getRow().add(urlProd2);

        RowType urlProd3 = new RowType();
        urlProd3.setLabel("Base URL Ricevute");
        urlProd3.setValore("https://api.servizipubblici.lombardia.it/ricevute/v1");
        baseUrlProduzione.getRow().add(urlProd3);

        RowType urlProd4 = new RowType();
        urlProd4.setLabel("Client ID");
        urlProd4.setValore("lombardia-pagamenti-prod-multicanale-001");
        baseUrlProduzione.getRow().add(urlProd4);

        scheda.setBaseUrlProduzione(baseUrlProduzione);

        // Rate Limiting Collaudo con molte righe
        ApiType rateLimitingCollaudo = new ApiType();
        rateLimitingCollaudo.setTitolo("Rate Limiting (Ambiente di Collaudo)");

        String[] apiNames = {"API Pagamenti v3", "API Notifiche v2", "API Ricevute v1", "API Rendicontazione v1", "API Statistiche v1"};
        String[] rlValuesCollaudo = {"500 / minuto", "200 / minuto", "1000 / minuto", "100 / minuto", "50 / minuto"};

        for (int i = 0; i < apiNames.length; i++) {
            RowType rlRow = new RowType();
            rlRow.setLabel(apiNames[i]);
            rlRow.setValore(rlValuesCollaudo[i]);
            rateLimitingCollaudo.getRow().add(rlRow);
        }
        scheda.setRateLimitingCollaudo(rateLimitingCollaudo);

        // Rate Limiting Produzione con molte righe
        ApiType rateLimitingProduzione = new ApiType();
        rateLimitingProduzione.setTitolo("Rate Limiting (Ambiente di Produzione)");

        String[] rlValuesProduzione = {"2000 / minuto", "500 / minuto", "5000 / minuto", "300 / minuto", "100 / minuto"};

        for (int i = 0; i < apiNames.length; i++) {
            RowType rlRow = new RowType();
            rlRow.setLabel(apiNames[i]);
            rlRow.setValore(rlValuesProduzione[i]);
            rateLimitingProduzione.getRow().add(rlRow);
        }
        scheda.setRateLimitingProduzione(rateLimitingProduzione);

        return scheda;
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

        // Configurazioni Collaudo (nuova sezione)
        ApiType configsCollaudo = new ApiType();
        configsCollaudo.setTitolo("Configurazioni (Ambiente di Collaudo)");

        RowType confColl1 = new RowType();
        confColl1.setLabel("App Test Collaudo");
        confColl1.setValore("ModI | CN=AppTestCollaudo | Scadenza Certificato: 31/12/2025");
        configsCollaudo.getRow().add(confColl1);

        scheda.setConfigsCollaudo(configsCollaudo);

        // Configurazioni Produzione (nuova sezione)
        ApiType configsProduzione = new ApiType();
        configsProduzione.setTitolo("Configurazioni (Ambiente di Produzione)");

        RowType confProd1 = new RowType();
        confProd1.setLabel("App Produzione");
        confProd1.setValore("ModI | CN=AppProduzione | Scadenza Certificato: 15/06/2026");
        configsProduzione.getRow().add(confProd1);

        RowType confProd2 = new RowType();
        confProd2.setLabel("App Produzione 2");
        confProd2.setValore("PDND | Client ID: abc123");
        configsProduzione.getRow().add(confProd2);

        scheda.setConfigsProduzione(configsProduzione);

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

        // Rate Limiting Collaudo
        ApiType rateLimitingCollaudo = new ApiType();
        rateLimitingCollaudo.setTitolo("Rate Limiting (Ambiente di Collaudo)");

        RowType rlColl1 = new RowType();
        rlColl1.setLabel("API Pagamenti v2");
        rlColl1.setValore("500 / minuto");
        rateLimitingCollaudo.getRow().add(rlColl1);

        scheda.setRateLimitingCollaudo(rateLimitingCollaudo);

        // Rate Limiting Produzione
        ApiType rateLimitingProduzione = new ApiType();
        rateLimitingProduzione.setTitolo("Rate Limiting (Ambiente di Produzione)");

        RowType rlProd1 = new RowType();
        rlProd1.setLabel("API Pagamenti v2");
        rlProd1.setValore("1000 / minuto");
        rateLimitingProduzione.getRow().add(rlProd1);

        RowType rlProd2 = new RowType();
        rlProd2.setLabel("API Notifiche v1");
        rlProd2.setValore("200 / ora");
        rateLimitingProduzione.getRow().add(rlProd2);

        scheda.setRateLimitingProduzione(rateLimitingProduzione);

        return scheda;
    }
}

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

import org.govway.catalogo.stampe.StampePdf;
import org.govway.catalogo.stampe.model.*;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test per la generazione PDF di eService usando PDFBox
 */
public class EServicePdfGenerationTest {

    private static final Logger logger = LoggerFactory.getLogger(EServicePdfGenerationTest.class);

    // Immagine PNG 1x1 trasparente in base64 (data URI format)
    private static final String BASE64_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    @Test
    public void testGenerateEServicePDF() throws Exception {
        logger.info("Starting EService PDF generation test");

        // Crea oggetto EService di test
        EService eService = createTestEService();

        // Genera PDF
        StampePdf stampePdf = StampePdf.getInstance();
        byte[] pdfBytes = stampePdf.creaEServicePDF(logger, eService);

        // Verifica che il PDF sia stato generato
        assertNotNull(pdfBytes, "PDF bytes should not be null");
        assertTrue(pdfBytes.length > 0, "PDF should not be empty");

        // Verifica che inizi con header PDF
        String pdfHeader = new String(pdfBytes, 0, 4);
        assertEquals("%PDF", pdfHeader, "Should start with PDF header");

        // Salva PDF su file per ispezione manuale
        Path outputPath = Paths.get("target", "test-output");
        Files.createDirectories(outputPath);

        Path pdfFile = outputPath.resolve("eservice-test.pdf");
        try (FileOutputStream fos = new FileOutputStream(pdfFile.toFile())) {
            fos.write(pdfBytes);
        }

        logger.info("PDF generated successfully and saved to: {}", pdfFile.toAbsolutePath());
        logger.info("PDF size: {} bytes", pdfBytes.length);
    }

    private EService createTestEService() {
        EService eService = new EService();

        // Logo
        eService.setLogo(BASE64_LOGO);

        // Titolo e sottotitolo
        eService.setTitolo("API Gestione Utenti");
        eService.setSottotitolo("Servizio REST per la gestione degli utenti del sistema");

        // Scopo
        ScopoType scopo = new ScopoType();

        // Etichette scopo
        EtichetteScopoType etichette = new EtichetteScopoType();
        etichette.setTitolo("Finalità e Dati Scambiati");
        etichette.setDato("Finalità");
        etichette.setValore("Descrizione");
        etichette.setDescrizione("Dettagli");
        scopo.setEtichette(etichette);

        // Righe scopo
        RigheScopoType righe = new RigheScopoType();

        RigaScopoType riga1 = new RigaScopoType();
        riga1.setDato("Gestione anagrafica utenti");
        riga1.setValore("CRUD operazioni su entità utente");
        riga1.setDescrizione("Permette la creazione, lettura, aggiornamento e cancellazione degli utenti");

        RigaScopoType riga2 = new RigaScopoType();
        riga2.setDato("Autenticazione");
        riga2.setValore("Verifica credenziali utente");
        riga2.setDescrizione("Endpoint per l'autenticazione tramite username/password o token");

        RigaScopoType riga3 = new RigaScopoType();
        riga3.setDato("Gestione profili");
        riga3.setValore("Assegnazione ruoli e permessi");
        riga3.setDescrizione("Permette di gestire i ruoli e i permessi associati agli utenti");

        righe.getRiga().add(riga1);
        righe.getRiga().add(riga2);
        righe.getRiga().add(riga3);

        scopo.setRighe(righe);
        eService.setScopo(scopo);

        // Profili
        ProfiliType profili = new ProfiliType();

        // Etichette profili
        EtichetteProfiliType etichetteProfili = new EtichetteProfiliType();
        etichetteProfili.setTitolo("Pattern di Interoperabilità");
        etichetteProfili.setNome("Pattern");
        etichetteProfili.setRisorse("Risorse");
        profili.setEtichette(etichetteProfili);

        // Righe profili
        RigheProfiliType righeProfili = new RigheProfiliType();

        RigaProfiliType profilo1 = new RigaProfiliType();
        profilo1.setNome("ID_AUTH_CHANNEL_01");
        profilo1.setRisorsa("GET /users, POST /users, PUT /users/{id}, DELETE /users/{id}");
        profilo1.getRisorse().add("GET /users");
        profilo1.getRisorse().add("POST /users");
        profilo1.getRisorse().add("PUT /users/{id}");
        profilo1.getRisorse().add("DELETE /users/{id}");

        RigaProfiliType profilo2 = new RigaProfiliType();
        profilo2.setNome("ID_AUTH_CHANNEL_02");
        profilo2.setRisorsa("POST /auth/login, POST /auth/logout");
        profilo2.getRisorse().add("POST /auth/login");
        profilo2.getRisorse().add("POST /auth/logout");

        RigaProfiliType profilo3 = new RigaProfiliType();
        profilo3.setNome("INTEGRITY_01");
        profilo3.setRisorsa("GET /users/{id}/profile, PUT /users/{id}/profile");
        profilo3.getRisorse().add("GET /users/{id}/profile");
        profilo3.getRisorse().add("PUT /users/{id}/profile");

        righeProfili.getRiga().add(profilo1);
        righeProfili.getRiga().add(profilo2);
        righeProfili.getRiga().add(profilo3);

        profili.setRighe(righeProfili);
        eService.setProfili(profili);

        return eService;
    }
}

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

import static org.junit.jupiter.api.Assertions.*;

import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.util.List;
import java.util.ArrayList;

import org.govway.catalogo.stampe.StampePdf;
import org.govway.catalogo.stampe.model.EService;
import org.govway.catalogo.stampe.model.EtichetteProfiliType;
import org.govway.catalogo.stampe.model.EtichetteScopoType;
import org.govway.catalogo.stampe.model.ProfiliType;
import org.govway.catalogo.stampe.model.RigaProfiliType;
import org.govway.catalogo.stampe.model.RigaScopoType;
import org.govway.catalogo.stampe.model.RigheProfiliType;
import org.govway.catalogo.stampe.model.RigheScopoType;
import org.govway.catalogo.stampe.model.ScopoType;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Test per la generazione PDF di eService usando PDFBox
 */
public class EServicePdfGenerationTest {

	private static final Logger logger = LoggerFactory.getLogger(EServicePdfGenerationTest.class);

	// Immagine PNG 1x1 trasparente in base64 (data URI format)
	private static final String BASE64_LOGO = null;

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

		String nomeServizio = "OCDS";

		eService.setTitolo("Descrittore eService");
		eService.setSottotitolo(nomeServizio);

		ScopoType tabscopo = new ScopoType();

		EtichetteScopoType etichette = new EtichetteScopoType();

		etichette.setTitolo(null);
		etichette.setDato("Dato");
		etichette.setValore("Valore");
		tabscopo.setEtichette(etichette);

		List<RigaScopoType> righeLst = new ArrayList<>();

		RigaScopoType rigaNome = new RigaScopoType();
		rigaNome.setDato("Nome servizio");
		rigaNome.setValore(nomeServizio);
		righeLst.add(rigaNome);

		RigaScopoType rigaVersione = new RigaScopoType();
		rigaVersione.setDato("Versione");
		rigaVersione.setValore("1");
		righeLst.add(rigaVersione);

		RigaScopoType rigaTecnologia = new RigaScopoType();
		rigaTecnologia.setDato("Tecnologia");
		String tecnoString = "soap";
		rigaTecnologia.setValore(tecnoString);
		righeLst.add(rigaTecnologia);

		RigaScopoType rigaDescrittore = new RigaScopoType();
		rigaDescrittore.setDato("Descrittore");
		rigaDescrittore.setValore("ConsultazioneIndicatoreISEE_v2.8_PDND.wsdl");

		righeLst.add(rigaDescrittore);

		RigaScopoType rigaBaseurlCollaudo = new RigaScopoType();
		rigaBaseurlCollaudo.setDato("Base URL pubblica (Collaudo)");

		rigaBaseurlCollaudo.setValore("https://apistage.regione.toscana.it/C02/soap/out/PDND/ANAC/issue6/v1");
		righeLst.add(rigaBaseurlCollaudo);

		RigaScopoType rigaBaseurlProd = new RigaScopoType();
		rigaBaseurlProd.setDato("Base URL pubblica (Produzione)");

		rigaBaseurlProd.setValore("https://api.regione.toscana.it/C02/soap/out/PDND/ANAC/issue6/v1");
		righeLst.add(rigaBaseurlProd);

		RigheScopoType righe = new RigheScopoType();
		righe.getRiga().addAll(righeLst);

		tabscopo.setRighe(righe);
		eService.setScopo(tabscopo);

		ProfiliType profilo = new ProfiliType();

		EtichetteProfiliType etichetteProfilo = new EtichetteProfiliType();

		etichetteProfilo.setNome("Profilo");
		etichetteProfilo.setTitolo("Profili di Interoperabilità da utilizzare per le operation/risorse dell'API");
		etichetteProfilo.setRisorse("Operation/Risorse");
		profilo.setEtichette(etichetteProfilo);

		List<RigaProfiliType> righeProfilo = new ArrayList<RigaProfiliType>();

		RigaProfiliType rigaProfilo = new RigaProfiliType();
		rigaProfilo.setNome("Fruizioni PDND");
		rigaProfilo.setRisorsa("Tutte");
		rigaProfilo.getRisorse().add("Tutte");

		righeProfilo.add(rigaProfilo);

		RigheProfiliType righeP = new RigheProfiliType();
		righeP.getRiga().addAll(righeProfilo);
		profilo.setRighe(righeP);

		eService.setProfili(profilo);
		return eService;
	}
}

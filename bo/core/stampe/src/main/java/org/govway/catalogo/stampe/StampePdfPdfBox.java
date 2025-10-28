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
package org.govway.catalogo.stampe;

import java.io.IOException;
import java.io.InputStream;

import org.govway.catalogo.stampe.model.EService;
import org.govway.catalogo.stampe.model.SchedaAdesione;
import org.govway.catalogo.stampe.pdfbox.PdfBoxReportEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * PDF generation using PDFBox (replacement for JasperReports)
 */
public class StampePdfPdfBox {

    private static StampePdfPdfBox _instance = null;
    private static PdfBoxReportEngine engine = null;

    public static StampePdfPdfBox getInstance() {
        if (_instance == null)
            init();

        return _instance;
    }

    public static synchronized void init() {
        if (engine == null) {
            engine = new PdfBoxReportEngine();
        }

        if (_instance == null) {
            _instance = new StampePdfPdfBox();
        }
    }

    public byte[] creaEServicePDF(Logger log, EService input) throws Exception {
        log.info("Generating eService PDF using PDFBox");

        try (InputStream templateStream = StampePdfPdfBox.class.getResourceAsStream("/eservice_template.json")) {
            if (templateStream == null) {
                throw new IOException("Template not found: /eservice_template.json");
            }

            return engine.generatePdf(templateStream, input);
        }
    }

    public byte[] creaAdesionePDF(Logger log, SchedaAdesione input) throws Exception {
        log.info("Generating scheda adesione PDF using PDFBox");

        try (InputStream templateStream = StampePdfPdfBox.class.getResourceAsStream("/scheda_adesione_template.json")) {
            if (templateStream == null) {
                throw new IOException("Template not found: /scheda_adesione_template.json");
            }

            return engine.generatePdf(templateStream, input);
        }
    }
}

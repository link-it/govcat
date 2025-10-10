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

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.JAXBElement;
import jakarta.xml.bind.JAXBException;
import jakarta.xml.bind.Marshaller;
import javax.xml.namespace.QName;

import org.govway.catalogo.stampe.model.EService;
import org.govway.catalogo.stampe.model.SchedaAdesione;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import net.sf.jasperreports.engine.DefaultJasperReportsContext;
import net.sf.jasperreports.engine.JRDataSource;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JRParameter;
import net.sf.jasperreports.engine.JRPropertiesUtil;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRXmlDataSource;
import net.sf.jasperreports.engine.fill.JRGzipVirtualizer;
import net.sf.jasperreports.engine.util.JRLoader;

public class StampePdf {

	private static StampePdf _instance = null;
	private static JAXBContext jaxbContext = null;
	private static byte[] templateEService = null;
	private static byte[] templateAdesioni = null;
	
	public static StampePdf getInstance() {
		if(_instance == null)
			init();

		return _instance;
	}

	public static synchronized void init() {
		if(jaxbContext == null) {
			try {
				jaxbContext = JAXBContext.newInstance(EService.class, SchedaAdesione.class);
			} catch (JAXBException e) {
				LoggerFactory.getLogger(StampePdf.class).error("Errore durtante l'inizializzazione JAXB", e); 
			}
		}

		if(_instance == null) {
			_instance = new StampePdf();
		}
			
	}

	public StampePdf() {
		try {
			
			templateEService = StampePdf.class.getResourceAsStream("/template_eservice.jasper").readAllBytes();
			templateAdesioni = StampePdf.class.getResourceAsStream("/SchedaAdesione.jasper").readAllBytes();
			
		} catch (IOException e) {
			LoggerFactory.getLogger(StampePdf.class).error("Errore durante la lettura del template jasper dell'eService", e); 
		}
		
	}

	public byte[] creaEServicePDF(Logger log, EService input) throws JAXBException, IOException, JRException {
		Map<String, Object> parameters = new HashMap<String, Object>();
		
		JRGzipVirtualizer virtualizer = new JRGzipVirtualizer(50);
		parameters.put(JRParameter.REPORT_VIRTUALIZER, virtualizer);
		
		try (ByteArrayInputStream templateIS = new ByteArrayInputStream(templateEService);){
			
			DefaultJasperReportsContext defaultJasperReportsContext = DefaultJasperReportsContext.getInstance();
			
			JRPropertiesUtil.getInstance(defaultJasperReportsContext).setProperty("net.sf.jasperreports.xpath.executer.factory",
                    "net.sf.jasperreports.engine.util.xml.JaxenXPathExecuterFactory");
					byte[] ba = getXML(input);
			
			log.info("XML eService:"+ new String(ba));
			try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(ba);){
	

				JRDataSource dataSource = new JRXmlDataSource(defaultJasperReportsContext, byteArrayInputStream,"eService");
				JasperReport jasperReport = (JasperReport) JRLoader.loadObject(defaultJasperReportsContext,templateIS);
				JasperPrint jasperPrint = JasperFillManager.getInstance(defaultJasperReportsContext).fill(jasperReport, parameters, dataSource);
			
				return JasperExportManager.getInstance(defaultJasperReportsContext).exportToPdf(jasperPrint);
			}finally {
				
			}
		}finally {
			
		}
	}

	public byte[] creaAdesionePDF(Logger log, SchedaAdesione input) throws JAXBException, IOException, JRException {
		Map<String, Object> parameters = new HashMap<String, Object>();
		
		JRGzipVirtualizer virtualizer = new JRGzipVirtualizer(50);
		parameters.put(JRParameter.REPORT_VIRTUALIZER, virtualizer);
		
		parameters.put("SUBREPORT_DIR", "");

		try (ByteArrayInputStream templateIS = new ByteArrayInputStream(templateAdesioni);){
			
			DefaultJasperReportsContext defaultJasperReportsContext = DefaultJasperReportsContext.getInstance();
			
			JRPropertiesUtil.getInstance(defaultJasperReportsContext).setProperty("net.sf.jasperreports.xpath.executer.factory",
                    "net.sf.jasperreports.engine.util.xml.JaxenXPathExecuterFactory");
			
			byte[] ba = getXML(input);
			log.info("XML adesioni:"+ new String(ba));
			try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(ba);){
	

				JRDataSource dataSource = new JRXmlDataSource(defaultJasperReportsContext, byteArrayInputStream,"scheda_adesione");
				JasperReport jasperReport = (JasperReport) JRLoader.loadObject(defaultJasperReportsContext,templateIS);
				JasperPrint jasperPrint = JasperFillManager.getInstance(defaultJasperReportsContext).fill(jasperReport, parameters, dataSource);
			
				return JasperExportManager.getInstance(defaultJasperReportsContext).exportToPdf(jasperPrint);
			}finally {
				
			}
		}finally {
			
		}
	}
	
	public byte[] getXML(EService input) throws JAXBException, IOException {
		return getXML(input, "eService", EService.class);
	}
	
	public byte[] getXML(SchedaAdesione input) throws JAXBException, IOException {
		return getXML(input, "scheda_adesione", SchedaAdesione.class);
	}
	
	public <T> byte[] getXML(T input, String root, Class<T> clazz) throws JAXBException, IOException {
		try (ByteArrayOutputStream baos = new ByteArrayOutputStream();){
		JAXBElement<T> jaxbElement = new JAXBElement<T>(new QName("", root), clazz, null, input);

		Marshaller jaxbMarshaller = jaxbContext.createMarshaller();
		jaxbMarshaller.setProperty("com.sun.xml.bind.xmlDeclaration", Boolean.FALSE);
		jaxbMarshaller.setProperty("jaxb.formatted.output", Boolean.TRUE);
		jaxbMarshaller.marshal(jaxbElement, baos);
		return baos.toByteArray();
		}
	}
	
}

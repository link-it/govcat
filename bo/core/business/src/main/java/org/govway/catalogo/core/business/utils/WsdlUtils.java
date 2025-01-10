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
package org.govway.catalogo.core.business.utils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.wsdl.Definition;
import javax.wsdl.WSDLException;
import javax.wsdl.extensions.ExtensibilityElement;
import javax.wsdl.extensions.soap.SOAPOperation;
import javax.wsdl.extensions.soap12.SOAP12Operation;
import javax.wsdl.factory.WSDLFactory;
import javax.wsdl.xml.WSDLReader;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.govway.catalogo.core.business.utils.OperationInfo.MessaggioType;
import org.govway.catalogo.core.business.utils.SOAPAction.SOAPVersion;
import org.govway.catalogo.core.orm.entity.ApiEntity.PROTOCOLLO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;


public class WsdlUtils {

	private static final String SOAP_11_NS = "http://schemas.xmlsoap.org/wsdl/soap/";
	private static final String SOAP_12_NS = "http://schemas.xmlsoap.org/wsdl/soap12/";
	
	private final static Logger logger = LoggerFactory.getLogger(WsdlUtils.class);
	private static DocumentBuilder instance = null;
	private static DocumentBuilder getDocumentBuilder() throws ParserConfigurationException {
		if(instance == null) {
			DocumentBuilderFactory builderFactory = DocumentBuilderFactory.newInstance();
			builderFactory.setNamespaceAware(true);
			instance = builderFactory.newDocumentBuilder();
		}
		
		return instance;
	}
	
	private static XPathExpression expression;

	private static final String BINDING_EXPRESSION = "/*[local-name()='definitions']/*[local-name()='binding']/*[local-name()='binding']";

	private static XPathExpression getBindingExpression() throws XPathExpressionException {
		if(expression == null) {
			XPath xPath = XPathFactory.newInstance().newXPath();
			expression = xPath.compile(BINDING_EXPRESSION);
		}
		
		return expression;
	}
	
	public static PROTOCOLLO getProtocolloApi(byte[] wsdlBytes) throws Exception {
		WsdlUtils.getInfoFromWsdl(wsdlBytes);
		return PROTOCOLLO.WSDL11;
	}
	
	public enum BINDING {SOAP, SOAP11, SOAP12}
	
	public static BINDING getBindingApi(byte[] wsdlBytes) throws Exception {
		try(ByteArrayInputStream bais = new ByteArrayInputStream(wsdlBytes)) {
			Document xmlDocument = getDocumentBuilder().parse(bais);
	
			NodeList nodes = (NodeList) getBindingExpression().evaluate(xmlDocument, XPathConstants.NODESET);
	
			if(nodes.getLength() == 0) {
				throw new Exception("Nessun binding trovato");
			} else {
				boolean soap11found = false;
				boolean soap12found = false;
				for(int i = 0; i < nodes.getLength(); i++) {
					Node item = nodes.item(i);
					if(SOAP_11_NS.equals(item.getNamespaceURI())) {
						soap11found = true;
					}
					if(SOAP_12_NS.equals(item.getNamespaceURI())) {
						soap12found = true;
					}
				}
				
				if(soap11found && soap12found) {
					return BINDING.SOAP;
				} else if(soap12found) {
					return BINDING.SOAP12;
				} else if(soap11found) {
					return BINDING.SOAP11;
				} else {
					throw new Exception("Nessun binding trovato");
				}
			}
		}
	}
	
	public static List<String> getOperationFromWsdl(byte[] wsdlBytes) throws WSDLException, IOException {
		List<ServiceInfo> info = WsdlUtils.getInfoFromWsdl(wsdlBytes);
		List<String> operations = new ArrayList<>();
		
		for(ServiceInfo s: info) {
			for(OperationInfo o: s.getOperazioni().values()) {
				operations.add(s.getNome() + "." + o.getNome());
			}
		}
		
		return operations;
	}
	
	public static List<ServiceInfo> getInfoFromWsdl(byte[] wsdlBytes) throws WSDLException, IOException {
	   
		Definition wsdl = getDefinition(wsdlBytes);

	    Map<String, ServiceInfo> services = new HashMap<>();
		
		Map<?,?> bindings = wsdl.getAllBindings();
		
		if(bindings!=null && bindings.size()>0){

			Iterator<?> it = bindings.keySet().iterator();
			while(it.hasNext()){
				javax.xml.namespace.QName key = (javax.xml.namespace.QName) it.next();
				javax.wsdl.Binding binding = (javax.wsdl.Binding) bindings.get(key);
				String ptName = binding.getPortType().getQName().getLocalPart();
				
				logger.debug("Binding: " + binding.getQName().getLocalPart());
				// itero sulle operation
				for(int i=0; i<binding.getBindingOperations().size();i++){
					javax.wsdl.BindingOperation opWSDL = (javax.wsdl.BindingOperation) binding.getBindingOperations().get(i);

					List<?> extensions = opWSDL.getExtensibilityElements();
					String soapActionValue = null;
					SOAPVersion version = null;
					logger.debug("- Operation: " + opWSDL.getName());
					if (extensions != null) {
					    for (int j = 0; j < extensions.size() && soapActionValue == null; j++) {
					        ExtensibilityElement extElement = (ExtensibilityElement) extensions.get(j); 
					        logger.debug("- ExtElement: " + extElement.getElementType() + " class: " + extElement.getClass());
					        if (extElement instanceof SOAPOperation) {
					            SOAPOperation soapOp = (SOAPOperation) extElement;
					            
					            
						        logger.debug("- SOAPOperation: " + soapOp.getSoapActionURI());
					            soapActionValue = soapOp.getSoapActionURI();
					            version = SOAPVersion.SOAP11;
					        } else if(extElement instanceof SOAP12Operation) {
					            SOAP12Operation soapOp = (SOAP12Operation) extElement;
					            
					            
						        logger.debug("- SOAPOperation: " + soapOp.getSoapActionURI());
					            soapActionValue = soapOp.getSoapActionURI();
					            version = SOAPVersion.SOAP12;
					        }
					    }
					}

					String servK = ptName;
					
					ServiceInfo service = null;
					if(services.containsKey(servK)) {
						service = services.get(servK);
					} else {
						service = new ServiceInfo();
						service.setNome(servK);
						services.put(servK, service);
					}
					
					String opK = opWSDL.getName();
					OperationInfo operation = null;
					if(service.getOperazioni().containsKey(opK)) {
						operation = service.getOperazioni().get(opK);
					} else {
						operation = new OperationInfo();
						operation.setNome(opK);
						
						MessaggioType messaggio = opWSDL.getBindingOutput() != null ? MessaggioType.INPUT_OUTPUT: MessaggioType.INPUT;
						operation.setMessaggio(messaggio);
						service.getOperazioni().put(opK, operation);
					}
					
					SOAPAction soapAction = new SOAPAction();
					soapAction.setValue(soapActionValue);
					soapAction.setVersion(version);
					operation.getSoapActions().add(soapAction);
					
					
				}
				
			}
		}
		
		return services.entrySet().stream().map(o -> o.getValue()).collect(Collectors.toList());

	}

	private static Definition getDefinition(byte[] wsdlBytes) throws WSDLException, IOException {
		
		WSDLFactory factory = WSDLFactory.newInstance();
	    WSDLReader reader = factory.newWSDLReader();
	    
	    reader.setFeature("javax.wsdl.verbose", false);
	    reader.setFeature("javax.wsdl.importDocuments", false);
	    reader.setExtensionRegistry(new NoXSDExtensionRegistry());

	    try(ByteArrayInputStream bais = new ByteArrayInputStream(wsdlBytes)) {
		    Definition wsdl = reader.readWSDL(null, new InputSource(bais));
			return wsdl;
	    }
	}
}

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
package org.govway.catalogo.controllers;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.core.business.utils.OpenapiUtils;
import org.govway.catalogo.core.business.utils.OperationInfo;
import org.govway.catalogo.core.business.utils.SOAPAction;
import org.govway.catalogo.core.business.utils.SwaggerUtils;
import org.govway.catalogo.core.business.utils.WsdlUtils;
import org.govway.catalogo.core.services.DocumentoService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.api.ToolsApi;
import org.govway.catalogo.servlets.model.DocumentoApiInline;
import org.govway.catalogo.servlets.model.DocumentoApiRef;
import org.govway.catalogo.servlets.model.ListaRisorseApiRichiesta;
import org.govway.catalogo.servlets.model.MessaggioType;
import org.govway.catalogo.servlets.model.OperazioneWsdl;
import org.govway.catalogo.servlets.model.ServizioWsdl;
import org.govway.catalogo.servlets.model.TipoApiRisorsaEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

@ApiV1Controller
public class ToolsController implements ToolsApi {

	private Logger logger = LoggerFactory.getLogger(ToolsController.class);

	@Autowired
	private DocumentoService service;

	@Override
	public ResponseEntity<List<String>> listaRisorseApi(ListaRisorseApiRichiesta listaRisorseApiRichiesta) {
		
		try {
			this.logger.info("Invocazione in corso ...");     

			byte[] body = null;
			if(listaRisorseApiRichiesta.getDocument().getType().equals(TipoApiRisorsaEnum.INLINE)) {
				body = Base64.getDecoder().decode(((DocumentoApiInline)listaRisorseApiRichiesta.getDocument()).getDocument());
			} else {
				String uuid = ((DocumentoApiRef)listaRisorseApiRichiesta.getDocument()).getUuid();
				body = service.find(uuid)
						.orElseThrow(() -> new NotFoundException("Documento ["+uuid+"] non trovato"))
						.getRawData();
			}
			List<String> lst = null;
			switch(listaRisorseApiRichiesta.getApiType()) {
			case REST: lst = getProtocolInfoFromRest(body);
				break;
			case SOAP: lst = getProtocolInfoFromWsdl(body);
				break;
			default:
				break;}
			
			this.logger.info("Invocazione completata con successo");

			return ResponseEntity.ok(lst);
		} catch(Exception e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw new BadRequestException("Impossibile recuperare le informazioni sulle azioni/risorse dal descrittore fornito");
		}
	}
	
	private List<String> getProtocolInfoFromRest(byte[] restBytes) {
	    try {
	    	if(OpenapiUtils.isOpenapi(restBytes)) {
		    	List<String> collect = OpenapiUtils.getProtocolInfoFromOpenapi(restBytes).stream().map(i -> i.getOp() + " " + i.getPath()).collect(Collectors.toList());
				if(collect.isEmpty()) {
					throw new BadRequestException("Impossibile recuperare le informazioni sulle azioni/risorse dal descrittore fornito");
				}
		    	return collect;
	    	} else if(SwaggerUtils.isSwagger(restBytes)) {
		    	List<String> collect = SwaggerUtils.getProtocolInfoFromSwagger(restBytes).stream().map(i -> i.getOp() + " " + i.getPath()).collect(Collectors.toList());
				if(collect.isEmpty()) {
					throw new BadRequestException("Impossibile recuperare le informazioni sulle azioni/risorse dal descrittore fornito");
				}
				return collect;
	    	} else {
				throw new BadRequestException("Impossibile recuperare le informazioni sulle azioni/risorse dal descrittore fornito");
	    	}
	    	
	    } catch(Exception e) {
	    	this.logger.error("Errore durante la lettura delle operazioni dal descrittore REST: " + e.getMessage(), e);
	    	throw new BadRequestException(e);
	    }
	}
	
	private List<String> getProtocolInfoFromWsdl(byte[] wsdlBytes) {
	    try {
	    	return WsdlUtils.getOperationFromWsdl(wsdlBytes);
	    } catch(Exception e) {
	    	this.logger.error("Errore durante la lettura delle operazioni dal WSDL: " + e.getMessage(), e);
	    	throw new BadRequestException(e);
	    }
	}

	@Override
	public ResponseEntity<List<ServizioWsdl>> listaOperazioniWsdl(ListaRisorseApiRichiesta listaRisorseApiRichiesta) {
		
		try {
			this.logger.info("Invocazione in corso ...");     

			byte[] body = null;
			if(listaRisorseApiRichiesta.getDocument().getType().equals(TipoApiRisorsaEnum.INLINE)) {
				body = Base64.getDecoder().decode(((DocumentoApiInline)listaRisorseApiRichiesta.getDocument()).getDocument());
			} else {
				String uuid = ((DocumentoApiRef)listaRisorseApiRichiesta.getDocument()).getUuid();
				body = service.find(uuid)
						.orElseThrow(() -> new NotFoundException("Documento ["+uuid+"] non trovato"))
						.getRawData();
			}
			List<ServizioWsdl> lst = null;
			switch(listaRisorseApiRichiesta.getApiType()) {
			case REST: throw new BadRequestException("APIType REST non gestito");
			case SOAP: lst = WsdlUtils.getInfoFromWsdl(body).stream()
					.map(serv -> {
						ServizioWsdl servizioW = new ServizioWsdl();
						
						servizioW.setPortType(serv.getNome());

						List<OperazioneWsdl> operazioni = new ArrayList<>();

						for(OperationInfo op: serv.getOperazioni().values()) {
							OperazioneWsdl opW = new OperazioneWsdl();
							
							opW.setNome(op.getNome());
							
							opW.setSoapAction(op.getSoapActions().stream().findAny().orElse(new SOAPAction()).getValue());
							opW.setMessaggio(op.getMessaggio().equals(org.govway.catalogo.core.business.utils.OperationInfo.MessaggioType.INPUT) ? MessaggioType.INPUT: MessaggioType.INPUT_OUTPUT);
							operazioni.add(opW);
						}
						servizioW.setOperations(operazioni);
						
						
						
						return servizioW;
					}).collect(Collectors.toList());
					
			}
			
			this.logger.info("Invocazione completata con successo");

			return ResponseEntity.ok(lst);
		} catch(Exception e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw new BadRequestException("Impossibile recuperare le informazioni sulle azioni/risorse dal descrittore fornito");
		}
	}

}

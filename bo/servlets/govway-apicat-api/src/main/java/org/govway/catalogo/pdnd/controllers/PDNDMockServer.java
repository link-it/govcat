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
package org.govway.catalogo.pdnd.controllers;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.commons.io.IOUtils;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Agreement;
import org.govway.catalogo.servlets.pdnd.mockserver.model.AgreementState;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Agreements;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Attribute;
import org.govway.catalogo.servlets.pdnd.mockserver.model.AttributeSeed;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Attributes;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Client;
import org.govway.catalogo.servlets.pdnd.mockserver.model.EService;
import org.govway.catalogo.servlets.pdnd.mockserver.model.EServiceDescriptor;
import org.govway.catalogo.servlets.pdnd.mockserver.model.EServiceDescriptors;
import org.govway.catalogo.servlets.pdnd.mockserver.model.EServices;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Events;
import org.govway.catalogo.servlets.pdnd.mockserver.model.JWK;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Organization;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Purpose;
import org.govway.catalogo.servlets.pdnd.mockserver.model.Purposes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;

import com.fasterxml.jackson.databind.ObjectMapper;

public class PDNDMockServer {


	private Logger logger = LoggerFactory.getLogger(PDNDMockServer.class);


	private String prefix = "/pdnd/mock";
	private String environment;
	
	private String getPrefix() {
		return prefix + "/" + environment + "/";
	}
	
	public PDNDMockServer(String environment) {
		this.environment = environment;
	}
	
	private Map<String, Object> files = new HashMap<>();
    private <T> T readMockResponse(Class<T> valueType) {
    	return readMockResponse(valueType, null);
    }
    private Organization readMockResponseOrganization(UUID idOrganizzazione) {
    	Organization org = readMockResponse(Organization.class, null);

    	Map<Character, String> names = getNames();

    	org.setName(names.getOrDefault(idOrganizzazione.toString().charAt(0), "Comune A"));
    	
    	return org;
    }
    
	private Map<Character, String> getNames() {
        Map<Character, String> map = new HashMap<>();
        
        char startChar = 'a';
        for (int i = 0; i < 26; i++) {
            char key = (char) (startChar + i);
            String value = "Comune " + (i + 1);
            map.put(key, value);
        }

        return map;
	}

	private <T> T readMockResponse(Class<T> valueType, String suffix) {
    	try {
    		String truesuffix = suffix == null ? "" : "_" + suffix;
	    	String key = valueType.getSimpleName() + truesuffix + ".json";
	    	
	    	this.logger.debug("Cerco key: " + key);
	    	if(!files.containsKey(key)) {
	        	this.logger.debug("Key non trovata: " + key);
	    		InputStream is= null;
	    		try {
	    			is = PDNDClient.class.getResourceAsStream(getPrefix() + key);
	    			if(is != null) {
	    				ObjectMapper om = new ObjectMapper();
	    				byte[] value = IOUtils.toByteArray(is);
	    				
	    				Object obj = om.readValue(value, valueType);
						files.put(key, obj);
			        	this.logger.debug("Key aggiunta: " + key);
	    			} else {
	    	        	this.logger.debug("Risorsa "+getPrefix()+key+" non trovata");
	    			}
	    		} catch (Exception e) {
		        	this.logger.error("Errore durante la lettura della risorsa: " + e.getMessage(), e);
	    			try {
	    				if(is!=null) {
	    					is.close();
	    				}
	    			} catch(IOException ex) {}
	    		}
	    	}
	    	
	    	if(files.containsKey(key)) {
	        	this.logger.debug("Restituisco il file: " + key);
	        	return valueType.cast(files.get(key));
	    	} else {
	        	this.logger.debug("File "+key+" non trovato. Restituisco BadRequest");
	    		throw new BadRequestException(key);
	    	}
    	} catch(RuntimeException e) {
    		this.logger.error("Errore durante la getMockResponse: " + e.getMessage(), e);
    		throw e;
    	}
	}


	
	public ResponseEntity<Attribute> createCertifiedAttribute(AttributeSeed attributeSeed) {
		return ResponseEntity.ok(readMockResponse(Attribute.class));
	}

	
	public ResponseEntity<Agreement> getAgreement(UUID agreementId) {
		checkInput(agreementId);
		return ResponseEntity.ok(readMockResponse(Agreement.class));
	}

	
	private void checkInput(String id) {
		if(id == null) return;
		
		if(id.startsWith("eeeee400")) {
			throw new BadRequestException("ID ["+id+"]");
		}
		
		if(id.startsWith("eeeee404")) {
			throw new NotFoundException("ID ["+id+"]");
		}
		
		if(id.startsWith("eeeee500")) {
			throw new InternalException("ID ["+id+"]");
		}
	}
	
	private void checkInput(UUID id) {
		if(id == null) return;
		checkInput(id.toString());
	}

	private void checkInput(Long id) {
		if(id == null) return;
		
		if(id.longValue() == 40) {
			throw new BadRequestException("ID ["+id+"]");
		}
		
		if(id.longValue() == 44) {
			throw new NotFoundException("ID ["+id+"]");
		}
		
		if(id.longValue() == 50) {
			throw new InternalException("ID ["+id+"]");
		}
	}

	public ResponseEntity<Attributes> getAgreementAttributes(UUID agreementId) {
		checkInput(agreementId);
		return ResponseEntity.ok(readMockResponse(Attributes.class));
	}

	
	public ResponseEntity<Agreement> getAgreementByPurpose(UUID purposeId) {
		checkInput(purposeId);
		return ResponseEntity.ok(readMockResponse(Agreement.class));
	}

	
	public ResponseEntity<Purposes> getAgreementPurposes(UUID agreementId) {
		checkInput(agreementId);
		return ResponseEntity.ok(readMockResponse(Purposes.class));
	}

	
	public ResponseEntity<Agreements> getAgreements(UUID producerId, UUID consumerId,
			UUID eserviceId, UUID descriptorId, List<AgreementState> states) {
		checkInput(producerId);
		checkInput(consumerId);
		checkInput(descriptorId);
		return ResponseEntity.ok(readMockResponse(Agreements.class));
	}
	
	public ResponseEntity<Attribute> getAttribute(UUID attributeId) {
		checkInput(attributeId);
		return ResponseEntity.ok(readMockResponse(Attribute.class));
	}

	
	public ResponseEntity<Client> getClient(UUID clientId) {
		checkInput(clientId);
		return ResponseEntity.ok(readMockResponse(Client.class));
	}

	
	private boolean roundTrueEservice = false;
	public ResponseEntity<EService> getEService(UUID eserviceId) {
		checkInput(eserviceId);
		String suffix = roundTrueEservice ? "1": "0";
		roundTrueEservice = !roundTrueEservice;
		return ResponseEntity.ok(readMockResponse(EService.class, suffix));
	}

	
	public ResponseEntity<EServiceDescriptor> getEServiceDescriptor(UUID eserviceId, UUID descriptorId) {
		checkInput(eserviceId);
		checkInput(descriptorId);
		return ResponseEntity.ok(readMockResponse(EServiceDescriptor.class));
	}

	
	public ResponseEntity<EServiceDescriptors> getEServiceDescriptors(UUID eserviceId) {
		checkInput(eserviceId);
		return ResponseEntity.ok(readMockResponse(EServiceDescriptors.class));
	}

	
	public ResponseEntity<Events> getEservicesEventsFromId(Long lastEventId,
			Integer limit) {
		checkInput(lastEventId);
		return ResponseEntity.ok(readMockResponse(Events.class));
	}

	
	public ResponseEntity<Events> getEventsFromId(Long lastEventId,
			Integer limit) {
		checkInput(lastEventId);
		return ResponseEntity.ok(readMockResponse(Events.class));
	}

	
	public ResponseEntity<JWK> getJWKPublicKey(String kid) {
		checkInput(kid);
		return ResponseEntity.ok(readMockResponse(JWK.class));
	}

	
	public ResponseEntity<Events> getKeysEventsFromId(Long lastEventId,
			Integer limit) {
		checkInput(lastEventId);
		return ResponseEntity.ok(readMockResponse(Events.class));
	}

	
	public ResponseEntity<Organization> getOrganization(UUID organizationId) {
		checkInput(organizationId);
		return ResponseEntity.ok(readMockResponseOrganization(organizationId));
	}

	
	private boolean roundTrueEservices = false;
	public ResponseEntity<EServices> getOrganizationEServices(String origin, String externalId,
			String attributeOrigin, String attributeCode) {
		checkInput(origin);
		checkInput(externalId);
		checkInput(attributeOrigin);
		checkInput(attributeCode);
		String suffix = roundTrueEservices ? "1": "0";
		roundTrueEservices = !roundTrueEservices;
		return ResponseEntity.ok(readMockResponse(EServices.class, suffix));
	}

	
	public ResponseEntity<Purpose> getPurpose(UUID purposeId) {
		checkInput(purposeId);
		return ResponseEntity.ok(readMockResponse(Purpose.class));
	}

	
	public ResponseEntity<Void> revokeTenantAttribute(String origin, String externalId, String code) {
		return ResponseEntity.ok().build();
	}

	
	public ResponseEntity<Void> upsertTenant(String origin, String externalId, String code) {
		return ResponseEntity.ok().build();
	}
}

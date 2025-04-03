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
package org.govway.catalogo.core.business.utils.configurazione;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.util.FileCopyUtils;

import com.jayway.jsonpath.JsonPath;


public class ConfigurazioneReader {
    private static final Logger logger = LoggerFactory.getLogger(ConfigurazioneReader.class);

    
    static final String ERROR_STRING ="[ConfigurazioneReader] errore nella lettura del file di configurazione";
    
    String externalPath;
    
    public ConfigurazioneReader(String externalPath) {
        logger.debug("externalPath {}",externalPath);

    	this.externalPath = externalPath;
    }
    public String getConfigurazione() throws IOException {
		Resource resource = new FileSystemResource(this.externalPath+"/configurazione.json");
		if (resource.exists()) {
		    // Il file esiste
			logger.debug("File {} trovato!", this.externalPath+"/configurazione.json");
		} else {
		    // Il file non esiste
			logger.error("File {} NON trovato!", this.externalPath+"/configurazione.json");
		}

        try (InputStream inputStream = resource.getInputStream()) {

            byte[] fileData = FileCopyUtils.copyToByteArray(inputStream);
            return new String(fileData, StandardCharsets.UTF_8);
        }
    }
	
	
    public String getTipoGatewayConfigurazione() throws IOException {
        String configurazioneJson = null;
		try {
			configurazioneJson = getConfigurazione();
		} catch (IOException e) {
			logger.error(ERROR_STRING);
			throw new IOException(ERROR_STRING);
		}
        return JsonPath.parse(configurazioneJson).read("$.monitoraggio.profilo_govway_default", String.class);
    }
    

    public String getClasseDatoAdesione(String gruppo) throws IOException {
    	logger.info("Sono dentro alla getClasseDatoAdesione con gruppo {}", gruppo);

    	String configurazioneJson = null;
		try {
			configurazioneJson = getConfigurazione();
		} catch (IOException e) {
			logger.error(ERROR_STRING);
			throw new IOException(ERROR_STRING);
		}
     	String jsonPathQuery = String.format("$.adesione.proprieta_custom[?(@.nome_gruppo == '%s')].classe_dato", gruppo);
    	List<String> risultati = JsonPath.parse(configurazioneJson).read(jsonPathQuery);

    	if (risultati == null || risultati.isEmpty()) {
    		throw new IllegalArgumentException("Nessuna configurazione trovata per il gruppo: " + gruppo);
    	}

    	return risultati.get(0);
    }

    
    
    public String getClasseDatoApi( String gruppo) throws IOException {
        logger.info("sono dentro alla getClasseDatoApi con gruppo {}",gruppo);
   
        String configurazioneJson = null;
		try {
			configurazioneJson = getConfigurazione();
		} catch (IOException e) {
			logger.error(ERROR_STRING);
			throw new IOException(ERROR_STRING);
		}
        String jsonPathQuery = String.format("$.servizio.api.proprieta_custom[?(@.nome_gruppo == '%s')].classe_dato", gruppo);
    	List<String> risultati = JsonPath.parse(configurazioneJson).read(jsonPathQuery);

    	if (risultati == null || risultati.isEmpty()) {
			logger.error("Nessuna configurazione trovata per il gruppo: {}", gruppo);
    		throw new IllegalArgumentException("Nessuna configurazione trovata per il gruppo: " + gruppo);
    	}
    	return risultati.get(0);
    }
    
    
    public String getStatoConfigurazioneAutomatica(String statoInConfigurazione) throws IOException {
    	
    	String configurazioneJson = null;
		try {
			configurazioneJson = getConfigurazione();
		} catch (IOException e) {
			logger.error(ERROR_STRING);
			throw new IOException(ERROR_STRING);
		}
   //  	String jsonPathQuery = String.format("$.adesione.[?(@.configurazione_automatica == '%s')].stato_in_configurazione", statoInConfigurazione);
	  	String jsonPathQuery = String.format("$.adesione.configurazione_automatica");
		List<String> risultati = JsonPath.parse(configurazioneJson).read(jsonPathQuery);

    	if (risultati == null || risultati.isEmpty()) {
    		throw new IllegalArgumentException("Nessuna configurazione automatica trovata per lo stato di configurazione: " + statoInConfigurazione);
    	}

    	return risultati.get(0);
    	
    }
    
    public List<Map<String, String>> getTuttaConfigurazioneAutomatica() throws IOException {
        String configurazioneJson;
        try {
            configurazioneJson = getConfigurazione();
        } catch (IOException e) {
            logger.error(ERROR_STRING);
            throw new IOException(ERROR_STRING, e);
        }

        // JSONPath per ottenere tutta la configurazione automatica
        String jsonPathQuery = "$.adesione.configurazione_automatica";
        List<Map<String, String>> configurazioneAutomatica = JsonPath.parse(configurazioneJson).read(jsonPathQuery);

        if (configurazioneAutomatica == null || configurazioneAutomatica.isEmpty()) {
            throw new IllegalArgumentException("Nessuna configurazione automatica trovata.");
        }

        return configurazioneAutomatica;
    }

    
}

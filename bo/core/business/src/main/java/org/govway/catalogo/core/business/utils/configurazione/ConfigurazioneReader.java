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

import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.PathNotFoundException;


public class ConfigurazioneReader {
    private static final Logger logger = LoggerFactory.getLogger(ConfigurazioneReader.class);


    static final String ERROR_STRING ="[ConfigurazioneReader] errore nella lettura del file di configurazione";

    private static final String PATH_PROFILI_API = "$.servizio.api.profili";
    private static final String PATH_PROFILO_GATEWAY_DEFAULT = "$.soggetto.profilo_gateway_default";

    private static final String CAMPO_CODICE_INTERNO = "codice_interno";
    private static final String CAMPO_PROFILO_GOVWAY = "profilo_govway";
    private static final String CAMPO_PROPRIETA_TOKEN_POLICY = "proprieta_token_policy";
    private static final String CAMPO_NOME_GRUPPO = "nome_gruppo";
    private static final String CAMPO_NOME_PROPRIETA = "nome_proprieta";

    String configurazioneJsonPath;

    /** Documento parsato una sola volta: un reader vive il tempo di una singola operazione. */
    private DocumentContext documento;

    public ConfigurazioneReader(String configurazioneJsonPath) {
        logger.debug("configurazioneJsonPath {}",configurazioneJsonPath);

    	this.configurazioneJsonPath = configurazioneJsonPath;
    }

    /** Riferimento a una proprietà custom, nella forma {nome_gruppo, nome_proprieta}. */
    public record RiferimentoProprietaCustom(String nomeGruppo, String nomeProprieta) {}

    public String getConfigurazione() throws IOException {
		Resource resource = new FileSystemResource(this.configurazioneJsonPath);
		if (resource.exists()) {
		    // Il file esiste
			logger.debug("File {} trovato!", this.configurazioneJsonPath);
		} else {
		    // Il file non esiste
			logger.error("File {} NON trovato!", this.configurazioneJsonPath);
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


    private DocumentContext getDocumento() throws IOException {
        if (this.documento == null) {
            this.documento = JsonPath.parse(getConfigurazione());
        }
        return this.documento;
    }

    /**
     * Profilo di servizio.api.profili con il codice interno indicato, nullo se non configurato.
     * Il confronto avviene in Java e non con un filtro JSONPath per non interpolare il codice
     * interno, che arriva dal database, dentro l'espressione.
     */
    private Map<String, Object> getProfiloApi(String codiceInterno) throws IOException {
        if (codiceInterno == null) {
            return null;
        }

        List<Map<String, Object>> profili;
        try {
            profili = getDocumento().read(PATH_PROFILI_API);
        } catch (PathNotFoundException e) {
            logger.debug("nessun profilo configurato in {}", PATH_PROFILI_API);
            return null;
        }

        if (profili == null) {
            return null;
        }

        for (Map<String, Object> profilo : profili) {
            if (codiceInterno.equals(profilo.get(CAMPO_CODICE_INTERNO))) {
                return profilo;
            }
        }
        return null;
    }

    /**
     * Profilo di interoperabilità GovWay a cui è limitato il profilo di autenticazione indicato
     * (servizio.api.profili[].profilo_govway), nullo se il profilo non è configurato o non lo dichiara.
     */
    public String getProfiloGovwayProfilo(String codiceInterno) throws IOException {
        Map<String, Object> profilo = getProfiloApi(codiceInterno);
        if (profilo == null) {
            return null;
        }
        return getStringa(profilo.get(CAMPO_PROFILO_GOVWAY));
    }

    /**
     * Riferimento alla proprietà custom dell'API che contiene la token policy GovWay per il profilo
     * di autenticazione indicato (servizio.api.profili[].proprieta_token_policy), nullo se il profilo
     * non è configurato o non la referenzia.
     */
    public RiferimentoProprietaCustom getProprietaTokenPolicyProfilo(String codiceInterno) throws IOException {
        Map<String, Object> profilo = getProfiloApi(codiceInterno);
        if (profilo == null) {
            return null;
        }

        if (!(profilo.get(CAMPO_PROPRIETA_TOKEN_POLICY) instanceof Map<?, ?> riferimento)) {
            return null;
        }

        String nomeGruppo = getStringa(riferimento.get(CAMPO_NOME_GRUPPO));
        String nomeProprieta = getStringa(riferimento.get(CAMPO_NOME_PROPRIETA));

        if (nomeGruppo == null || nomeProprieta == null) {
            logger.warn("{} del profilo {} incompleto: {} e {} sono entrambi obbligatori",
                    CAMPO_PROPRIETA_TOKEN_POLICY, codiceInterno, CAMPO_NOME_GRUPPO, CAMPO_NOME_PROPRIETA);
            return null;
        }

        return new RiferimentoProprietaCustom(nomeGruppo, nomeProprieta);
    }

    /**
     * Profilo di interoperabilità di default dei soggetti (soggetto.profilo_gateway_default),
     * nullo se non configurato. È la stessa chiave usata da govcat-api per risolvere il profilo
     * di interoperabilità di un'API.
     */
    public String getProfiloGatewayDefaultSoggetto() throws IOException {
        try {
            return getStringa(getDocumento().read(PATH_PROFILO_GATEWAY_DEFAULT, String.class));
        } catch (PathNotFoundException e) {
            logger.debug("{} non configurato", PATH_PROFILO_GATEWAY_DEFAULT);
            return null;
        }
    }

    private static String getStringa(Object valore) {
        return valore instanceof String s && !s.isBlank() ? s : null;
    }

}

package org.govway.catalogo.core.business.utils.configurazione;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.util.FileCopyUtils;
import com.jayway.jsonpath.JsonPath;

public class ConfigurazioneReader {
    private static final Logger logger = LoggerFactory.getLogger(ConfigurazioneReader.class);

    static final String ERROR_STRING ="[ConfigurazioneReader] errore nella lettura del file di configurazione";
    static final String EXCEPTION_STRING ="Nessus client associato alla adesione con id";
    public String getConfigurazione() throws IOException {
        Resource resource = new ClassPathResource("/configurazione.json");
        
        logger.info("trovato file configurazione.json {}",resource.getFilename());
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
			throw new IOException(EXCEPTION_STRING);
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
			throw new IOException(EXCEPTION_STRING);
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
			throw new IOException(EXCEPTION_STRING);
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
			throw new IOException(EXCEPTION_STRING);
		}
     	String jsonPathQuery = String.format("$.adesione.[?(@.configurazione_automatica == '%s')].stato_in_configurazione", statoInConfigurazione);
    	List<String> risultati = JsonPath.parse(configurazioneJson).read(jsonPathQuery);

    	if (risultati == null || risultati.isEmpty()) {
    		throw new IllegalArgumentException("Nessuna configurazione automatica trovata per lo stato di configurazione: " + statoInConfigurazione);
    	}

    	return risultati.get(0);
    	
    }
    
}

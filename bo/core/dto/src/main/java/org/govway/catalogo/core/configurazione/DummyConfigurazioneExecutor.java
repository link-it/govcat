package org.govway.catalogo.core.configurazione;

import java.util.HashMap;
import java.util.Map;

import org.govway.catalogo.core.configurazione.AbstractEsitoConfigurazione.ESITO;
import org.govway.catalogo.core.dto.DTOAdesione;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;


public class DummyConfigurazioneExecutor implements IConfigurazioneExecutor {
    private static final Logger logger = LoggerFactory.getLogger(DummyConfigurazioneExecutor.class);

	@Override
	public EsitoConfigurazioneAdesione configura(ConfigurazioneAdesioneInput adesioneInput) {
		logger.info("stampaaaaaaaaaa:");

		EsitoConfigurazioneAdesione esito = new EsitoConfigurazioneAdesione();
		DTOAdesione a = adesioneInput.getAdesione();
		try {
			logger.info("stampaaaaaaaaaa:");
//			logger.info(a.getAmbienteConfigurazione());
			//			logger.info(a.getClients());
			//			logger.info(a.getEstensioni());

			stampaCampi(a);
		} catch (JsonProcessingException e) {
			logger.info("errore :"+e);

			// TODO Auto-generated catch block
			//e.printStackTrace();
		}
		esito.setEsito(ESITO.OK);
		esito.setMessaggioErrore("TUTTO OK");
		Map<String, String> map = new HashMap<>();
		map.put("chiave1", "valore1");
		map.put("chiave2", "valore2");
		map.put("chiave3", "valore3");
		map.put("chiave4", "valore4");

		esito.setChiaveRestituita(map);

		return esito;
	}

	public void stampaCampi(DTOAdesione a) throws JsonProcessingException {
		// Create ObjectMapper instance
		ObjectMapper objectMapper = new ObjectMapper();
		String json = null;
		// Serialize object to JSON
		json  = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(a);

		logger.info("stampa del contenuto del dto:");
		logger.info(json);
	}
}
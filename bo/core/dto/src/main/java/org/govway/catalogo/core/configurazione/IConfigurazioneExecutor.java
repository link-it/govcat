package org.govway.catalogo.core.configurazione;

public interface IConfigurazioneExecutor {

	public EsitoConfigurazioneAdesione configura(ConfigurazioneAdesioneInput adesione) throws ConfigurazioneException;
}

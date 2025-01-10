package org.govway.catalogo.core.configurazione;

import java.util.Map;

public class AbstractEsitoConfigurazione {

	public enum ESITO {OK,KO_TEMPORANEO,KO_DEFINITIVO}
	
	private ESITO esito;
	private String messaggioErrore;
	private Map<String,String> chiaveRestituita;
	
	public ESITO getEsito() {
		return esito;
	}
	public void setEsito(ESITO esito) {
		this.esito = esito;
	}
	public String getMessaggioErrore() {
		return messaggioErrore;
	}
	public void setMessaggioErrore(String messaggioErrore) {
		this.messaggioErrore = messaggioErrore;
	}
	public Map<String,String> getChiaveRestituita() {
		return chiaveRestituita;
	}
	public void setChiaveRestituita(Map<String,String> chiaveRestituita) {
		this.chiaveRestituita = chiaveRestituita;
	}
}

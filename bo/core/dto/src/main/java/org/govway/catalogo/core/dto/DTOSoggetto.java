package org.govway.catalogo.core.dto;

public class DTOSoggetto {

	private String nomeGateway;
	private String tipoGateway;

	public DTOSoggetto(String nomeGateway,String tipoGateway) {
		this.nomeGateway = nomeGateway;
		this.tipoGateway = tipoGateway;
	}

	public String getNomeGateway() {
		return nomeGateway;
	}
	public String getTipoGateway() {
		return tipoGateway;
	}
}
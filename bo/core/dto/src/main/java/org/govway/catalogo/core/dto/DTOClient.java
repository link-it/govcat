package org.govway.catalogo.core.dto;

public class DTOClient{
	private String nome;

	private String descrizione;

	private String authType;

	private String indirizzoIp;

	DTOClient(String nome,String descrizione,String authType,String indirizzoIp ) {
		this.nome = nome;
		this.descrizione = descrizione;
		this.authType = authType;
		this.indirizzoIp= indirizzoIp;
	}
	public String getNome() {
		return nome;
	}
	public String getDescrizione() {
		return descrizione;
	}

	public String getAuthType() {
		return authType;
	}
	public String getIndirizzoIp() {
		return indirizzoIp;
	}

}

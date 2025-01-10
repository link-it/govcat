package org.govway.catalogo.core.dto;


public class DTOBasicClient extends DTOClient {
	private String username;
	public DTOBasicClient(String nome, String descrizione,String authTypeString, String indirizzoIp,String username) {

			super(nome,descrizione,authTypeString,indirizzoIp);
			this.username = username;
	}
	
	String getUsername() {
		return this.username;
	}
}

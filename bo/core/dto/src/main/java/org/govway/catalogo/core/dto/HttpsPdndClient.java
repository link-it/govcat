package org.govway.catalogo.core.dto;

import java.util.UUID;

public class HttpsPdndClient extends DTOClient {

	private byte[] certificate;
	private String tipo;
	private UUID clientId;

	public HttpsPdndClient(String nomeClient, String descrizioneClient, String authTypeClient, String indirizzoIpClient, 
			byte[] certificate, String tipo, UUID clientId) {
		super(nomeClient, descrizioneClient, authTypeClient, indirizzoIpClient); 
		this.certificate = certificate;
		this.tipo = tipo;
		this.clientId = clientId;
	}

	public byte[] getOutCertificate() {
		return certificate;
	}

	public String getOutTipo() {
		return tipo;
	}

	public UUID getClientId() {
		return clientId;
	}
}

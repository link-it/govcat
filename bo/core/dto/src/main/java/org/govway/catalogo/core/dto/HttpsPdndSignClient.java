package org.govway.catalogo.core.dto;

import java.util.UUID;


public class HttpsPdndSignClient extends DTOClient {

    private byte[] outCertificate;
    private String outTipo;
    private byte[] signCertificate;
    private String signTipo;
    private UUID clientId;

    public HttpsPdndSignClient(String nomeClient, String descrizioneClient, String authTypeClient, String indirizzoIpClient,
    		byte[] outCertificate, String outTipo, byte[] signCertificate, String signTipo, UUID clientId) {
		super(nomeClient, descrizioneClient, authTypeClient, indirizzoIpClient); 
    	this.outCertificate = outCertificate;
        this.outTipo = outTipo;
        this.signCertificate = signCertificate;
        this.signTipo = signTipo;
        this.clientId = clientId;
    }

    public byte[] getOutCertificate() {
        return outCertificate;
    }

    public String getOutTipo() {
        return outTipo;
    }

    public byte[] getSignCertificate() {
        return signCertificate;
    }

    public String getSignTipo() {
        return signTipo;
    }

    public UUID getClientId() {
        return clientId;
    }
}

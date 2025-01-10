package org.govway.catalogo.core.dto;

public class PdndClient extends DTOClient {

    private String clientId;

    public PdndClient(String nomeClient, String descrizioneClient, String authTypeClient, 
                                    String indirizzoIpClient, String clientId) {
        super(nomeClient, descrizioneClient, authTypeClient, indirizzoIpClient);
        this.clientId = clientId;
    }

    public String getClientId() {
        return clientId;
    }
}

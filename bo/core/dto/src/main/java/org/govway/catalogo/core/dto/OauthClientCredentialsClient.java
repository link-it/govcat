package org.govway.catalogo.core.dto;

public class OauthClientCredentialsClient extends DTOClient {

    private String clientId;

    public OauthClientCredentialsClient(String nomeClient, String descrizioneClient, String authTypeClient, 
                                        String indirizzoIpClient, String clientId) {
        super(nomeClient, descrizioneClient, authTypeClient, indirizzoIpClient);
        this.clientId = clientId;
    }

    public String getClientId() {
        return clientId;
    }
}

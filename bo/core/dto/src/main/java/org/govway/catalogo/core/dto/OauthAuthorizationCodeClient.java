package org.govway.catalogo.core.dto;


public class OauthAuthorizationCodeClient extends DTOClient {

    private String clientId;
    private String redirectUri;
    private String uri;
    private String helpDesk;
    String nomeApplicazione;

    public OauthAuthorizationCodeClient(String nomeClient, String descrizioneClient, String authTypeClient, 
                                        String indirizzoIpClient, String clientId, String redirectUri,
                                        String uri,String nomeApplicazione,String helpDesk) {
        super(nomeClient, descrizioneClient, authTypeClient, indirizzoIpClient); 
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.uri = uri;
        this.helpDesk = helpDesk;
        this.nomeApplicazione = nomeApplicazione;
    }

	public String getClientId() {
        return clientId;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public String getUri() {
        return uri;
    }
    public String getHelpDesk() {
    	return helpDesk;
    }
    public String getNomeApplicazione() {
    	return nomeApplicazione;
    }
}
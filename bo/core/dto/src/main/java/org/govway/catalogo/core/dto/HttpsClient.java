package org.govway.catalogo.core.dto;

public class HttpsClient extends AbstractClientWithCertificate {

    public HttpsClient(String nomeClient, String descrizioneClient, String authTypeClient, 
                       String indirizzoIpClient, byte[] certificato, String tipo) {
        super(nomeClient, descrizioneClient, authTypeClient, indirizzoIpClient, certificato, tipo);
    }
}

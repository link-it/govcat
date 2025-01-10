package org.govway.catalogo.core.dto;

public class SignClient extends AbstractClientWithCertificate {

    public SignClient(String nomeClient, String descrizioneClient, String authTypeClient, 
                      String indirizzoIpClient, byte[] certificato, String tipo) {
        super(nomeClient, descrizioneClient, authTypeClient, indirizzoIpClient, certificato, tipo);
    }
}

package org.govway.catalogo.core.dto;

public abstract class AbstractClientWithCertificate extends DTOClient {
    private byte[] certificato;
    private String tipo;

    AbstractClientWithCertificate(String nomeClient, String descrizioneClient, String authTypeClient, 
                                         String indirizzoIpClient, byte[] certificato, String tipo) {
        super(nomeClient, descrizioneClient, authTypeClient, indirizzoIpClient);
        this.certificato = certificato;
        this.tipo = tipo;
    }

    public byte[] getCertificato() {
        return certificato;
    }

    public String getTipo() {
        return tipo;
    }
}
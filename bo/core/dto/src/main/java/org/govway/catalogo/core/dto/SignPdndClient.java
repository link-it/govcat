package org.govway.catalogo.core.dto;

import java.util.UUID;

public class SignPdndClient extends DTOClient {

    private byte[] certificate;
    private String tipo;
    private UUID clientId;

    public SignPdndClient(String nomeClient, String descrizioneClient, String authTypeClient,
                          String indirizzoIpClient, byte[] certificate, String tipo, UUID clientId) {
        super(nomeClient, descrizioneClient, authTypeClient, indirizzoIpClient);
        this.certificate = certificate;
        this.tipo = tipo;
        this.clientId = clientId;
    }

    public byte[] getCertificate() {
        return certificate;
    }

    public String getTipo() {
        return tipo;
    }

    public UUID getClientId() {
        return clientId;
    }
}

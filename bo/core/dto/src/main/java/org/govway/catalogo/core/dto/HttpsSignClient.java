package org.govway.catalogo.core.dto;

public class HttpsSignClient extends DTOClient {

    private byte[] outCertificate;
    private String outTipo;
    private byte[] signCertificate;
    private String signTipo;

    public HttpsSignClient(String nomeClient, String descrizioneClient, String authTypeClient, String indirizzoIpClient,
                           byte[] outCertificate, String outTipo, byte[] signCertificate, String signTipo) {
        super(nomeClient, descrizioneClient, authTypeClient, indirizzoIpClient);
        this.outCertificate = outCertificate;
        this.outTipo = outTipo;
        this.signCertificate = signCertificate;
        this.signTipo = signTipo;
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
}

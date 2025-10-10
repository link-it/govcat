package testsuite;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.io.IOException;
import java.util.*;

import org.govway.catalogo.core.business.utils.configurazione.ConfigurazioneReader;
import org.govway.catalogo.core.dto.*;
import org.govway.catalogo.core.orm.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import batch.AdesioneDTOConverter;
import batch.SoggettoDTOFactory;

@ExtendWith(MockitoExtension.class)
public class AdesioneDTOConverterTest {

    @Mock
    private SoggettoDTOFactory soggettoDTOFactory;

    private AdesioneEntity adesione;
    private AdesioneDTOConverter converter;
    private DTOAdesione dto;

    @BeforeEach
    void setup() {
        adesione = new AdesioneEntity();
        adesione.setId((long) 1);

        ServizioEntity servizio = new ServizioEntity();
        servizio.setApi(new HashSet<>());
        DominioEntity dominio = new DominioEntity();
        SoggettoEntity soggettoReferente = new SoggettoEntity();
        dominio.setSoggettoReferente(soggettoReferente);
        servizio.setDominio(dominio);
        adesione.setServizio(servizio);

        adesione.setClient(new HashSet<>());
        adesione.setEstensioni(new ArrayList<>());

        SoggettoEntity soggettoAderente = new SoggettoEntity();
        adesione.setSoggetto(soggettoAderente);

        DTOClient client = new DTOBasicClient(null, null, null, null, null);

        
        /*
        dto = new DTOAdesione(
                List.of(new DTOApi(null, null, null, null, null, null)),
                Map.of("chiave", "valore"),
                new DTOSoggetto("Erogatore", "tipo"),
                new DTOSoggetto("Aderente", "tipo"),
                new DTOSoggetto("Fruitore", "tipo"),
                AmbienteEnum.COLLAUDO,
                List.of(client),
                "collaudo_ready"
                );
         */
        //converter = new AdesioneDTOConverter(adesione, "config-path");
        converter.setDto(dto);
    }
/*
    @Test
    void testSetDtoAndGetDto() {
        DTOAdesione newDto = new DTOAdesione();
        converter.setDto(newDto);
        assertSame(newDto, converter.getDto());
    }

    @Test
    void testSetSoggetti() {
        when(soggettoDTOFactory.getNomeGateway(any())).thenReturn("nome");
        when(soggettoDTOFactory.getTipoGateway(any())).thenReturn("tipo");

        converter.setSoggetti();

        assertEquals("nome", dto.getSoggettoErogatore().getNome());
        assertEquals("tipo", dto.getSoggettoErogatore().getTipo());
        assertEquals("nome", dto.getSoggettoAderente().getNome());
        assertEquals("tipo", dto.getSoggettoAderente().getTipo());
    }

    @Test
    void testGetAmbienteCollaudo() throws Exception {
        adesione.setStato("collaudo_ready");
        converter.getAmbiente();
        assertEquals(AmbienteEnum.COLLAUDO, converter.ambienteConfigurazione);
    }

    @Test
    void testGetAmbienteProduzione() throws Exception {
        adesione.setStato("produzione_ready");
        converter.getAmbiente();
        assertEquals(AmbienteEnum.PRODUZIONE, converter.ambienteConfigurazione);
    }

    @Test
    void testGetAmbienteException() {
        adesione.setStato("boh");
        assertThrows(ProcessingException.class, () -> converter.getAmbiente());
    }

    @Test
    void testSetEstensioniAdesioneEmpty() throws Exception {
        adesione.setEstensioni(null);
        Map<String, String> result = converter.setEstensioniAdesione(null, 0);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetClientFromClientAdesioneSuccess() throws Exception {
        ClientEntity client = new ClientEntity();
        ClientAdesioneEntity ca = new ClientAdesioneEntity();
        ca.setProfilo("TEST");
        ca.setAmbiente(AmbienteEnum.COLLAUDO);
        ca.setClient(client);
        adesione.setClient(Set.of(ca));
        converter.ambienteConfigurazione = AmbienteEnum.COLLAUDO;

        ClientEntity result = converter.getClientFromClientAdesione(adesione.getClient(), "TEST");
        assertSame(client, result);
    }

    @Test
    void testGetClientFromClientAdesioneError() {
        adesione.setClient(Set.of());
        converter.ambienteConfigurazione = AmbienteEnum.COLLAUDO;
        assertThrows(ProcessingException.class, () -> converter.getClientFromClientAdesione(adesione.getClient(), "PROFILO"));
    }

    @Test
    void testAddBasicClient() {
        ClientEntity client = new ClientEntity();
        client.setNome("client");
        client.setDescrizione("descr");
        client.setAuthType(ClientEntity.AuthType.HTTP_BASIC);
        client.setIndirizzoIp("127.0.0.1");

        EstensioneClientEntity ext = new EstensioneClientEntity();
        ext.setNome("username");
        ext.setValore("user1");
        client.setEstensioni(List.of(ext));

        ClientAdesioneEntity ca = new ClientAdesioneEntity();
        ca.setClient(client);

        converter.clients = new ArrayList<>();
        converter.processClientAdesione(ca);

        assertEquals(1, converter.clients.size());
        assertTrue(converter.clients.get(0) instanceof DTOBasicClient);
    }

    @Test
    void testAddOauthClientCredentialsClient() {
        ClientEntity client = new ClientEntity();
        client.setNome("client");
        client.setDescrizione("desc");
        client.setAuthType(ClientEntity.AuthType.OAUTH_CLIENT_CREDENTIALS);
        client.setIndirizzoIp("ip");

        EstensioneClientEntity ext = new EstensioneClientEntity();
        ext.setNome("client_id");
        ext.setValore("00000000-0000-0000-0000-000000000001");
        client.setEstensioni(List.of(ext));

        ClientAdesioneEntity ca = new ClientAdesioneEntity();
        ca.setClient(client);

        converter.clients = new ArrayList<>();
        converter.processClientAdesione(ca);

        assertEquals(1, converter.clients.size());
        assertTrue(converter.clients.get(0) instanceof OauthClientCredentialsClient);
    }

    @Test
    void testAddSignClient() {
        ClientEntity client = new ClientEntity();
        client.setNome("signClient");
        client.setDescrizione("desc");
        client.setAuthType(ClientEntity.AuthType.SIGN);
        client.setIndirizzoIp("ip");

        DocumentoEntity doc = new DocumentoEntity();
        doc.setRawData(new byte[]{1, 2, 3});
        doc.setTipo("pdf");

        EstensioneClientEntity ext = new EstensioneClientEntity();
        ext.setNome("firma_CERTIFICATO");
        ext.setDocumento(doc);

        client.setEstensioni(List.of(ext));
        ClientAdesioneEntity ca = new ClientAdesioneEntity();
        ca.setClient(client);

        converter.clients = new ArrayList<>();
        converter.processClientAdesione(ca);

        assertEquals(1, converter.clients.size());
        assertTrue(converter.clients.get(0) instanceof SignClient);
    }

    @Test
    void testAddPdndClient() {
        ClientEntity client = new ClientEntity();
        client.setNome("pdnd");
        client.setDescrizione("desc");
        client.setAuthType(ClientEntity.AuthType.PDND);
        client.setIndirizzoIp("ip");

        EstensioneClientEntity ext = new EstensioneClientEntity();
        ext.setNome("client_id");
        ext.setValore("client-id-value");

        client.setEstensioni(List.of(ext));

        ClientAdesioneEntity ca = new ClientAdesioneEntity();
        ca.setClient(client);

        converter.clients = new ArrayList<>();
        converter.processClientAdesione(ca);

        assertEquals(1, converter.clients.size());
        assertTrue(converter.clients.get(0) instanceof PdndClient);
    }

    @Test
    void testAddHttpsClient() {
        ClientEntity client = new ClientEntity();
        client.setNome("httpsClient");
        client.setDescrizione("desc");
        client.setAuthType(ClientEntity.AuthType.HTTPS);
        client.setIndirizzoIp("ip");

        DocumentoEntity doc = new DocumentoEntity();
        doc.setRawData(new byte[]{4, 5, 6});
        doc.setTipo("p7b");

        EstensioneClientEntity ext = new EstensioneClientEntity();
        ext.setNome("tls_CERTIFICATO_CA");
        ext.setDocumento(doc);

        client.setEstensioni(List.of(ext));

        ClientAdesioneEntity ca = new ClientAdesioneEntity();
        ca.setClient(client);

        converter.clients = new ArrayList<>();
        converter.processClientAdesione(ca);

        assertEquals(1, converter.clients.size());
        assertTrue(converter.clients.get(0) instanceof HttpsClient);
    }

    @Test
    void testAddHttpsSignClient() {
        ClientEntity client = new ClientEntity();
        client.setNome("httpsSignClient");
        client.setDescrizione("desc");
        client.setAuthType(ClientEntity.AuthType.HTTPS_SIGN);
        client.setIndirizzoIp("ip");

        DocumentoEntity docSign = new DocumentoEntity();
        docSign.setRawData(new byte[]{1});
        docSign.setTipo("pdf");
        EstensioneClientEntity extSign = new EstensioneClientEntity();
        extSign.setNome("firma_CERTIFICATO");
        extSign.setDocumento(docSign);

        DocumentoEntity docTls = new DocumentoEntity();
        docTls.setRawData(new byte[]{2});
        docTls.setTipo("p7b");
        EstensioneClientEntity extTls = new EstensioneClientEntity();
        extTls.setNome("tls_CERTIFICATO_CA");
        extTls.setDocumento(docTls);

        client.setEstensioni(List.of(extSign, extTls));

        ClientAdesioneEntity ca = new ClientAdesioneEntity();
        ca.setClient(client);

        converter.clients = new ArrayList<>();
        converter.processClientAdesione(ca);

        assertEquals(1, converter.clients.size());
        assertTrue(converter.clients.get(0) instanceof HttpsSignClient);
    }

    @Test
    void testAddSignPdndClient() {
        ClientEntity client = new ClientEntity();
        client.setNome("signPdndClient");
        client.setDescrizione("desc");
        client.setAuthType(ClientEntity.AuthType.SIGN_PDND);
        client.setIndirizzoIp("ip");

        DocumentoEntity doc = new DocumentoEntity();
        doc.setRawData(new byte[]{1});
        doc.setTipo("pdf");
        EstensioneClientEntity ext = new EstensioneClientEntity();
        ext.setNome("firma_CERTIFICATO");
        ext.setDocumento(doc);

        EstensioneClientEntity extClientId = new EstensioneClientEntity();
        extClientId.setNome("client_id");
        extClientId.setValore("pdnd-client-id");

        client.setEstensioni(List.of(ext, extClientId));

        ClientAdesioneEntity ca = new ClientAdesioneEntity();
        ca.setClient(client);

        converter.clients = new ArrayList<>();
        converter.processClientAdesione(ca);

        assertEquals(1, converter.clients.size());
        assertTrue(converter.clients.get(0) instanceof SignPdndClient);
    }

    @Test
    void testAddHttpsPdndClient() {
        ClientEntity client = new ClientEntity();
        client.setNome("httpsPdndClient");
        client.setDescrizione("desc");
        client.setAuthType(ClientEntity.AuthType.HTTPS_PDND);
        client.setIndirizzoIp("ip");

        DocumentoEntity doc = new DocumentoEntity();
        doc.setRawData(new byte[]{1});
        doc.setTipo("p7b");
        EstensioneClientEntity ext = new EstensioneClientEntity();
        ext.setNome("tls_CERTIFICATO_CA");
        ext.setDocumento(doc);

        EstensioneClientEntity extClientId = new EstensioneClientEntity();
        extClientId.setNome("client_id");
        extClientId.setValore("pdnd-client-id");

        client.setEstensioni(List.of(ext, extClientId));

        ClientAdesioneEntity ca = new ClientAdesioneEntity();
        ca.setClient(client);

        converter.clients = new ArrayList<>();
        converter.processClientAdesione(ca);

        assertEquals(1, converter.clients.size());
        assertTrue(converter.clients.get(0) instanceof HttpsPdndClient);
    }
    */
} 

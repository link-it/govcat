package testsuite;

import org.govway.catalogo.core.business.utils.ConfigurazioneEService;
import org.govway.catalogo.core.business.utils.EServiceBuilder;
import org.govway.catalogo.core.business.utils.SchedaAdesioneBuilder;
import org.govway.catalogo.core.business.utils.StampeLabels;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneEntity.STATO_CONFIGURAZIONE;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity.AuthType;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.ErogazioneEntity;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.PackageServizioEntity;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity;
import org.govway.catalogo.core.orm.entity.ReferenteServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.stampe.StampePdf;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import java.io.ByteArrayInputStream;
import java.security.cert.CertificateFactory;
import java.util.*;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.security.*;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Date;

import org.bouncycastle.x509.X509V3CertificateGenerator;

@ExtendWith(MockitoExtension.class)
public class SchedaAdesioneBuilderTest {

    @Mock ConfigurazioneEService configurazione;
    @Mock EServiceBuilder serviceBuilder;
    @Spy StampeLabels stampeLabels = new StampeLabels();
    @InjectMocks SchedaAdesioneBuilder builder;

    AdesioneEntity adesione;
    ServizioEntity servizio;

    @BeforeAll
    static void initStampePdf() {
        // Initialize StampePdf singleton before running tests
        StampePdf.init();
    }

    @BeforeEach
    void setupBase() throws Exception {
        adesione = new AdesioneEntity();
        servizio = new ServizioEntity();
        adesione.setServizio(servizio);

        // Stato + date + id
        adesione.setStato("bozza");
        adesione.setDataCreazione(new Date());
        adesione.setIdLogico("LOG123");

        // Config simulata
        lenient().when(configurazione.getStatiSchedaAdesione())
           .thenReturn(Set.of("bozza","pubblicato_produzione_senza_collaudo"));
        Map<String, String> profili = new HashMap<>();
        profili.put("profilo1", "Descrizione Profilo 1");
        lenient().when(configurazione.getProfili()).thenReturn(profili);
        String logoFinto = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";
        lenient().when(configurazione.getPdfLogo()).thenReturn(logoFinto);

        // Soggetto + Organizzazione + referenti
        OrganizzazioneEntity org = new OrganizzazioneEntity();
        org.setNome("OrgX");
        SoggettoEntity sog = new SoggettoEntity();
        sog.setNome("SogX");
        sog.setOrganizzazione(org);
        org.setSoggetti(Set.of(sog));
        adesione.setSoggetto(sog);

        UtenteEntity utente = new UtenteEntity();
        utente.setNome("Mario");
        utente.setCognome("Rossi");
        adesione.setRichiedente(utente);

        ReferenteAdesioneEntity refA = new ReferenteAdesioneEntity();
        refA.setTipo(TIPO_REFERENTE.REFERENTE);
        UtenteEntity uA = new UtenteEntity();
        uA.setNome("RefA"); uA.setCognome("A"); uA.setEmailAziendale("a@a"); uA.setTelefonoAziendale("111");
        refA.setReferente(uA);
        adesione.setReferenti(Set.of(refA));

        adesione.setIdAdesione("idAdesione");
        
        UtenteEntity utente2 = new UtenteEntity();
        utente2.setNome("MarioBis");
        utente2.setCognome("RossiBis");
        adesione.setUtenteUltimaModifica(utente2);
        
        adesione.setTentativi(3);
        
        adesione.setStatoConfigurazione(STATO_CONFIGURAZIONE.OK);
        
        adesione.setMessaggioConfigurazione("messaggio");
        
        //adesione.setAdesioneCollaudo(null);
        
        // Servizio referenti
        ReferenteServizioEntity refS = new ReferenteServizioEntity();
        refS.setTipo(TIPO_REFERENTE.REFERENTE_TECNICO);
        UtenteEntity uS = new UtenteEntity();
        uS.setNome("RefS"); uS.setCognome("S"); uS.setEmailAziendale("s@s"); uS.setTelefonoAziendale("222");
        refS.setReferente(uS);
        servizio.setReferenti(Set.of(refS));
    }

    @Test
    void testSimplePdfGeneration() throws Exception {
        byte[] pdf = builder.getSchedaAdesione(adesione);
        assertNotNull(pdf);
        assertTrue(pdf.length > 10);
    }

    @Test
    void testServizioPackageHandling() throws Exception {
        // prepara pacchetto con API
        servizio.set_package(true);
        ServizioEntity subServ = new ServizioEntity();
        subServ.setApi(Set.of(apiEntity("Api1",1,"EROGATO_SOGGETTO_DOMINIO")));
        PackageServizioEntity pkg = new PackageServizioEntity();
        pkg.setServizio(subServ);
        servizio.setComponenti(Set.of(pkg));
        lenient().when(serviceBuilder.getUrlInvocazione(any(), eq(true))).thenReturn("COLLAUDO_URL");
        lenient().when(serviceBuilder.getUrlInvocazione(any(), eq(false))).thenReturn("PROD_URL");

        byte[] pdf = builder.getSchedaAdesione(adesione);
        assertNotNull(pdf);
    }

    @Test
    void testClientAuthTypesAndEnvironments() throws Exception {
        // Client con auth HTTPS
        ClientAdesioneEntity c = new ClientAdesioneEntity();
        ClientEntity ce = new ClientEntity();
        ce.setNome("C1");
        ce.setAmbiente(AmbienteEnum.COLLAUDO);
        ce.setAuthType(AuthType.HTTPS);
        EstensioneClientEntity ext = new EstensioneClientEntity();
        ext.setNome("autenticazione_CERTIFICATO");
        ext.setDocumento(mockDocumentoWithCert("CN=Test"));
        ce.setEstensioni(Set.of(ext));
        c.setClient(ce);
        c.setProfilo("A");
        adesione.setClient(Set.of(c));

        byte[] pdf = builder.getSchedaAdesione(adesione);
        assertNotNull(pdf);
    }

    @Test
    void testErogazioniAndUrls() throws Exception {
        ApiEntity api = apiEntity("ErogApi",2,"EROGATO_SOGGETTO_DOMINIO");
        servizio.setApi(Set.of(api));
        ErogazioneEntity e = new ErogazioneEntity();
        e.setApi(api);
        e.setUrl("http://test");
        e.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesione.setErogazioni(Set.of(e));

        lenient().when(serviceBuilder.getUrlInvocazione(api,true)).thenReturn("URL_COLL");
        lenient().when(serviceBuilder.getUrlInvocazione(api,false)).thenReturn("URL_PROD");

        byte[] pdf = builder.getSchedaAdesione(adesione);
        assertNotNull(pdf);
    }


    private ApiEntity apiEntity(String name, Integer version, String role) {
        ApiEntity a = new ApiEntity();
        a.setNome(name);
        a.setVersione(version);
        a.setRuolo(RUOLO.valueOf(role));
        AuthTypeEntity auth = new AuthTypeEntity();
        auth.setProfilo("B");
        auth.setResources(new byte[0]); // fittizio
        auth.setApi(a);

        a.setAuthType(List.of(auth));
        return a;
    }

    private DocumentoEntity mockDocumentoWithCert(String subjectDN) throws Exception {
        byte[] der = generateSelfSignedDer(subjectDN);
        DocumentoEntity doc = new DocumentoEntity();
        doc.setRawData(der);
        return doc;
    }


	@SuppressWarnings("deprecation")
	private byte[] generateSelfSignedDer(String subjectDN) throws Exception {
	    KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
	    keyGen.initialize(2048);
	    KeyPair keyPair = keyGen.generateKeyPair();
	
	    // Costruisce certificato autofirmato con BouncyCastle
	    X509V3CertificateGenerator certGen = new X509V3CertificateGenerator();
	    certGen.setSerialNumber(BigInteger.valueOf(System.currentTimeMillis()));
	    certGen.setIssuerDN(new javax.security.auth.x500.X500Principal(subjectDN));
	    certGen.setSubjectDN(new javax.security.auth.x500.X500Principal(subjectDN));
	    certGen.setNotBefore(new Date(System.currentTimeMillis() - 1000L * 60 * 60));
	    certGen.setNotAfter(new Date(System.currentTimeMillis() + 1000L * 60 * 60 * 24 * 365));
	    certGen.setPublicKey(keyPair.getPublic());
	    certGen.setSignatureAlgorithm("SHA256withRSA");
	
	    X509Certificate cert = certGen.generate(keyPair.getPrivate());
	
	    return cert.getEncoded(); // DER format
	}
}

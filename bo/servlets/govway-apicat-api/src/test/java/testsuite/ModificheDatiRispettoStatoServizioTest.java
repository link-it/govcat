/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.codec.binary.Base64;
import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.GruppiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.API;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteUpdate;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.ApiUpdate;
import org.govway.catalogo.servlets.model.DatiSpecificaApiUpdate;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.DocumentoUpdate.TipoDocumentoEnum;
import org.govway.catalogo.servlets.model.DocumentoUpdateNew;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.IdentificativoServizioUpdate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.ServizioUpdate;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.StatoUtenteEnum;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.TipoServizio;
import org.govway.catalogo.servlets.model.Utente;
import org.govway.catalogo.servlets.model.UtenteUpdate;
import org.govway.catalogo.servlets.model.VisibilitaDominioEnum;
import org.govway.catalogo.servlets.model.VisibilitaServizioEnum;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.groovy.template.GroovyTemplateAutoConfiguration;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ExtendWith(SpringExtension.class)  // JUnit 5 extension
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
public class ModificheDatiRispettoStatoServizioTest {
	private static final String UTENTE_QUALSIASI = "utente_qualsiasi";
	private static final String UTENTE_RICHIEDENTE_SERVIZIO = "utente_richiedente_servizio";
	private static final String UTENTE_REFERENTE_SERVIZIO = "utente_referente__servizio";
	private static final String UTENTE_REFERENTE_TECNICO_SERVIZIO = "utente_referente_tecnico__servizio";
	private static final String UTENTE_REFERENTE_DOMINIO = "utente_referente__dominio";
	private static final String UTENTE_REFERENTE_TECNICO_DOMINIO = "utente_referente_tecnico__dominio";
    private static final String UTENTE_GESTORE = "gestore";
    
    private static UUID ID_UTENTE_QUALSIASI;
	private static UUID ID_UTENTE_RICHIEDENTE_SERVIZIO;
	private static UUID ID_UTENTE_REFERENTE_SERVIZIO;
	private static UUID ID_UTENTE_REFERENTE_TECNICO_SERVIZIO;
	private static UUID ID_UTENTE_REFERENTE_DOMINIO;
	private static UUID ID_UTENTE_REFERENTE_TECNICO_DOMINIO;
    private static UUID ID_UTENTE_GESTORE;
    
	private static final String STATO_RICHIESTO_IN_COLLAUDO = "richiesto_collaudo";
	private static final String STATO_AUTORIZZATO_IN_COLLAUDO = "autorizzato_collaudo";
	private static final String STATO_IN_CONFIGURAZIONE_COLLAUDO = "in_configurazione_collaudo";
	private static final String STATO_PUBBLICATO_IN_COLLAUDO = "pubblicato_collaudo";
	private static final String STATO_RICHIESTO_IN_PRODUZIONE = "richiesto_produzione";
	private static final String STATO_AUTORIZZATO_IN_PRODUZIONE = "autorizzato_produzione";
	private static final String STATO_IN_CONFIGURAZIONE_PRODUZIONE = "in_configurazione_produzione";
	private static final String STATO_PUBBLICATO_IN_PRODUZIONE = "pubblicato_produzione";
    
    private static final String NOME_GRUPPO = "Gruppo xyz";
    
    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Autowired
    private UtenteService utenteService;
    
    @Autowired
    private ServiziController serviziController;

    @Autowired
    private GruppiController gruppiController;

    @Autowired
    private APIController apiController;

    @Autowired
    private OrganizzazioniController organizzazioniController;

    @Autowired
    private SoggettiController soggettiController;

    @Autowired
    private DominiController dominiController;
    
    @Autowired
    private UtentiController utentiController;
    
    @Autowired
    private AdesioniController adesioniController;

    private UUID idServizio;
    private UUID idOrganizzazione;
    
    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);  // Inizializza i mock con JUnit 5
        SecurityContextHolder.setContext(securityContext);
        
        InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_GESTORE, utenteService);
        ID_UTENTE_GESTORE = info.utente.getIdUtente();
        
        info = CommonUtils.getInfoProfilo(UTENTE_QUALSIASI, utenteService);
        ID_UTENTE_QUALSIASI = info.utente.getIdUtente();
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_DOMINIO, utenteService);
        ID_UTENTE_REFERENTE_DOMINIO = info.utente.getIdUtente();
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_SERVIZIO, utenteService);
        ID_UTENTE_REFERENTE_SERVIZIO = info.utente.getIdUtente();
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO_DOMINIO, utenteService);
        ID_UTENTE_REFERENTE_TECNICO_DOMINIO = info.utente.getIdUtente();
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO_SERVIZIO, utenteService);
        ID_UTENTE_REFERENTE_TECNICO_SERVIZIO = info.utente.getIdUtente();
        
        info = CommonUtils.getInfoProfilo(UTENTE_RICHIEDENTE_SERVIZIO, utenteService);
        ID_UTENTE_RICHIEDENTE_SERVIZIO = info.utente.getIdUtente();
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }
    
    public void setIdServizio(UUID id) {
        this.idServizio = id;
    }
    
    public void setIdOrganizazione(UUID id) {
    	this.idOrganizzazione = id;
    }
    
    ResponseEntity<Organizzazione> response;
    ResponseEntity<Soggetto> createdSoggetto;
    ResponseEntity<Utente> responseUtente;
    ResponseEntity<Gruppo> responseGruppo;
    DocumentoCreate immagine = new DocumentoCreate();
    UUID idSoggetto;
    
    public Dominio getDominio(VisibilitaServizioEnum value) {
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setEsterna(false);

        response = organizzazioniController.createOrganizzazione(organizzazione);
        this.setIdOrganizazione(response.getBody().getIdOrganizzazione());
        assertNotNull(response.getBody().getIdOrganizzazione());
        
        //associo l'utente all'Organizzazione
        UtenteUpdate upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_REFERENTE_DOMINIO);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("referente");
        upUtente.setCognome("dominio");
        upUtente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);

        utentiController.updateUtente(ID_UTENTE_REFERENTE_DOMINIO, upUtente);
        
        upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_GESTORE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("gestore");
        upUtente.setRuolo(RuoloUtenteEnum.GESTORE);

        utentiController.updateUtente(ID_UTENTE_GESTORE, upUtente);
        
        upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_REFERENTE_SERVIZIO);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("referente_servizio");
        upUtente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);

        utentiController.updateUtente(ID_UTENTE_REFERENTE_SERVIZIO, upUtente);
        
        upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_RICHIEDENTE_SERVIZIO);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_servizio");

        utentiController.updateUtente(ID_UTENTE_RICHIEDENTE_SERVIZIO, upUtente);

        
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome("nome_soggetto");
        soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
        soggettoCreate.setAderente(true);
        soggettoCreate.setReferente(true);

        createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
        idSoggetto = createdSoggetto.getBody().getIdSoggetto();
        assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

        GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
        gruppoCreate.setNome(NOME_GRUPPO);
        responseGruppo = gruppiController.createGruppo(gruppoCreate);
        assertEquals(HttpStatus.OK, responseGruppo.getStatusCode());

        DominioCreate dominio = CommonUtils.getDominioCreate();
        if(value!=null) {
        	VisibilitaDominioEnum valueDominio = null;
        	
        	switch(value) {
			case PRIVATO: valueDominio = VisibilitaDominioEnum.PRIVATO;
				break;
			case PUBBLICO: valueDominio = VisibilitaDominioEnum.PUBBLICO;
				break;
			case RISERVATO: valueDominio = VisibilitaDominioEnum.RISERVATO;
				break;
			case COMPONENTE: throw new InternalException("Impossibile impostare la visibilita componente per un dominio");
			default:
				break;}
        	
			dominio.setVisibilita(valueDominio);
        }
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominio);
        
        //creo il referente dominio
        ReferenteCreate ref = new ReferenteCreate();
        ref.setIdUtente(ID_UTENTE_REFERENTE_DOMINIO);
        ref.setTipo(TipoReferenteEnum.REFERENTE);
        dominiController.createReferenteDominio(createdDominio.getBody().getIdDominio(), ref);
        
        //creo il referente tecnico dominio
        ref = new ReferenteCreate();
        ref.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_DOMINIO);
        ref.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        dominiController.createReferenteDominio(createdDominio.getBody().getIdDominio(), ref);
        return createdDominio.getBody();
    }
    
    public Servizio getServizio(Dominio dominio, VisibilitaServizioEnum value) {
    	 ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
    	 if(value != null) {
    		 servizioCreate.setVisibilita(value);
    	 }
    	 
         servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());

         servizioCreate.setIdDominio(dominio.getIdDominio());

         if (immagine.getContent() != null) {
             servizioCreate.setImmagine(immagine);
         }
         
         List<ReferenteCreate> referenti = new ArrayList<>();
         
         ReferenteCreate referente = new ReferenteCreate();
         referente.setTipo(TipoReferenteEnum.REFERENTE);
         referente.setIdUtente(ID_UTENTE_REFERENTE_SERVIZIO);
         referenti.add(referente);
         
         referente = new ReferenteCreate();
         referente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
         referente.setIdUtente(ID_UTENTE_REFERENTE_TECNICO_SERVIZIO);
         referenti.add(referente);
         
         //NOTA BENE: I REFERENTI DOMINIO (NON TECNICI) DOVRANNO AVERE IL RUOLO REFERENTE SERVIZIO
         referente = new ReferenteCreate();
         referente.setTipo(TipoReferenteEnum.REFERENTE);
         referente.setIdUtente(ID_UTENTE_REFERENTE_DOMINIO);
         referenti.add(referente);
         
         servizioCreate.setReferenti(referenti);
         
         servizioCreate.setPackage(false);
         servizioCreate.setTipo(TipoServizio.API);

         ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
         
         ServizioUpdate upServizio = new ServizioUpdate();
         upServizio.setDatiGenerici(null);
         upServizio.setIdentificativo(null);
         
         Servizio servizio = createdServizio.getBody();

         this.setIdServizio(servizio.getIdServizio());
         
         return servizio;
    }
    /*
    public API getAPI() {
    	APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(idServizio);

        ResponseEntity<API> response = apiController.createApi(apiCreate);
        
        return response.getBody();
    }
    */
    
    private API getAPI() {
    	APICreate apiCreate = CommonUtils.getAPICreate();
        
        apiCreate.setIdServizio(idServizio);
        
        APIDatiAmbienteCreate apiDatiAmbienteCreate = new APIDatiAmbienteCreate();
        apiDatiAmbienteCreate.setProtocollo(ProtocolloEnum.REST);
        
        DocumentoCreate documento = new DocumentoCreate();
        documento.setContentType("application/yaml");
        documento.setContent(Base64.encodeBase64String(CommonUtils.openApiSpec.getBytes()));
        documento.setFilename("openapi.yaml");
        
        apiDatiAmbienteCreate.setSpecifica(documento);
        
        APIDatiErogazione apiDatiErogazione = new APIDatiErogazione();
        apiDatiErogazione.setNomeGateway("APIGateway");
        apiDatiErogazione.setVersioneGateway(1);
        apiDatiErogazione.setUrlPrefix("http://");
        apiDatiErogazione.setUrl("testurl.com/test");
        
        apiDatiAmbienteCreate.setDatiErogazione(apiDatiErogazione);
        
        apiCreate.setConfigurazioneCollaudo(apiDatiAmbienteCreate);
        apiCreate.setConfigurazioneProduzione(apiDatiAmbienteCreate);
        
        ResponseEntity<API> responseApi = apiController.createApi(apiCreate);
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());
        
        //idApi = responseApi.getBody().getIdApi();
        
        return responseApi.getBody();
    }
    
    @Test
    public void identificativoModificabiledaStatoBozza() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
       	
        Servizio servizio = this.aggiornaIdentificativo(dominio.getIdDominio());
       	assertEquals("nuovo nome", servizio.getNome());
    }
    
    @Test
    public void identificativoModificabiledaStatoRichiestoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
        
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_RICHIESTO_IN_COLLAUDO, serviziController, idServizio);
        
        //CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
       	Servizio servizio = this.aggiornaIdentificativo(dominio.getIdDominio());
       	assertEquals("nuovo nome", servizio.getNome());
    }
    
    @Test
    public void identificativoModificabiledaStatoAutorizzatoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
        
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_AUTORIZZATO_IN_COLLAUDO, serviziController, idServizio);
        
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
       	Servizio servizio = this.aggiornaIdentificativo(dominio.getIdDominio());
       	assertEquals("nuovo nome", servizio.getNome());
    }
    
    @Test
    public void identificativoNonModificabiledaStatoInConfigurazioneInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
    	CommonUtils.cambioStatoFinoA(STATO_IN_CONFIGURAZIONE_COLLAUDO, serviziController, idServizio);
        
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaIdentificativo(dominio.getIdDominio());
	    }, "Tipo di dato [identificativo] non modificabile nello stato ["+STATO_IN_CONFIGURAZIONE_COLLAUDO+"]");	
    }
    
    @Test
    public void identificativoNonModificabiledaStatoPubblicatoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
    	
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaIdentificativo(dominio.getIdDominio());
	    }, "Tipo di dato [identificativo] non modificabile nello stato ["+STATO_PUBBLICATO_IN_COLLAUDO+"]");	
    }

    @Test
    public void identificativoNonModificabiledaStatoRichiestoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_RICHIESTO_IN_PRODUZIONE, serviziController, idServizio);
    	
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaIdentificativo(dominio.getIdDominio());
	    }, "Tipo di dato [identificativo] non modificabile nello stato ["+STATO_RICHIESTO_IN_PRODUZIONE+"]");	
    }
    
    @Test
    public void identificativoNonModificabiledaStatoAutorizzatoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_AUTORIZZATO_IN_PRODUZIONE, serviziController, idServizio);
    	
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaIdentificativo(dominio.getIdDominio());
	    }, "Tipo di dato [identificativo] non modificabile nello stato ["+STATO_AUTORIZZATO_IN_PRODUZIONE+"]");	
    }
    
    @Test
    public void identificativoNonModificabiledaStatoInConfigurazioneInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_IN_CONFIGURAZIONE_PRODUZIONE, serviziController, idServizio);
    	
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaIdentificativo(dominio.getIdDominio());
	    }, "Tipo di dato [identificativo] non modificabile nello stato ["+STATO_IN_CONFIGURAZIONE_PRODUZIONE+"]");	
    }
    
    @Test
    public void identificativoNonModificabiledaStatoPubblicatoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_PRODUZIONE, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaIdentificativo(dominio.getIdDominio());
	    }, "Tipo di dato [identificativo] non modificabile nello stato ["+STATO_PUBBLICATO_IN_PRODUZIONE+"]");	
    }
    
    public Servizio aggiornaIdentificativo(UUID idDominio) {
    	ServizioUpdate upServizio = new ServizioUpdate();
    	IdentificativoServizioUpdate identificativo = new IdentificativoServizioUpdate();
    	identificativo.setNome("nuovo nome");
    	identificativo.setVersione("2");
    	identificativo.setIdSoggettoInterno(idSoggetto);
    	identificativo.setIdDominio(idDominio);
    	identificativo.setAdesioneConsentita(true);
    	identificativo.setMultiAdesione(true);
    	identificativo.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
    	identificativo.setPackage(false);
    	identificativo.setTipo(TipoServizio.API);
        
    	upServizio.setIdentificativo(identificativo);
        //System.out.println(idServizio);
    	ResponseEntity<Servizio> servizio = serviziController.updateServizio(idServizio, upServizio);
    	return servizio.getBody();
    }
    
    @Test
    public void specificaModificabiledaStatoRichiestoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_RICHIESTO_IN_COLLAUDO, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        API apiR = this.aggiornaSpecifica(api.getIdApi());
//        assertEquals("allegato_modificato.pdf", apiR.getSpecifica().getFilename());
    }
    
    @Test
    public void specificaModificabiledaAutorizzatoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_AUTORIZZATO_IN_COLLAUDO, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        API apiR = this.aggiornaSpecifica(api.getIdApi());
//        assertEquals("allegato_modificato.pdf", apiR.getSpecifica().getFilename());
    }
    /*
    @Test
    public void specificaNonModificabiledaBozza() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(AssertionFailedError.class, ()->{
        	this.aggiornaSpecifica(api.getIdApi());
	    }, "Tipo di dato [specifica] non modificabile nello stato [bozza]");
    }
    */
    @Test
    public void specificaNonModificabiledaInConfigurazioneInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_IN_CONFIGURAZIONE_COLLAUDO, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaSpecifica(api.getIdApi());
	    }, "Tipo di dato [specifica] non modificabile nello stato [InConfigurazioneInCollaudo]");
    }
    
    @Test
    public void specificaNonModificabiledaPubblicatoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaSpecifica(api.getIdApi());
	    }, "Tipo di dato [specifica] non modificabile nello stato [PubblicatoInCollaudo]");
    }
    
    @Test
    public void specificaNonModificabiledaRichiestoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_RICHIESTO_IN_PRODUZIONE, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaSpecifica(api.getIdApi());
	    }, "Tipo di dato [specifica] non modificabile nello stato [RichiestoInProduzione]");
    }
    
    @Test
    public void specificaNonModificabiledaAutorizzatoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_AUTORIZZATO_IN_PRODUZIONE, serviziController, idServizio);
    	
        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaSpecifica(api.getIdApi());
	    }, "Tipo di dato [specifica] non modificabile nello stato [AutorizzatoInProduzione]");
    }
    
    @Test
    public void specificaNonModificabiledaInConfigurazioneInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_IN_CONFIGURAZIONE_PRODUZIONE, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        //API apiResponse = this.aggiornaSpecifica(api.getIdApi());
        
        //System.out.println(apiResponse.getConfigurazioneProduzione().getSpecifica().getFilename());
        
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaSpecifica(api.getIdApi());
	    }, "Tipo di dato [specifica] non modificabile nello stato [InConfigurazioneInProduzione]");
    	
    }
    
    @Test
    public void specificaNonModificabiledaPubblicatoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_PRODUZIONE, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaSpecifica(api.getIdApi());
	    }, "Tipo di dato [specifica] non modificabile nello stato [PubblicatoInProduzione]");
    }
    
    public API aggiornaSpecifica(UUID idAPI) {
    	ApiUpdate apiUpdate = new ApiUpdate();
    	DatiSpecificaApiUpdate datiSpecificaUpdate = new DatiSpecificaApiUpdate();
    	//datiSpecificaUpdate.setProtocollo(ProtocolloEnum.REST);
    	DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setContentType("application/yaml");
        documento.setContent(Base64.encodeBase64String(CommonUtils.openApiSpec.getBytes()));
        documento.setFilename("aopenapi_modificato.yaml");
    	//datiSpecificaUpdate.setSpecifica(documento);
    	apiUpdate.setDatiSpecifica(datiSpecificaUpdate);
        APIDatiAmbienteUpdate apiDatiAmbienteUpdate = new APIDatiAmbienteUpdate();
        apiDatiAmbienteUpdate.setSpecifica(documento);
        apiDatiAmbienteUpdate.setProtocollo(ProtocolloEnum.REST);
        APIDatiErogazione apiDatiErogazione = new APIDatiErogazione();
        apiDatiErogazione.setNomeGateway("APIGateway");
        apiDatiErogazione.setVersioneGateway(1);
        apiDatiErogazione.setUrlPrefix("http://");
        apiDatiErogazione.setUrl("testurl.com/test");
        apiDatiAmbienteUpdate.setDatiErogazione(apiDatiErogazione);
        apiUpdate.setConfigurazioneProduzione(apiDatiAmbienteUpdate);
        apiUpdate.setConfigurazioneCollaudo(apiDatiAmbienteUpdate);
    	ResponseEntity<API> api = apiController.updateApi(idAPI, apiUpdate);
    	return api.getBody();
    }
    
    /*
    //sempre modificabile (non va testato)
    public void aggiornaReferenti() {
    	ReferenteCreate ref = new ReferenteCreate();
    }
    */
    /*
    //sempre modificabile (non va testato)
    public void aggiornaGenerico() {
    	ServizioUpdate upServizio = new ServizioUpdate();
        upServizio.setDatiGenerici(null);
    }
    */
    
    @Test
    public void collaudoModificabiledaStatoRichiestoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_RICHIESTO_IN_COLLAUDO, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        API apiR = this.aggiornaCollaudo(api.getIdApi());
        assertNotNull(apiR.getIdApi());
    }
    
    @Test
    public void collaudoModificabiledaAutorizzatoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_AUTORIZZATO_IN_COLLAUDO, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        API apiR = this.aggiornaCollaudo(api.getIdApi());
        
        assertNotNull(apiR.getIdApi());
    }
    
    @Test
    public void collaudoNonModificabiledaBozza() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        this.aggiornaCollaudo(api.getIdApi());
    }
    
    @Test
    public void collaudoNonModificabiledaInConfigurazioneInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_IN_CONFIGURAZIONE_COLLAUDO, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaCollaudo(api.getIdApi());
	    }, "Tipo di dato [collaudo] non modificabile nello stato [InConfigurazioneInCollaudo]");
    }
    
    @Test
    public void collaudoNonModificabiledaPubblicatoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaCollaudo(api.getIdApi());
	    }, "Tipo di dato [collaudo] non modificabile nello stato [PubblicatoInCollaudo]");
    }
    
    @Test
    public void collaudoNonModificabiledaRichiestoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_RICHIESTO_IN_PRODUZIONE, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaCollaudo(api.getIdApi());
	    }, "Tipo di dato [collaudo] non modificabile nello stato [RichiestoInProduzione]");
    }
    
    @Test
    public void collaudoNonModificabiledaAutorizzatoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_AUTORIZZATO_IN_PRODUZIONE, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaCollaudo(api.getIdApi());
	    }, "Tipo di dato [collaudo] non modificabile nello stato [AutorizzatoInProduzione]");
    }
    
    @Test
    public void collaudoNonModificabiledaInConfigurazioneInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_IN_CONFIGURAZIONE_PRODUZIONE, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaCollaudo(api.getIdApi());
	    }, "Tipo di dato [collaudo] non modificabile nello stato [InConfigurazioneInProduzione]");
    }
    
    @Test
    public void collaudoNonModificabiledaPubblicatoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_PRODUZIONE, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaCollaudo(api.getIdApi());
	    }, "Tipo di dato [collaudo] non modificabile nello stato [PubblicatoInProduzione]");
    }
    
    public API aggiornaCollaudo(UUID idAPI) {
    	ApiUpdate apiUpdate = new ApiUpdate();
    	DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setContentType("application/yaml");
        documento.setContent(Base64.encodeBase64String(CommonUtils.openApiSpec.getBytes()));
        documento.setFilename("openapimod.pdf");
        APIDatiAmbienteUpdate apiDatiAmbienteUpdate = new APIDatiAmbienteUpdate();
        apiDatiAmbienteUpdate.setSpecifica(documento);
        apiDatiAmbienteUpdate.setProtocollo(ProtocolloEnum.REST);
        APIDatiErogazione apiDatiErogazione = new APIDatiErogazione();
        apiDatiErogazione.setNomeGateway("APIGateway");
        apiDatiErogazione.setVersioneGateway(1);
        apiDatiErogazione.setUrlPrefix("http://");
        apiDatiErogazione.setUrl("testurl.com/test");
        apiDatiAmbienteUpdate.setDatiErogazione(apiDatiErogazione);
        apiUpdate.setConfigurazioneCollaudo(apiDatiAmbienteUpdate);
    	ResponseEntity<API> api = apiController.updateApi(idAPI, apiUpdate);
    	return api.getBody();
    }
    
    @Test
    public void produzioneModificabiledaStatoRichiestoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
    	CommonUtils.cambioStatoFinoA(STATO_RICHIESTO_IN_PRODUZIONE, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        API apiR = this.aggiornaProduzione(api.getIdApi());
        assertNotNull(apiR.getIdApi()); 
    }
    
    @Test
    public void produzioneModificabiledaStatoAutorizzatoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
    	CommonUtils.cambioStatoFinoA(STATO_AUTORIZZATO_IN_PRODUZIONE, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        API apiR = this.aggiornaProduzione(api.getIdApi());
        assertNotNull(apiR.getIdApi()); 
    }
    /*
    @Test
    public void produzioneNonModificabiledaStatoBozza() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(AssertionFailedError.class, ()->{
        	this.aggiornaProduzione(api.getIdApi());
	    }, "Tipo di dato [produzione] non modificabile nello stato [bozza]");
    }
    
    @Test
    public void produzioneNonModificabiledaStatoRichiestoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_RICHIESTO_IN_COLLAUDO, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(AssertionFailedError.class, ()->{
        	this.aggiornaProduzione(api.getIdApi());
	    }, "Tipo di dato [produzione] non modificabile nello stato [RichiestoInCollaudo]");
    }
   
    @Test
    public void produzioneNonModificabiledaStatoAutorizzatoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_AUTORIZZATO_IN_COLLAUDO, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        this.aggiornaProduzione(api.getIdApi());
        
        assertThrows(AssertionFailedError.class, ()->{
        	this.aggiornaProduzione(api.getIdApi());
	    }, "Tipo di dato [produzione] non modificabile nello stato [AutorizzatoInCollaudo]");
    }
    
    @Test
    public void produzioneNonModificabiledaStatoInConfigurazioneInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_IN_CONFIGURAZIONE_COLLAUDO, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(AssertionFailedError.class, ()->{
        	this.aggiornaProduzione(api.getIdApi());
	    }, "Tipo di dato [produzione] non modificabile nello stato [InConfigurazioneInCollaudo]");
    }
    
    @Test
    public void produzioneNonModificabiledaStatoPubblicatoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(AssertionFailedError.class, ()->{
        	this.aggiornaProduzione(api.getIdApi());
	    }, "Tipo di dato [produzione] non modificabile nello stato [PubblicatoInCollaudo]");
    }
    */
    @Test
    public void produzioneNonModificabiledaStatoInConfigurazioneInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
    	CommonUtils.cambioStatoFinoA(STATO_IN_CONFIGURAZIONE_PRODUZIONE, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaProduzione(api.getIdApi());
	    }, "Tipo di dato [produzione] non modificabile nello stato [InConfigurazioneInProduzione]");
    }
    
    @Test
    public void produzioneNonModificabiledaStatoPubblicatoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
    	
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_PRODUZIONE, serviziController, idServizio);

        CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
        
        assertThrows(NotAuthorizedException.class, ()->{
        	this.aggiornaProduzione(api.getIdApi());
	    }, "Tipo di dato [produzione] non modificabile nello stato [PubblicatoInProduzione]");
    }
    
    public API aggiornaProduzione(UUID idAPI) {
    	ApiUpdate apiUpdate = new ApiUpdate();
    	DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setContentType("application/yaml");
        documento.setContent(Base64.encodeBase64String(CommonUtils.openApiSpec.getBytes()));
        documento.setFilename("openapi_modificato.yaml");
        APIDatiAmbienteUpdate apiDatiAmbienteUpdate = new APIDatiAmbienteUpdate();
        apiDatiAmbienteUpdate.setSpecifica(documento);
        apiDatiAmbienteUpdate.setProtocollo(ProtocolloEnum.REST);
        APIDatiErogazione apiDatiErogazione = new APIDatiErogazione();
        apiDatiErogazione.setNomeGateway("APIGateway");
        apiDatiErogazione.setVersioneGateway(1);
        apiDatiErogazione.setUrlPrefix("http://");
        apiDatiErogazione.setUrl("testurl.com/test");
        apiDatiAmbienteUpdate.setDatiErogazione(apiDatiErogazione);
        apiUpdate.setConfigurazioneProduzione(apiDatiAmbienteUpdate);
    	ResponseEntity<API> api = apiController.updateApi(idAPI, apiUpdate);
    	return api.getBody();
    }
}

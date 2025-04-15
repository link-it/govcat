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
import org.govway.catalogo.servlets.model.ApiUpdate;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.AuthTypeApiResourceProprietaCustom;
import org.govway.catalogo.servlets.model.DatiGenericiServizioUpdate;
import org.govway.catalogo.servlets.model.DatiSpecificaApiUpdate;
import org.govway.catalogo.servlets.model.DocumentoCreate;
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
import org.govway.catalogo.servlets.model.DocumentoUpdate.TipoDocumentoEnum;
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
public class GestioneServiziAPITest {
	private static final String UTENTE_REFERENTE_SERVIZIO = "utente_referente__servizio";
	private static final String UTENTE_REFERENTE_TECNICO_SERVIZIO = "utente_referente_tecnico__servizio";
	private static final String UTENTE_REFERENTE_DOMINIO = "utente_referente__dominio";
	private static final String UTENTE_REFERENTE_TECNICO_DOMINIO = "utente_referente_tecnico__dominio";
    private static final String UTENTE_GESTORE = "gestore";
    
    private static UUID ID_UTENTE_REFERENTE_SERVIZIO;
	private static UUID ID_UTENTE_REFERENTE_TECNICO_SERVIZIO;
	private static UUID ID_UTENTE_REFERENTE_DOMINIO;
	private static UUID ID_UTENTE_REFERENTE_TECNICO_DOMINIO;
    private static UUID ID_UTENTE_GESTORE;
    
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
        ID_UTENTE_GESTORE = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_DOMINIO, utenteService);
        ID_UTENTE_REFERENTE_DOMINIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_SERVIZIO, utenteService);
        ID_UTENTE_REFERENTE_SERVIZIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO_DOMINIO, utenteService);
        ID_UTENTE_REFERENTE_TECNICO_DOMINIO = UUID.fromString(info.utente.getIdUtente());
        
        info = CommonUtils.getInfoProfilo(UTENTE_REFERENTE_TECNICO_SERVIZIO, utenteService);
        ID_UTENTE_REFERENTE_TECNICO_SERVIZIO = UUID.fromString(info.utente.getIdUtente());
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
        
        /*
        upUtente = new UtenteUpdate();
        upUtente.setPrincipal(UTENTE_RICHIEDENTE_SERVIZIO);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_servizio");

        utentiController.updateUtente(ID_UTENTE_RICHIEDENTE_SERVIZIO, upUtente);
		*/
        
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

         ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
         
         ServizioUpdate upServizio = new ServizioUpdate();
         upServizio.setDatiGenerici(null);
         upServizio.setIdentificativo(null);
         
         Servizio servizio = createdServizio.getBody();

         this.setIdServizio(servizio.getIdServizio());
         
         return servizio;
    }
    
    public API getAPI() {
    	APICreate apiCreate = CommonUtils.getAPICreate();
        apiCreate.setIdServizio(idServizio);

        ResponseEntity<API> response = apiController.createApi(apiCreate);
        
        return response.getBody();
    }
    
    @Test
    public void modificaServizioUtenteGestore() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	ServizioUpdate servizioUpdate = new ServizioUpdate();
    	DatiGenericiServizioUpdate dati = new DatiGenericiServizioUpdate();
    	dati.setDescrizione("Ecco la nuova descrizione");
    	servizioUpdate.setDatiGenerici(dati);
    	IdentificativoServizioUpdate identificativo = new IdentificativoServizioUpdate();
    	identificativo.setNome("nuovo nome");
    	identificativo.setVersione("2");
    	identificativo.setIdSoggettoInterno(idSoggetto);
    	identificativo.setIdDominio(dominio.getIdDominio());
    	identificativo.setAdesioneDisabilitata(false);
    	identificativo.setMultiAdesione(true);
    	identificativo.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
    	identificativo.setTipo(TipoServizio.API);
    	identificativo.setPackage(false);
    	servizioUpdate.setIdentificativo(identificativo);
    	ResponseEntity<Servizio> responseServizio = serviziController.updateServizio(idServizio, servizioUpdate);
    	assertEquals("nuovo nome", responseServizio.getBody().getNome());
    	assertEquals("Ecco la nuova descrizione", responseServizio.getBody().getDescrizione());
    }
    
    @Test
    public void modificaServizioUtenteReferenteDominio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
    	ServizioUpdate servizioUpdate = new ServizioUpdate();
    	DatiGenericiServizioUpdate dati = new DatiGenericiServizioUpdate();
    	dati.setDescrizione("Ecco la nuova descrizione");
    	servizioUpdate.setDatiGenerici(dati);
    	IdentificativoServizioUpdate identificativo = new IdentificativoServizioUpdate();
    	identificativo.setNome("nuovo nome");
    	identificativo.setVersione("2");
    	identificativo.setIdSoggettoInterno(idSoggetto);
    	identificativo.setIdDominio(dominio.getIdDominio());
    	identificativo.setAdesioneDisabilitata(false);
    	identificativo.setMultiAdesione(true);
    	identificativo.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
    	identificativo.setTipo(TipoServizio.API);
    	identificativo.setPackage(false);
    	servizioUpdate.setIdentificativo(identificativo);
    	ResponseEntity<Servizio> responseServizio = serviziController.updateServizio(idServizio, servizioUpdate);
    	assertEquals("nuovo nome", responseServizio.getBody().getNome());
    	assertEquals("Ecco la nuova descrizione", responseServizio.getBody().getDescrizione());
    }
    
    @Test
    public void modificaServizioUtenteReferenteServizio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
    	ServizioUpdate servizioUpdate = new ServizioUpdate();
    	DatiGenericiServizioUpdate dati = new DatiGenericiServizioUpdate();
    	dati.setDescrizione("Ecco la nuova descrizione");
    	servizioUpdate.setDatiGenerici(dati);
    	IdentificativoServizioUpdate identificativo = new IdentificativoServizioUpdate();
    	identificativo.setNome("nuovo nome");
    	identificativo.setVersione("2");
    	identificativo.setIdSoggettoInterno(idSoggetto);
    	identificativo.setIdDominio(dominio.getIdDominio());
    	identificativo.setAdesioneDisabilitata(false);
    	identificativo.setMultiAdesione(true);
    	identificativo.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
    	identificativo.setTipo(TipoServizio.API);
    	identificativo.setPackage(false);
    	servizioUpdate.setIdentificativo(identificativo);
    	ResponseEntity<Servizio> responseServizio = serviziController.updateServizio(idServizio, servizioUpdate);
    	assertEquals("nuovo nome", responseServizio.getBody().getNome());
    	assertEquals("Ecco la nuova descrizione", responseServizio.getBody().getDescrizione());
    }
    
    @Test
    public void modificaServizioUtenteReferenteTecnicoDominio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
    	ServizioUpdate servizioUpdate = new ServizioUpdate();
    	DatiGenericiServizioUpdate dati = new DatiGenericiServizioUpdate();
    	dati.setDescrizione("Ecco la nuova descrizione");
    	servizioUpdate.setDatiGenerici(dati);
    	IdentificativoServizioUpdate identificativo = new IdentificativoServizioUpdate();
    	identificativo.setNome("nuovo nome");
    	identificativo.setVersione("2");
    	identificativo.setIdSoggettoInterno(idSoggetto);
    	identificativo.setIdDominio(dominio.getIdDominio());
    	identificativo.setAdesioneDisabilitata(false);
    	identificativo.setMultiAdesione(true);
    	identificativo.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
    	identificativo.setTipo(TipoServizio.API);
    	identificativo.setPackage(false);
    	servizioUpdate.setIdentificativo(identificativo);
    	ResponseEntity<Servizio> responseServizio = serviziController.updateServizio(idServizio, servizioUpdate);
    	assertEquals("nuovo nome", responseServizio.getBody().getNome());
    	assertEquals("Ecco la nuova descrizione", responseServizio.getBody().getDescrizione());
    }
    
    @Test
    public void modificaServizioUtenteReferenteTecnicoServizio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
    	ServizioUpdate servizioUpdate = new ServizioUpdate();
    	DatiGenericiServizioUpdate dati = new DatiGenericiServizioUpdate();
    	dati.setDescrizione("Ecco la nuova descrizione");
    	servizioUpdate.setDatiGenerici(dati);
    	IdentificativoServizioUpdate identificativo = new IdentificativoServizioUpdate();
    	identificativo.setNome("nuovo nome");
    	identificativo.setVersione("2");
    	identificativo.setIdSoggettoInterno(idSoggetto);
    	identificativo.setIdDominio(dominio.getIdDominio());
    	identificativo.setAdesioneDisabilitata(false);
    	identificativo.setMultiAdesione(true);
    	identificativo.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
    	identificativo.setTipo(TipoServizio.API);
    	identificativo.setPackage(false);
    	servizioUpdate.setIdentificativo(identificativo);
    	ResponseEntity<Servizio> responseServizio = serviziController.updateServizio(idServizio, servizioUpdate);
    	assertEquals("nuovo nome", responseServizio.getBody().getNome());
    	assertEquals("Ecco la nuova descrizione", responseServizio.getBody().getDescrizione());
    }
    
    @Test
    public void modificaAPIUtenteGestore() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	ApiUpdate apiUpdate = new ApiUpdate();
    	DatiSpecificaApiUpdate datiSpecificaUpdate = new DatiSpecificaApiUpdate();
    	
    	List<AuthTypeApiResource> gruppiAuthType = new ArrayList<AuthTypeApiResource>();
        
        AuthTypeApiResource authType = new AuthTypeApiResource();
        authType.setProfilo("MODI_P1");
        
        List<String> risorse = new ArrayList<String>();
        risorse.add("risorsa1");
        authType.setResources(risorse);
        
        List<AuthTypeApiResourceProprietaCustom> proprietaCustom = new ArrayList<AuthTypeApiResourceProprietaCustom>();
        
        AuthTypeApiResourceProprietaCustom autResource = new AuthTypeApiResourceProprietaCustom();
        autResource.setNome("custom resorce");
        autResource.setValore("56");
        
        proprietaCustom.add(autResource);
        
        gruppiAuthType.add(authType);
        
    	datiSpecificaUpdate.setGruppiAuthType(gruppiAuthType);

    	apiUpdate.setDatiSpecifica(datiSpecificaUpdate);
    	ResponseEntity<API> apiResponse = apiController.updateApi(api.getIdApi(), apiUpdate);
    	
    	assertEquals(HttpStatus.OK, apiResponse.getStatusCode());
    }
    
    @Test
    public void modificaAPIUtenteReferenteDominio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
    	ApiUpdate apiUpdate = new ApiUpdate();
    	DatiSpecificaApiUpdate datiSpecificaUpdate = new DatiSpecificaApiUpdate();
    	List<AuthTypeApiResource> gruppiAuthType = new ArrayList<AuthTypeApiResource>();
        
        AuthTypeApiResource authType = new AuthTypeApiResource();
        authType.setProfilo("MODI_P1");
        
        List<String> risorse = new ArrayList<String>();
        risorse.add("risorsa1");
        authType.setResources(risorse);
        
        List<AuthTypeApiResourceProprietaCustom> proprietaCustom = new ArrayList<AuthTypeApiResourceProprietaCustom>();
        
        AuthTypeApiResourceProprietaCustom autResource = new AuthTypeApiResourceProprietaCustom();
        autResource.setNome("custom resorce");
        autResource.setValore("56");
        
        proprietaCustom.add(autResource);
        
        gruppiAuthType.add(authType);
        
    	datiSpecificaUpdate.setGruppiAuthType(gruppiAuthType);
    	apiUpdate.setDatiSpecifica(datiSpecificaUpdate);
    	ResponseEntity<API> apiResponse = apiController.updateApi(api.getIdApi(), apiUpdate);
    	
    	assertEquals(HttpStatus.OK, apiResponse.getStatusCode());
    }
    
    @Test
    public void modificaAPIUtenteReferenteServizio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
    	ApiUpdate apiUpdate = new ApiUpdate();
    	DatiSpecificaApiUpdate datiSpecificaUpdate = new DatiSpecificaApiUpdate();
    	List<AuthTypeApiResource> gruppiAuthType = new ArrayList<AuthTypeApiResource>();
        
        AuthTypeApiResource authType = new AuthTypeApiResource();
        authType.setProfilo("MODI_P1");
        
        List<String> risorse = new ArrayList<String>();
        risorse.add("risorsa1");
        authType.setResources(risorse);
        
        List<AuthTypeApiResourceProprietaCustom> proprietaCustom = new ArrayList<AuthTypeApiResourceProprietaCustom>();
        
        AuthTypeApiResourceProprietaCustom autResource = new AuthTypeApiResourceProprietaCustom();
        autResource.setNome("custom resorce");
        autResource.setValore("56");
        
        proprietaCustom.add(autResource);
        
        gruppiAuthType.add(authType);
        
    	datiSpecificaUpdate.setGruppiAuthType(gruppiAuthType);
    	apiUpdate.setDatiSpecifica(datiSpecificaUpdate);
    	ResponseEntity<API> apiResponse = apiController.updateApi(api.getIdApi(), apiUpdate);
    	
    	assertEquals(HttpStatus.OK, apiResponse.getStatusCode());
    }
    
    @Test
    public void modificaAPIUtenteReferenteTecnicoDominio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
    	ApiUpdate apiUpdate = new ApiUpdate();
    	DatiSpecificaApiUpdate datiSpecificaUpdate = new DatiSpecificaApiUpdate();
    	List<AuthTypeApiResource> gruppiAuthType = new ArrayList<AuthTypeApiResource>();
        
        AuthTypeApiResource authType = new AuthTypeApiResource();
        authType.setProfilo("MODI_P1");
        
        List<String> risorse = new ArrayList<String>();
        risorse.add("risorsa1");
        authType.setResources(risorse);
        
        List<AuthTypeApiResourceProprietaCustom> proprietaCustom = new ArrayList<AuthTypeApiResourceProprietaCustom>();
        
        AuthTypeApiResourceProprietaCustom autResource = new AuthTypeApiResourceProprietaCustom();
        autResource.setNome("custom resorce");
        autResource.setValore("56");
        
        proprietaCustom.add(autResource);
        
        gruppiAuthType.add(authType);
        
    	datiSpecificaUpdate.setGruppiAuthType(gruppiAuthType);
    	apiUpdate.setDatiSpecifica(datiSpecificaUpdate);
    	ResponseEntity<API> apiResponse = apiController.updateApi(api.getIdApi(), apiUpdate);
    	
    	assertEquals(HttpStatus.OK, apiResponse.getStatusCode());
    }
    
    @Test
    public void modificaAPIUtenteReferenteTecnicoServizio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
    	ApiUpdate apiUpdate = new ApiUpdate();
    	DatiSpecificaApiUpdate datiSpecificaUpdate = new DatiSpecificaApiUpdate();
    	List<AuthTypeApiResource> gruppiAuthType = new ArrayList<AuthTypeApiResource>();
        
        AuthTypeApiResource authType = new AuthTypeApiResource();
        authType.setProfilo("MODI_P1");
        
        List<String> risorse = new ArrayList<String>();
        risorse.add("risorsa1");
        authType.setResources(risorse);
        
        List<AuthTypeApiResourceProprietaCustom> proprietaCustom = new ArrayList<AuthTypeApiResourceProprietaCustom>();
        
        AuthTypeApiResourceProprietaCustom autResource = new AuthTypeApiResourceProprietaCustom();
        autResource.setNome("custom resorce");
        autResource.setValore("56");
        
        proprietaCustom.add(autResource);
        
        gruppiAuthType.add(authType);
        
    	datiSpecificaUpdate.setGruppiAuthType(gruppiAuthType);
    	apiUpdate.setDatiSpecifica(datiSpecificaUpdate);
    	ResponseEntity<API> apiResponse = apiController.updateApi(api.getIdApi(), apiUpdate);
    	
    	assertEquals(HttpStatus.OK, apiResponse.getStatusCode());
    }

    @Test
    public void creaAPIUtenteReferenteDominio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
    	// Creo API
    	this.getAPI();
    }
    
    @Test
    public void creaAPIUtenteReferenteServizio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
    	// Creo API
    	this.getAPI();
    }
    
    @Test
    public void creaAPIUtenteReferenteTecnicoDominio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
    	// Creo API
    	this.getAPI();
    }
    
    @Test
    public void creaAPIUtenteReferenteTecnicoServizio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
    	// Creo API
    	this.getAPI();
    }

    @Test
    public void deleteAPIUtenteGestore() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	// Creo API
    	API api = this.getAPI();
    	
    	apiController.deleteAPI(api.getIdApi());
    }
    
    @Test
    public void deleteAPIUtenteReferenteDominio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
    	apiController.deleteAPI(api.getIdApi());
    }
    
    @Test
    public void deleteAPIUtenteReferenteServizio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
    	apiController.deleteAPI(api.getIdApi());
    }
    
    @Test
    public void deleteAPIUtenteReferenteTecnicoDominio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
    	apiController.deleteAPI(api.getIdApi());
    }
    
    @Test
    public void deleteAPIUtenteReferenteTecnicoServizio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	// Creo API
    	API api = this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
    	apiController.deleteAPI(api.getIdApi());
    }
    
    @Test
    public void deleteServizioUtenteGestore() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	// Creo API
    	//this.getAPI();
    	
    	serviziController.deleteServizio(idServizio);
    }
    
    @Test
    public void deleteServizioUtenteReferenteDominio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		serviziController.deleteServizio(idServizio);
	    }, "Richiesto ruolo [AMMINISTRATORE (GESTORE)]");
    }
    
    @Test
    public void deleteServizioUtenteReferenteServizio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		serviziController.deleteServizio(idServizio);
	    }, "Richiesto ruolo [AMMINISTRATORE (GESTORE)]");
    }
    
    @Test
    public void deleteServizioUtenteReferenteTecnicoDominio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		serviziController.deleteServizio(idServizio);
	    }, "Richiesto ruolo [AMMINISTRATORE (GESTORE)]");
    }
    
    @Test
    public void deleteServizioUtenteReferenteTecnicoServizio() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	
    	// Creo API
    	this.getAPI();
    	
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		serviziController.deleteServizio(idServizio);
	    }, "Richiesto ruolo [AMMINISTRATORE (GESTORE)]");
    }
}

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

import static org.assertj.core.api.Assertions.fail;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.commons.codec.binary.Base64;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.controllers.APIController;
import org.govway.catalogo.controllers.AdesioniController;
import org.govway.catalogo.controllers.ClientController;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.GruppiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.controllers.UtentiController;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.API;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.APIDatiAmbienteCreate;
import org.govway.catalogo.servlets.model.APIDatiErogazione;
import org.govway.catalogo.servlets.model.Adesione;
import org.govway.catalogo.servlets.model.AdesioneCreate;
import org.govway.catalogo.servlets.model.AdesioneIdClient;
import org.govway.catalogo.servlets.model.AmbienteEnum;
import org.govway.catalogo.servlets.model.AuthTypeApiResource;
import org.govway.catalogo.servlets.model.AuthTypeApiResourceProprietaCustom;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.AuthTypeHttpsCreate;
import org.govway.catalogo.servlets.model.Campo;
import org.govway.catalogo.servlets.model.CertificatoClientFornitoCreate;
import org.govway.catalogo.servlets.model.Client;
import org.govway.catalogo.servlets.model.ClientCreate;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.DocumentoUpdate.TipoDocumentoEnum;
import org.govway.catalogo.servlets.model.DocumentoUpdateNew;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.EntitaComplessaError;
import org.govway.catalogo.servlets.model.Gruppo;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.RuoloAPIEnum;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.ServizioUpdate;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.StatoClientEnum;
import org.govway.catalogo.servlets.model.StatoUpdate;
import org.govway.catalogo.servlets.model.StatoUtenteEnum;
import org.govway.catalogo.servlets.model.TipoAdesioneClientUpdateEnum;
import org.govway.catalogo.servlets.model.TipoCertificatoEnum;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
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
public class WorkflowAdesioniTest {
	private static final String UTENTE_RICHIEDENTE_ADESIONE = "utente_richiedente_adesione";
	private static final String UTENTE_REFERENTE_ADESIONE = "utente_referente_adesione";
	private static final String UTENTE_REFERENTE_TECNICO_ADESIONE = "utente_referente_tecnico_adesione";
	
	private static final String UTENTE_REFERENTE_SERVIZIO = "utente_referente__servizio";
	private static final String UTENTE_REFERENTE_TECNICO_SERVIZIO = "utente_referente_tecnico__servizio";
	private static final String UTENTE_REFERENTE_DOMINIO = "utente_referente__dominio";
	private static final String UTENTE_REFERENTE_TECNICO_DOMINIO = "utente_referente_tecnico__dominio";
    private static final String UTENTE_GESTORE = "gestore";
    
    private static final String NOME_GRUPPO = "Gruppo xyz";
    
    private static final String STATO_BOZZA = "bozza";
    private static final String STATO_RICHIESTO_IN_COLLAUDO = "richiesto_collaudo";
	private static final String STATO_AUTORIZZATO_IN_COLLAUDO = "autorizzato_collaudo";
	private static final String STATO_IN_CONFIGURAZIONE_COLLAUDO = "in_configurazione_collaudo";
	private static final String STATO_PUBBLICATO_IN_COLLAUDO = "pubblicato_collaudo";
	private static final String STATO_RICHIESTO_IN_PRODUZIONE = "richiesto_produzione";
	private static final String STATO_AUTORIZZATO_IN_PRODUZIONE = "autorizzato_produzione";
	private static final String STATO_IN_CONFIGURAZIONE_PRODUZIONE = "in_configurazione_produzione";
	private static final String STATO_PUBBLICATO_IN_PRODUZIONE = "pubblicato_produzione";
    
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
    
    @Autowired
    private ClientController clientController;
    
    @Autowired
	private Configurazione configurazione;

    private UUID idServizio;
    private UUID idOrganizzazione;
    private UUID idAdesione;
    
    private String pemCert = "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURhekNDQWxPZ0F3SUJBZ0lFSGZ2NzR6QU5CZ2txaGtpRzl3MEJBUXNGQURCbU1Rc3dDUVlEVlFRR0V3SkoNClZERU9NQXdHQTFVRUNCTUZTWFJoYkhreERUQUxCZ05WQkFjVEJGQnBjMkV4RFRBTEJnTlZCQW9UQkZSbGMzUXgNCkRUQUxCZ05WQkFzVEJGUmxjM1F4R2pBWUJnTlZCQU1URVVWNFlXMXdiR1ZEYkdsbGJuUXlTRk5OTUI0WERUSTANCk1EUXdPREE1TWpReE1Wb1hEVFEwTURRd016QTVNalF4TVZvd1pqRUxNQWtHQTFVRUJoTUNTVlF4RGpBTUJnTlYNCkJBZ1RCVWwwWVd4NU1RMHdDd1lEVlFRSEV3UlFhWE5oTVEwd0N3WURWUVFLRXdSVVpYTjBNUTB3Q3dZRFZRUUwNCkV3UlVaWE4wTVJvd0dBWURWUVFERXhGRmVHRnRjR3hsUTJ4cFpXNTBNa2hUVFRDQ0FTSXdEUVlKS29aSWh2Y04NCkFRRUJCUUFEZ2dFUEFEQ0NBUW9DZ2dFQkFLMmNVQ29CcWptUTR4OWZoYlJDbk0rYmJ5ZjJwSWxSa3NRUVB5clcNCmlmWUVvaCtxZ1NROVYzS05uNWJpaTBSeWMzaDd3VGNJY2tCY2ZnczhKTGk1SHhHM2t4V1p2Z2xXL1NIOEEyVHUNClFYdkJwajlLNnd6UzB4RUduenFxaHlwVXJIL1lMRGZYandnVmZ1TS9IeEU1MjNGcFM3dGUwQXcwV2Jac1pxeTYNCmhNcWxLZk8wek52UTR1Rk5ML3NHV1pNN29kaDRPcGhaSUdOZDd0VnBnVkdQNDNDZUZvZnAyeGRxcmk5Ry9IMjINCmNQa2p4dFpoVFpuZk9RejFkNHVYRjZsU3M1dUV6RGI3ZGxKOERoZTJROUtTa0ZnRDZVME83UnZyNnpibEd4dUENCjVDdTRQSFNkeko0Y0RhZkJ4RDlrclJzYjI5cXFjK2g3alpwSzh2NkhoU2N4M2VjQ0F3RUFBYU1oTUI4d0hRWUQNClZSME9CQllFRkljWmh6UlZmYVRER1MwTm44cmRJU3FGbDhOK01BMEdDU3FHU0liM0RRRUJDd1VBQTRJQkFRQXYNCitYWFNiWWVDY1VmY2hhRkNzay9sc3hLZ0gwcFhyTlRoZXptOGd3YUpOem9KOVJQU2RnenJtSzYwOWl5M1RvaGcNClhpc040elorRkx3NVBTby9HNmU1OU5SZEdmTS93UFIwUGoyN2d0dWhITWpBeU8vY3FldWQ3S1lvZWxpTEZPRWwNCldyTWo2QmlxaGZQZmMzU3FqakZVWWtoR2s2eXZFeDREWGVPNnlmNSszczJMbTIwSTM3YU9ZblhBNVdmTGJwY1QNCnp2RWhGSk02Q3d6Q0VwbmI3M3E3ekc4ODJZTjcxL3RRS1VhS2dpV0ZPeDVvQ2dCMFZGNERlejd0ZFJYNHpZRlMNCmFKeUdIQ3F6NVZvR29CSHV1K0dpZERlRkdZZTRvZTA4cFpZWjFHS1dROG05RmlhYTlSQnJNNTNFclFidzNpWncNCnVqby9UMm9MSis3NWFTb3VCamFUCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K";
    
    @BeforeEach
    public void setUp() {
        MockitoAnnotations.initMocks(this);  // Inizializza i mock con JUnit 5
        SecurityContextHolder.setContext(securityContext);
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
    
    public void setIdAdesione(UUID id) {
    	this.idAdesione = id;
    }
    
    ResponseEntity<Organizzazione> response;
    ResponseEntity<Soggetto> createdSoggetto;
    ResponseEntity<Utente> responseUtente;
    ResponseEntity<Gruppo> responseGruppo;
    DocumentoCreate immagine = new DocumentoCreate();
    UUID idSoggetto;
    
    public Dominio getDominio(VisibilitaDominioEnum value) {
        CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
        
        OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
        organizzazione.setEsterna(false);

        response = organizzazioniController.createOrganizzazione(organizzazione);
        this.setIdOrganizazione(response.getBody().getIdOrganizzazione());
        assertNotNull(response.getBody().getIdOrganizzazione());
        
        
        
        //associo l'utente all'Organizzazione
        UtenteUpdate upUtente = new UtenteUpdate();
        upUtente.setUsername(UTENTE_REFERENTE_DOMINIO);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("referente");
        upUtente.setCognome("dominio");
        upUtente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);

        utentiController.updateUtente(UTENTE_REFERENTE_DOMINIO, upUtente);
        
        upUtente = new UtenteUpdate();
        upUtente.setUsername(UTENTE_GESTORE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("gestore");
        upUtente.setRuolo(RuoloUtenteEnum.GESTORE);

        utentiController.updateUtente(UTENTE_GESTORE, upUtente);
        
        upUtente = new UtenteUpdate();
        upUtente.setUsername(UTENTE_REFERENTE_SERVIZIO);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("referente_servizio");
        upUtente.setRuolo(RuoloUtenteEnum.REFERENTE_SERVIZIO);

        utentiController.updateUtente(UTENTE_REFERENTE_SERVIZIO, upUtente);
        
        
        upUtente = new UtenteUpdate();
        upUtente.setUsername(UTENTE_RICHIEDENTE_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("richiedente_adesione");

        utentiController.updateUtente(UTENTE_RICHIEDENTE_ADESIONE, upUtente);
        
        upUtente = new UtenteUpdate();
        upUtente.setUsername(UTENTE_REFERENTE_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("referente_adesione");

        utentiController.updateUtente(UTENTE_REFERENTE_ADESIONE, upUtente);
        
        upUtente = new UtenteUpdate();
        upUtente.setUsername(UTENTE_REFERENTE_TECNICO_ADESIONE);
        upUtente.setIdOrganizzazione(idOrganizzazione);
        upUtente.setStato(StatoUtenteEnum.ABILITATO);
        upUtente.setEmailAziendale("mail@aziendale.it");
        upUtente.setTelefonoAziendale("+39 0000000");
        upUtente.setNome("utente");
        upUtente.setCognome("referente_tecnico_adesione");

        utentiController.updateUtente(UTENTE_REFERENTE_TECNICO_ADESIONE, upUtente);
		
        
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
        dominio.setNome("Test");
        if(value!=null) {
        	dominio.setVisibilita(value);
        }
        dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
        ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominio);
        
        //creo il referente dominio
        ReferenteCreate ref = new ReferenteCreate();
        ref.setIdUtente(UTENTE_REFERENTE_DOMINIO);
        ref.setTipo(TipoReferenteEnum.REFERENTE);
        dominiController.createReferenteDominio(createdDominio.getBody().getIdDominio(), ref);
        
        //creo il referente tecnico dominio
        ref = new ReferenteCreate();
        ref.setIdUtente(UTENTE_REFERENTE_TECNICO_DOMINIO);
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
         referente.setIdUtente(UTENTE_REFERENTE_SERVIZIO);
         referenti.add(referente);
         
         referente = new ReferenteCreate();
         referente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
         referente.setIdUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO);
         referenti.add(referente);
         
         //NOTA BENE: I REFERENTI DOMINIO (NON TECNICI) DOVRANNO AVERE IL RUOLO REFERENTE SERVIZIO
         referente = new ReferenteCreate();
         referente.setTipo(TipoReferenteEnum.REFERENTE);
         referente.setIdUtente(UTENTE_REFERENTE_DOMINIO);
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
        apiCreate.setRuolo(RuoloAPIEnum.DOMINIO);
        
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
        
        apiCreate.setGruppiAuthType(gruppiAuthType);
        
        DocumentoCreate doc = new DocumentoCreate();
        doc.setFilename("SpecificaAPI.json");
        doc.setContent(Base64.encodeBase64String("contenuto test".getBytes()));
        
        ResponseEntity<API> response = apiController.createApi(apiCreate);
        
        return response.getBody();
    }
    
    public Adesione getAdesione() {
    	List<ReferenteCreate> listaReferenti = new ArrayList<ReferenteCreate>();
    	
        ReferenteCreate newReferente = new ReferenteCreate();
        newReferente.setIdUtente(UTENTE_REFERENTE_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(UTENTE_REFERENTE_TECNICO_DOMINIO);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        listaReferenti.add(newReferente);
        
        newReferente = new ReferenteCreate();
        newReferente.setIdUtente(UTENTE_REFERENTE_TECNICO_ADESIONE);
        newReferente.setTipo(TipoReferenteEnum.REFERENTE_TECNICO);
        
        listaReferenti.add(newReferente);
    	
        AdesioneCreate nuovaAdesione = new AdesioneCreate();
        nuovaAdesione.setIdServizio(idServizio);
        nuovaAdesione.setIdSoggetto(idSoggetto);
        nuovaAdesione.setReferenti(listaReferenti);
        ResponseEntity<Adesione> adesione = adesioniController.createAdesione(nuovaAdesione);

        this.setIdAdesione(adesione.getBody().getIdAdesione());
        
        
        
        //AdesioneClientCreate clientCreate = new AdesioneClientCreate();
        /*
        ClientCreate client = CommonUtils.getClientCreate();
        client.setIdSoggetto(idSoggetto);
        
        ResponseEntity<Client> clientResponse = clientController.createClient(client);
        */
        //clientResponse.getBody().getIdClient();
        
        
        //AdesioneClientUpdate clientUpdate = new AdesioneClientUpdate();
        //clientUpdate.setTipoClient(TipoAdesioneClientUpdateEnum.PROPOSTO);
        
        /*
        AdesioneClientProposto clientProposto = new AdesioneClientProposto();
        clientProposto.setAmbiente(null);
        clientProposto.setNomeProposto(null);
        clientProposto.setTipoClient(null);
        
        AdesioneIdClient clientId = new AdesioneIdClient();
        clientId.setAmbiente(null);
        clientId.setIdSoggetto(null);
        clientId.setNome(null);
        clientId.setTipoClient(null);
        */
               
        //AdesioneClientCreate clientCreate = new AdesioneClientCreate();
        
        //creo il client per il collaudo
        ClientCreate clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.COLLAUDO);

        AuthTypeHttpsCreate dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);
        
        CertificatoClientFornitoCreate certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        
        DocumentoUpdateNew documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem");
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
    	
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        //clientCreate.setTipoClient(TipoAdesioneClientUpdateEnum.NUOVO);
        
        
        ResponseEntity<Client> clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        //clientController.updateClientStato(null, null);
        
        AdesioneIdClient adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.COLLAUDO);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        
        adesioniController.saveClientCollaudoAdesione(idAdesione, "MODI_P1", adesioneIdClient, null);
        
        //creo il client per la produzione
        clientCreate = new ClientCreate();
        clientCreate.setIdSoggetto(idSoggetto);
        clientCreate.setNome("ClientTest");
        clientCreate.setAmbiente(AmbienteEnum.PRODUZIONE);

        dati = new AuthTypeHttpsCreate();
        dati.setAuthType(AuthTypeEnum.HTTPS);
        
        certificato = new CertificatoClientFornitoCreate();
        certificato.setTipoCertificato(TipoCertificatoEnum.FORNITO);
        
        documento = new DocumentoUpdateNew();
        documento.setTipoDocumento(TipoDocumentoEnum.NUOVO);
        documento.setFilename("certificato.pem");
        documento.setContent(pemCert);
        documento.setContentType("application/x-pem-file");
        
        certificato.setCertificato(documento);
        dati.setCertificatoAutenticazione(certificato);
    	
        clientCreate.setDatiSpecifici(dati);
        clientCreate.setDescrizione("descrizione");
        
        clientCreate.setIndirizzoIp("1.1.1.1");
        clientCreate.setStato(StatoClientEnum.CONFIGURATO);
        
        
        clientResponse = clientController.createClient(clientCreate);
        clientResponse.getBody().getIdClient();
        
        adesioneIdClient = new AdesioneIdClient();
        adesioneIdClient.setNome("ClientTest");
        adesioneIdClient.setAmbiente(AmbienteEnum.PRODUZIONE);
        adesioneIdClient.setIdSoggetto(idSoggetto);
        adesioneIdClient.setTipoClient(TipoAdesioneClientUpdateEnum.RIFERITO);
        
        adesioniController.saveClientProduzioneAdesione(idAdesione, "MODI_P1", adesioneIdClient, null);
        
        
        return adesione.getBody();
    }
    
    public void tornaAStato(String nomeStatoPartenza, String nomeStatoArrivo) {
    	List<StatoUpdate> sequenzaStati = new ArrayList<>();
    	
    	StatoUpdate stato1 = new StatoUpdate();
        stato1.setStato("pubblicato_produzione");
        stato1.setCommento("pubblicato in produzione");
        sequenzaStati.add(stato1);

        StatoUpdate stato2 = new StatoUpdate();
        stato2.setStato("in_configurazione_produzione");
        stato2.setCommento("in configurazione in produzione");
        sequenzaStati.add(stato2);
        
        StatoUpdate stato3 = new StatoUpdate();
        stato3.setStato("autorizzato_produzione");
        stato3.setCommento("autorizzato in produzione");
        sequenzaStati.add(stato3);
        
        StatoUpdate stato4 = new StatoUpdate();
        stato4.setStato("richiesto_produzione");
        stato4.setCommento("richiesto in produzione");
        sequenzaStati.add(stato4);
        
        StatoUpdate stato5 = new StatoUpdate();
        stato5.setStato("pubblicato_collaudo");
        stato5.setCommento("pubblicato in collaudo");
        sequenzaStati.add(stato5);
        
        StatoUpdate stato6 = new StatoUpdate();
        stato6.setStato("in_configurazione_collaudo");
        stato6.setCommento("in configurazione collaudo");
        sequenzaStati.add(stato6);
        
        StatoUpdate stato7 = new StatoUpdate();
        stato7.setStato("autorizzato_collaudo");
        stato7.setCommento("autorizzato collaudo");
        sequenzaStati.add(stato7);

        StatoUpdate stato8 = new StatoUpdate();
        stato8.setStato("richiesto_collaudo");
        stato8.setCommento("richiesta di collaudo");
        sequenzaStati.add(stato8);
        
        StatoUpdate stato9 = new StatoUpdate();
        stato9.setStato("bozza");
        stato9.setCommento("bozza");
        sequenzaStati.add(stato9);

        boolean statoPartenza = false;
        for (StatoUpdate statoUpdate : sequenzaStati) {
        	if(statoPartenza) {
	            adesioniController.updateStatoAdesione(idAdesione, statoUpdate, null);
        		//serviziController.updateStatoServizio(idServizio, statoUpdate);
	
	            // Termina il ciclo quando raggiungi lo stato finale desiderato
	            if (statoUpdate.getStato().equals(nomeStatoArrivo)) {
	                break;
	            }
        	}
        	if(statoUpdate.getStato().equals(nomeStatoPartenza)) {
        		statoPartenza = true;
        	}
        }
    }
    
    public void passaAlloStatoSuccessivo(String nomeStatoPartenza) {
    	List<StatoUpdate> sequenzaStati = new ArrayList<>();
    	
    	StatoUpdate stato1 = new StatoUpdate();
    	stato1.setStato("bozza");
    	stato1.setCommento("bozza");
    	sequenzaStati.add(stato1);

    	StatoUpdate stato2 = new StatoUpdate();
    	stato2.setStato("richiesto_collaudo");
    	stato2.setCommento("richiesta di collaudo");
    	sequenzaStati.add(stato2);

    	StatoUpdate stato3 = new StatoUpdate();
    	stato3.setStato("autorizzato_collaudo");
    	stato3.setCommento("autorizzato collaudo");
    	sequenzaStati.add(stato3);

    	StatoUpdate stato4 = new StatoUpdate();
    	stato4.setStato("in_configurazione_collaudo");
    	stato4.setCommento("in configurazione collaudo");
    	sequenzaStati.add(stato4);

    	StatoUpdate stato5 = new StatoUpdate();
    	stato5.setStato("pubblicato_collaudo");
    	stato5.setCommento("pubblicato in collaudo");
    	sequenzaStati.add(stato5);

    	StatoUpdate stato6 = new StatoUpdate();
    	stato6.setStato("richiesto_produzione");
    	stato6.setCommento("richiesto in produzione");
    	sequenzaStati.add(stato6);

    	StatoUpdate stato7 = new StatoUpdate();
    	stato7.setStato("autorizzato_produzione");
    	stato7.setCommento("autorizzato in produzione");
    	sequenzaStati.add(stato7);

    	StatoUpdate stato8 = new StatoUpdate();
    	stato8.setStato("in_configurazione_produzione");
    	stato8.setCommento("in configurazione in produzione");
    	sequenzaStati.add(stato8);

    	StatoUpdate stato9 = new StatoUpdate();
    	stato9.setStato("pubblicato_produzione");
    	stato9.setCommento("pubblicato in produzione");
    	sequenzaStati.add(stato9);

        boolean statoPartenza = false;
        for (StatoUpdate statoUpdate : sequenzaStati) {
        	if(statoPartenza) {
	            adesioniController.updateStatoAdesione(idAdesione, statoUpdate, null);
	            // Termina il ciclo quando raggiungi lo stato successivo
	            break;
        	}
        	if(statoUpdate.getStato().equals(nomeStatoPartenza)) {
        		statoPartenza = true;
        	}
        }
    }
    
    public void cambioStatoAdesioneFinoA(String statoFinale) {
        List<StatoUpdate> sequenzaStati = new ArrayList<>();

        // Creazione e impostazione degli oggetti StatoUpdate
        StatoUpdate stato1 = new StatoUpdate();
        stato1.setStato("richiesto_collaudo");
        stato1.setCommento("richiesta di collaudo");
        sequenzaStati.add(stato1);

        StatoUpdate stato2 = new StatoUpdate();
        stato2.setStato("autorizzato_collaudo");
        stato2.setCommento("autorizzato collaudo");
        sequenzaStati.add(stato2);

        StatoUpdate stato3 = new StatoUpdate();
        stato3.setStato("in_configurazione_collaudo");
        stato3.setCommento("in configurazione collaudo");
        sequenzaStati.add(stato3);

        StatoUpdate stato4 = new StatoUpdate();
        stato4.setStato("pubblicato_collaudo");
        stato4.setCommento("pubblicato in collaudo");
        sequenzaStati.add(stato4);

        StatoUpdate stato5 = new StatoUpdate();
        stato5.setStato("richiesto_produzione");
        stato5.setCommento("richiesto in produzione");
        sequenzaStati.add(stato5);

        StatoUpdate stato6 = new StatoUpdate();
        stato6.setStato("autorizzato_produzione");
        stato6.setCommento("autorizzato in produzione");
        sequenzaStati.add(stato6);

        StatoUpdate stato7 = new StatoUpdate();
        stato7.setStato("in_configurazione_produzione");
        stato7.setCommento("in configurazione in produzione");
        sequenzaStati.add(stato7);

        StatoUpdate stato8 = new StatoUpdate();
        stato8.setStato("pubblicato_produzione");
        stato8.setCommento("pubblicato in produzione");
        sequenzaStati.add(stato8);

        // Itera sulla sequenza degli stati e applica ciascuno finché non raggiungi lo stato finale
        //for (StatoUpdate statoUpdate : sequenzaStati) {
        for (int i = 0; i < sequenzaStati.size(); i++) {
        	StatoUpdate stato = sequenzaStati.get(i);
        	try {	
        		adesioniController.updateStatoAdesione(idAdesione, stato, null);
        		//adesioniController.updateStatoAdesione(idAdesione, statoUpdate);
    	    } catch (UpdateEntitaComplessaNonValidaSemanticamenteException e) {
    	        List<EntitaComplessaError> errori = e.getErrori();
    	        for (EntitaComplessaError errore : errori) {
    	            System.out.println("Errore:");
    	            System.out.println("Sottotipo: " + errore.getSottotipo());

    	            // Se 'dato' è un oggetto complesso, puoi accedere ai suoi attributi se disponibili
    	            ConfigurazioneClasseDato dato = errore.getDato();
    	            if (dato != null) {
    	                System.out.println("Dato: " + dato.getValue());
    	            }

    	            // Stampa i parametri se presenti
    	            Map<String, String> params = errore.getParams();
    	            if (params != null && !params.isEmpty()) {
    	                System.out.println("Parametri:");
    	                for (Map.Entry<String, String> entry : params.entrySet()) {
    	                    System.out.println("  " + entry.getKey() + ": " + entry.getValue());
    	                }
    	            }

    	            // Stampa i campi se presenti
    	            List<Campo> campi = errore.getCampi();
    	            if (campi != null && !campi.isEmpty()) {
    	                System.out.println("Campi:");
    	                for (Campo campo : campi) {
    	                    System.out.println("  Nome Campo: " + campo.getNomeCampo());
    	                }
    	            }
    	            System.out.println("-------------");
    	        }
    	        fail("Si è verificata un'eccezione: " + e.getMessage());
    	    } catch (Exception e) {
    	        e.printStackTrace();
    	        fail("Si è verificata un'eccezione inattesa: " + e.getMessage());
    	    }

            // Termina il ciclo quando raggiungi lo stato finale desiderato
            //if (statoUpdate.getStato().equals(statoFinale)) {
            if (stato.getStato().equals(statoFinale)) {
                break;
            }
        }
    }
    
    @Test
    public void daStatoBozzaAStatoRichiestoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
    	
    	// Creo l'Adesione
    	this.getAdesione();
    	
    	/*
    	StatoUpdate stato = new StatoUpdate();
        stato.setStato("bozza");
        stato.setCommento("bozza");
        adesioniController.updateStatoAdesione(idAdesione, stato);
    	*/
    	
    	/*	
		private static final String UTENTE_REFERENTE_SERVIZIO = "utente_referente__servizio";
		private static final String UTENTE_REFERENTE_TECNICO_SERVIZIO = "utente_referente_tecnico__servizio";
		private static final String UTENTE_REFERENTE_DOMINIO = "utente_referente__dominio";
		private static final String UTENTE_REFERENTE_TECNICO_DOMINIO = "utente_referente_tecnico__dominio";
    	 */
    	
    	//Gestore
    	this.cambioStatoAdesioneFinoA(STATO_RICHIESTO_IN_COLLAUDO);
    	
    	this.tornaAStato(STATO_RICHIESTO_IN_COLLAUDO, STATO_BOZZA);
    	
    	//Referente Adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_ADESIONE, securityContext, authentication, utenteService);
    	
    	this.passaAlloStatoSuccessivo(STATO_BOZZA);
    	
    	this.tornaAStato(STATO_RICHIESTO_IN_COLLAUDO, STATO_BOZZA);
    	
    	//Referente tecnico adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_ADESIONE, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_BOZZA);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
    	this.passaAlloStatoSuccessivo(STATO_BOZZA);
    	
    	this.tornaAStato(STATO_RICHIESTO_IN_COLLAUDO, STATO_BOZZA);
    	
    	//Referente tecnico servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_BOZZA);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
    	this.passaAlloStatoSuccessivo(STATO_BOZZA);
    	
    	this.tornaAStato(STATO_RICHIESTO_IN_COLLAUDO, STATO_BOZZA);
    	
    	//Referente tecnico dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_BOZZA);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    }
    
    @Test
    public void daStatoRichiestoInCollaudoAAutorizzatoInCollaudo()  {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
    	
    	// Creo l'Adesione
    	this.getAdesione();
    	
    	//Gestore
    	this.cambioStatoAdesioneFinoA(STATO_AUTORIZZATO_IN_COLLAUDO);
    	
    	this.tornaAStato(STATO_AUTORIZZATO_IN_COLLAUDO, STATO_RICHIESTO_IN_COLLAUDO);
    	
    	//Referente servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
    	this.passaAlloStatoSuccessivo(STATO_RICHIESTO_IN_COLLAUDO);
    	
    	this.tornaAStato(STATO_AUTORIZZATO_IN_COLLAUDO, STATO_RICHIESTO_IN_COLLAUDO);
    	
    	//Referente dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
    	this.passaAlloStatoSuccessivo(STATO_RICHIESTO_IN_COLLAUDO);
    	
    	this.tornaAStato(STATO_AUTORIZZATO_IN_COLLAUDO, STATO_RICHIESTO_IN_COLLAUDO);
    	
    	//Referente adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_ADESIONE, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_RICHIESTO_IN_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_ADESIONE, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_RICHIESTO_IN_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_RICHIESTO_IN_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_RICHIESTO_IN_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    }
    
    @Test
    public void daStatoAutorizzatoInCollaudoAInConfigurazioneInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
    	
    	// Creo l'Adesione
    	this.getAdesione();
    	
    	//Gestore
    	this.cambioStatoAdesioneFinoA(STATO_IN_CONFIGURAZIONE_COLLAUDO);
    	
    	this.tornaAStato(STATO_IN_CONFIGURAZIONE_COLLAUDO, STATO_AUTORIZZATO_IN_COLLAUDO);
    	
    	//Referente adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_ADESIONE, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_AUTORIZZATO_IN_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_ADESIONE, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_AUTORIZZATO_IN_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_AUTORIZZATO_IN_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_AUTORIZZATO_IN_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_AUTORIZZATO_IN_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_AUTORIZZATO_IN_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    }
    
    @Test
    public void daStatoInConfigurazioneInCollaudoAPubblicatoInCollaudo() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
    	
    	// Creo l'Adesione
    	this.getAdesione();
    	
    	//Gestore
    	this.cambioStatoAdesioneFinoA(STATO_PUBBLICATO_IN_COLLAUDO);
    	
    	this.tornaAStato(STATO_PUBBLICATO_IN_COLLAUDO, STATO_IN_CONFIGURAZIONE_COLLAUDO);
    	
    	//Referente adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_ADESIONE, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_IN_CONFIGURAZIONE_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_ADESIONE, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_IN_CONFIGURAZIONE_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_IN_CONFIGURAZIONE_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_IN_CONFIGURAZIONE_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_IN_CONFIGURAZIONE_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_IN_CONFIGURAZIONE_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    }
    
    @Test
    public void daStatoPubblicatoInCollaudoARichiestoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
    	
    	// Creo l'Adesione
    	this.getAdesione();
    	
    	//Gestore
    	this.cambioStatoAdesioneFinoA(STATO_RICHIESTO_IN_PRODUZIONE);
    	
    	this.tornaAStato(STATO_RICHIESTO_IN_PRODUZIONE, STATO_PUBBLICATO_IN_COLLAUDO);
    	
    	//Referente adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_ADESIONE, securityContext, authentication, utenteService);
    	
    	this.passaAlloStatoSuccessivo(STATO_PUBBLICATO_IN_COLLAUDO);
    	
    	this.tornaAStato(STATO_RICHIESTO_IN_PRODUZIONE, STATO_PUBBLICATO_IN_COLLAUDO);
    	
    	//Referente tecnico adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_ADESIONE, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_PUBBLICATO_IN_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
    	this.passaAlloStatoSuccessivo(STATO_PUBBLICATO_IN_COLLAUDO);
    	
    	this.tornaAStato(STATO_RICHIESTO_IN_PRODUZIONE, STATO_PUBBLICATO_IN_COLLAUDO);
    	
    	//Referente tecnico servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_PUBBLICATO_IN_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
    	this.passaAlloStatoSuccessivo(STATO_PUBBLICATO_IN_COLLAUDO);
    	
    	this.tornaAStato(STATO_RICHIESTO_IN_PRODUZIONE, STATO_PUBBLICATO_IN_COLLAUDO);
    	
    	//Referente tecnico dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_PUBBLICATO_IN_COLLAUDO);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    }
    
    @Test
    public void daStatoRichiestoInProduzioneAAutorizzatoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
    	
    	// Creo l'Adesione
    	this.getAdesione();
    	
    	//Gestore
    	this.cambioStatoAdesioneFinoA(STATO_AUTORIZZATO_IN_PRODUZIONE);
    	
    	this.tornaAStato(STATO_AUTORIZZATO_IN_PRODUZIONE, STATO_RICHIESTO_IN_PRODUZIONE);
    	
    	//Referente servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
    	this.passaAlloStatoSuccessivo(STATO_RICHIESTO_IN_PRODUZIONE);
    	
    	this.tornaAStato(STATO_AUTORIZZATO_IN_PRODUZIONE, STATO_RICHIESTO_IN_PRODUZIONE);
    	
    	//Referente dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
    	this.passaAlloStatoSuccessivo(STATO_RICHIESTO_IN_PRODUZIONE);
    	
    	this.tornaAStato(STATO_AUTORIZZATO_IN_PRODUZIONE, STATO_RICHIESTO_IN_PRODUZIONE);
    	
    	//Referente adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_ADESIONE, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_RICHIESTO_IN_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_ADESIONE, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_RICHIESTO_IN_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_RICHIESTO_IN_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_RICHIESTO_IN_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    }
    
    @Test
    public void daStatoAutorizzatoInProduzioneAInConfigurazioneInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
    	
    	// Creo l'Adesione
    	this.getAdesione();
    	
    	//Gestore
    	this.cambioStatoAdesioneFinoA(STATO_IN_CONFIGURAZIONE_PRODUZIONE);
    	
    	this.tornaAStato(STATO_IN_CONFIGURAZIONE_PRODUZIONE, STATO_AUTORIZZATO_IN_PRODUZIONE);
    	
    	//Referente adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_ADESIONE, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_AUTORIZZATO_IN_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_ADESIONE, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_AUTORIZZATO_IN_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_AUTORIZZATO_IN_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_AUTORIZZATO_IN_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_AUTORIZZATO_IN_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_AUTORIZZATO_IN_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    }
    
    @Test
    public void daStatoInConfigurazioneInProduzioneAPubblicatoInProduzione() {
    	// Creo il dominio
    	Dominio dominio = this.getDominio(null);
    	// Creo un servizio
    	this.getServizio(dominio, VisibilitaServizioEnum.PUBBLICO);
    	// Creo API
    	this.getAPI();
    	
    	//per l'adesione lo stato del servizio deve essere a "Pubblicato in collaudo"
    	CommonUtils.cambioStatoFinoA(STATO_PUBBLICATO_IN_COLLAUDO, serviziController, idServizio);
    	
    	// Creo l'Adesione
    	this.getAdesione();
    	
    	//Gestore
    	this.cambioStatoAdesioneFinoA(STATO_PUBBLICATO_IN_PRODUZIONE);
    	
    	this.tornaAStato(STATO_PUBBLICATO_IN_PRODUZIONE, STATO_IN_CONFIGURAZIONE_PRODUZIONE);
    	
    	//Referente adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_ADESIONE, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_IN_CONFIGURAZIONE_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico adesione
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_ADESIONE, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_IN_CONFIGURAZIONE_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_SERVIZIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_IN_CONFIGURAZIONE_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico servizio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_SERVIZIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_IN_CONFIGURAZIONE_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_DOMINIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_IN_CONFIGURAZIONE_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    	
    	//Referente tecnico dominio
    	CommonUtils.getSessionUtente(UTENTE_REFERENTE_TECNICO_DOMINIO, securityContext, authentication, utenteService);
    	
    	assertThrows(NotAuthorizedException.class, ()->{
    		this.passaAlloStatoSuccessivo(STATO_IN_CONFIGURAZIONE_PRODUZIONE);
	    }, "Utente non autorizzato, quindi viene lanciata l'eccezione");
    }
}


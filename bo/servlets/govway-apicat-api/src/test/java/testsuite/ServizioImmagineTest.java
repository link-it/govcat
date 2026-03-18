package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.authorization.CoreAuthorization;
import org.govway.catalogo.authorization.DominioAuthorization;
import org.govway.catalogo.controllers.DominiController;
import org.govway.catalogo.controllers.GruppiController;
import org.govway.catalogo.controllers.OrganizzazioniController;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.controllers.SoggettiController;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.servlets.model.DatiGenericiServizioUpdate;
import org.govway.catalogo.servlets.model.DocumentoCreate;
import org.govway.catalogo.servlets.model.DocumentoUpdate.TipoDocumentoEnum;
import org.govway.catalogo.servlets.model.DocumentoUpdateId;
import org.govway.catalogo.servlets.model.Dominio;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.IdentificativoServizioUpdate;
import org.govway.catalogo.servlets.model.Organizzazione;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.ReferenteCreate;
import org.govway.catalogo.servlets.model.Servizio;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.ServizioUpdate;
import org.govway.catalogo.servlets.model.Soggetto;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.TipoReferenteEnum;
import org.govway.catalogo.servlets.model.TipoServizio;
import org.govway.catalogo.servlets.model.VisibilitaServizioEnum;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
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
import org.springframework.transaction.annotation.Transactional;

@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration(exclude = {GroovyTemplateAutoConfiguration.class})
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
@TestInstance(TestInstance.Lifecycle.PER_METHOD)
@Transactional
public class ServizioImmagineTest {

	@Mock
	private SecurityContext securityContext;

	@Mock
	private Authentication authentication;

	@Mock
	private DominioAuthorization authorization;

	@Mock
	private CoreAuthorization coreAuthorization;

	@Autowired
	UtenteService utenteService;

	@Autowired
	private OrganizzazioniController organizzazioniController;

	@Autowired
	private ServiziController serviziController;

	@Autowired
	private SoggettiController soggettiController;

	@Autowired
	private GruppiController gruppiController;

	@Autowired
	private DominiController dominiController;

	private static final String UTENTE_GESTORE = "gestore";
	private static UUID ID_UTENTE_GESTORE;

	ResponseEntity<Organizzazione> response;
	ResponseEntity<Soggetto> createdSoggetto;
	DocumentoCreate immagine = new DocumentoCreate();
	UUID idSoggetto;
	UUID idDominio;

	@BeforeEach
	private void setUp() {
		MockitoAnnotations.initMocks(this);
		when(this.securityContext.getAuthentication()).thenReturn(this.authentication);
		CommonUtils.getSessionUtente(UTENTE_GESTORE, securityContext, authentication, utenteService);
		when(coreAuthorization.isAnounymous()).thenReturn(true);
		SecurityContextHolder.setContext(this.securityContext);

		InfoProfilo info = CommonUtils.getInfoProfilo(UTENTE_GESTORE, utenteService);
		ID_UTENTE_GESTORE = UUID.fromString(info.utente.getIdUtente());
	}

	@AfterEach
	private void tearDown() {
		SecurityContextHolder.clearContext();
	}

	private Dominio getDominio() {
		OrganizzazioneCreate organizzazione = CommonUtils.getOrganizzazioneCreate();
		organizzazione.setEsterna(false);

		response = organizzazioniController.createOrganizzazione(organizzazione);
		assertNotNull(response.getBody().getIdOrganizzazione());

		SoggettoCreate soggettoCreate = new SoggettoCreate();
		soggettoCreate.setSkipCollaudo(true);
		soggettoCreate.setNome("nome_soggetto");
		soggettoCreate.setIdOrganizzazione(response.getBody().getIdOrganizzazione());
		soggettoCreate.setAderente(true);
		soggettoCreate.setReferente(true);

		createdSoggetto = soggettiController.createSoggetto(soggettoCreate);
		idSoggetto = createdSoggetto.getBody().getIdSoggetto();
		assertEquals(HttpStatus.OK, createdSoggetto.getStatusCode());

		GruppoCreate gruppoCreate = CommonUtils.getGruppoCreate();
		gruppoCreate.setNome("xyz");
		gruppiController.createGruppo(gruppoCreate);

		DominioCreate dominio = CommonUtils.getDominioCreate();
		dominio.setSkipCollaudo(true);
		dominio.setIdSoggettoReferente(createdSoggetto.getBody().getIdSoggetto());
		ResponseEntity<Dominio> createdDominio = dominiController.createDominio(dominio);

		this.idDominio = createdDominio.getBody().getIdDominio();
		return createdDominio.getBody();
	}

	private Servizio getServizio() {
		Dominio dominio = this.getDominio();
		ServizioCreate servizioCreate = CommonUtils.getServizioCreate();
		servizioCreate.setSkipCollaudo(true);
		servizioCreate.setIdSoggettoInterno(createdSoggetto.getBody().getIdSoggetto());
		servizioCreate.setIdDominio(dominio.getIdDominio());

		if (immagine.getContent() != null) {
			servizioCreate.setImmagine(immagine);
		}

		List<ReferenteCreate> referenti = new ArrayList<>();
		ReferenteCreate referente = new ReferenteCreate();
		referente.setTipo(TipoReferenteEnum.REFERENTE);
		referente.setIdUtente(ID_UTENTE_GESTORE);
		referenti.add(referente);
		servizioCreate.setReferenti(referenti);

		ResponseEntity<Servizio> createdServizio = serviziController.createServizio(servizioCreate);
		return createdServizio.getBody();
	}

	@Test
	void testUpdateServizioConImmagineSuccess() {
		// 1. Crea un servizio con un'immagine associata (PNG 1x1 pixel valido in base64)
		immagine.setContent("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
		immagine.setContentType("image/png");
		immagine.setFilename("test.png");

		Servizio servizio = this.getServizio();
		UUID idServizio = servizio.getIdServizio();

		// 2. Verifica che il servizio creato abbia l'immagine
		assertNotNull(servizio.getImmagine(), "Il servizio creato deve avere un'immagine");
		UUID imageUuid = servizio.getImmagine().getUuid();
		assertNotNull(imageUuid, "L'immagine deve avere un UUID");

		// 3. Riproduce il comportamento del frontend Angular in fase di update:
		//    Il frontend riceve l'oggetto immagine con uuid dalla GET del servizio,
		//    e in _prepareBodyUpdateServizio() costruisce:
		//    { tipo_documento: 'uuid', uuid: '<uuid-ricevuto>' }
		//    per preservare l'immagine esistente senza modificarla.
		DocumentoUpdateId immagineUpdate = new DocumentoUpdateId();
		immagineUpdate.setTipoDocumento(TipoDocumentoEnum.UUID);
		immagineUpdate.setUuid(imageUuid);

		ServizioUpdate servizioUpdate = new ServizioUpdate();
		IdentificativoServizioUpdate identificativo = new IdentificativoServizioUpdate();
		identificativo.setNome("Nome Aggiornato Con Immagine");
		identificativo.setVersione("2");
		identificativo.setIdDominio(idDominio);
		identificativo.setIdSoggettoInterno(idSoggetto);
		identificativo.setVisibilita(VisibilitaServizioEnum.PUBBLICO);
		identificativo.setAdesioneDisabilitata(false);
		identificativo.setMultiAdesione(true);
		identificativo.setTipo(TipoServizio.API);
		identificativo.setPackage(false);
		servizioUpdate.setIdentificativo(identificativo);

		DatiGenericiServizioUpdate datiGenerici = new DatiGenericiServizioUpdate();
		datiGenerici.setDescrizione("Descrizione aggiornata");
		datiGenerici.setDescrizioneSintetica("Descrizione sintetica aggiornata");
		datiGenerici.setImmagine(immagineUpdate);
		servizioUpdate.setDatiGenerici(datiGenerici);

		// 4. Esegue l'update come farebbe il frontend
		ResponseEntity<Servizio> response = serviziController.updateServizio(idServizio, null, servizioUpdate);

		assertEquals(HttpStatus.OK, response.getStatusCode());
		assertNotNull(response.getBody());
		assertEquals("Nome Aggiornato Con Immagine", response.getBody().getNome());
		assertEquals("Descrizione aggiornata", response.getBody().getDescrizione());
		assertNotNull(response.getBody().getImmagine(), "L'immagine deve essere preservata dopo l'update");
	}
}

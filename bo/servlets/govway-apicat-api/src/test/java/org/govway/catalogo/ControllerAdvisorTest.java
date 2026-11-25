/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
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
package org.govway.catalogo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.govway.catalogo.exception.ClientApiException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.ConfigurazionePeriodiDashboard;
import org.govway.catalogo.servlets.model.EntitaComplessaError;
import org.govway.catalogo.servlets.model.Problem;
import org.govway.catalogo.servlets.model.RuoloAPIEnum;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.pdnd.client.api.impl.ApiException;
import org.hibernate.service.spi.ServiceException;
import org.hibernate.validator.messageinterpolation.ParameterMessageInterpolator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.core.convert.ConversionFailedException;
import org.springframework.core.convert.TypeDescriptor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.beanvalidation.SpringValidatorAdapter;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.method.annotation.ExceptionHandlerMethodResolver;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.exc.InvalidDefinitionException;
import com.fasterxml.jackson.databind.exc.ValueInstantiationException;

import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;

/**
 * Verifica che le violazioni di validazione e i body JSON non deserializzabili
 * vengano restituiti nel formato Problem del progetto (ErrorCode in detail, params in errori).
 */
class ControllerAdvisorTest {

	private static ValidatorFactory validatorFactory;
	private static SpringValidatorAdapter validator;

	/** Stessa naming strategy del converter REST dell'applicazione */
	private final ObjectMapper om = new ObjectMapper().setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
	private final ControllerAdvisor advisor = new ControllerAdvisor();

	@BeforeAll
	static void setUp() {
		validatorFactory = Validation.byDefaultProvider().configure()
				.messageInterpolator(new ParameterMessageInterpolator())
				.buildValidatorFactory();
		validator = new SpringValidatorAdapter(validatorFactory.getValidator());
	}

	@AfterAll
	static void tearDown() {
		validatorFactory.close();
	}

	// Firma usata solo per costruire il MethodParameter della MethodArgumentNotValidException
	@SuppressWarnings("unused")
	private void body(Object body) {}

	private Problem validate(Object body) throws Exception {
		BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(body, "body");
		validator.validate(body, bindingResult);
		MethodParameter parameter = new MethodParameter(getClass().getDeclaredMethod("body", Object.class), 0);
		return handle(new MethodArgumentNotValidException(parameter, bindingResult));
	}

	private Problem read(String json, Class<?> type) throws Exception {
		try {
			om.readValue(json, type);
		} catch(Exception e) {
			return handle(new HttpMessageNotReadableException("JSON parse error: " + e.getMessage(), e, new MockHttpInputMessage(json.getBytes())));
		}
		throw new AssertionError("Deserializzazione riuscita inattesa: " + json);
	}

	private Problem handle(Exception ex) throws Exception {
		ResponseEntity<Object> response = advisor.handleException(ex, new ServletWebRequest(new MockHttpServletRequest()));
		assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
		Problem problem = (Problem) response.getBody();
		assertEquals(400, problem.getStatus());
		assertEquals("Bad Request", problem.getTitle());
		return problem;
	}

	private static void assertErrore(EntitaComplessaError errore, String campo, Map<String, String> params) {
		assertEquals(params, errore.getParams());
		assertEquals(1, errore.getCampi().size());
		assertEquals(campo, errore.getCampi().get(0).getNomeCampo());
	}

	private APICreate apiCreateValida() throws Exception {
		return om.readValue("""
				{"nome":"test-serv-1","versione":1,"id_servizio":"bd7814da-62d5-4e5c-9cc4-cad20d701f6b",
				 "ruolo":"erogato_soggetto_dominio",
				 "configurazione_collaudo":{"protocollo":"rest","dati_erogazione":{"url":null}},
				 "gruppi_auth_type":[{"profilo":"HTTP_BASIC","resources":["/dummy"]}]}
				""", APICreate.class);
	}

	@Test
	void testApiCreateValidaNessunaViolazione() throws Exception {
		BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(apiCreateValida(), "body");
		validator.validate(bindingResult.getTarget(), bindingResult);
		assertEquals(0, bindingResult.getErrorCount());
	}

	@Test
	void testCampoObbligatorioMancanteInLista() throws Exception {
		// Caso della segnalazione: gruppo di autenticazione senza resources
		APICreate api = apiCreateValida();
		api.getGruppiAuthType().get(0).setResources(null);

		Problem problem = validate(api);

		assertEquals("VAL.400.REQUIRED", problem.getDetail());
		assertEquals(1, problem.getErrori().size());
		assertErrore(problem.getErrori().get(0), "gruppi_auth_type[0].resources",
				Map.of("campo", "gruppi_auth_type[0].resources"));
	}

	@Test
	void testLunghezzaNonValidaCampoAnnidato() throws Exception {
		APICreate api = apiCreateValida();
		api.getConfigurazioneCollaudo().getDatiErogazione().setUrl("");

		Problem problem = validate(api);

		assertEquals("VAL.400.LENGTH", problem.getDetail());
		assertErrore(problem.getErrori().get(0), "configurazione_collaudo.dati_erogazione.url",
				Map.of("campo", "configurazione_collaudo.dati_erogazione.url", "lunghezzaAttesa", "1-255", "lunghezzaTrovata", "0"));
	}

	@Test
	void testLunghezzaNonValidaElementoLista() throws Exception {
		APICreate api = apiCreateValida();
		api.getGruppiAuthType().get(0).setResources(List.of(""));

		Problem problem = validate(api);

		assertEquals("VAL.400.LENGTH", problem.getDetail());
		assertErrore(problem.getErrori().get(0), "gruppi_auth_type[0].resources[0]",
				Map.of("campo", "gruppi_auth_type[0].resources[0]", "lunghezzaAttesa", "1-255", "lunghezzaTrovata", "0"));
	}

	@Test
	void testPiuViolazioniOrdinatePerCampo() throws Exception {
		APICreate api = apiCreateValida();
		api.setNome(null);
		api.getGruppiAuthType().get(0).setResources(null);

		Problem problem = validate(api);

		// detail corrisponde alla prima voce di errori, su cui il frontend risolve i placeholder
		assertEquals("VAL.400.REQUIRED", problem.getDetail());
		assertEquals(2, problem.getErrori().size());
		assertErrore(problem.getErrori().get(0), "gruppi_auth_type[0].resources", Map.of("campo", "gruppi_auth_type[0].resources"));
		assertErrore(problem.getErrori().get(1), "nome", Map.of("campo", "nome"));
	}

	@Test
	void testPatternNonRispettato() throws Exception {
		ServizioCreate servizio = new ServizioCreate();
		servizio.setVersione("0");

		Problem problem = validate(servizio);

		EntitaComplessaError errore = problem.getErrori().stream()
				.filter(e -> e.getCampi().get(0).getNomeCampo().equals("versione"))
				.findFirst().orElseThrow();
		assertErrore(errore, "versione", Map.of("campo", "versione", "pattern", "^[1-9][0-9]*$"));
	}

	@Test
	void testNomeJsonRisoltoDaJsonProperty() throws Exception {
		// periodo1 -> periodo_1: non ottenibile con la sola conversione camelCase -> snake_case
		ConfigurazionePeriodiDashboard periodi = new ConfigurazionePeriodiDashboard();
		periodi.setPeriodo2(1L);

		Problem problem = validate(periodi);

		assertEquals("VAL.400.REQUIRED", problem.getDetail());
		assertErrore(problem.getErrori().get(0), "periodo_1", Map.of("campo", "periodo_1"));
	}

	@Test
	void testEnumNonValido() throws Exception {
		Problem problem = read("{\"ruolo\":\"xxx\"}", APICreate.class);

		assertEquals("VAL.400.ENUM", problem.getDetail());
		assertErrore(problem.getErrori().get(0), "ruolo",
				Map.of("source", "xxx", "tipo", "org.govway.catalogo.servlets.model.RuoloAPIEnum"));
	}

	@Test
	void testEnumNonValidoAnnidato() throws Exception {
		Problem problem = read("{\"configurazione_collaudo\":{\"protocollo\":\"zz\"}}", APICreate.class);

		assertEquals("VAL.400.ENUM", problem.getDetail());
		assertErrore(problem.getErrori().get(0), "configurazione_collaudo.protocollo",
				Map.of("source", "zz", "tipo", "org.govway.catalogo.servlets.model.ProtocolloEnum"));
	}

	@Test
	void testTipoNonValido() throws Exception {
		Problem problem = read("{\"gruppi_auth_type\":[{\"resources\":{}}]}", APICreate.class);

		assertEquals("VAL.400.FORMAT", problem.getDetail());
		assertErrore(problem.getErrori().get(0), "gruppi_auth_type[0].resources",
				Map.of("campo", "gruppi_auth_type[0].resources"));
	}

	@Test
	void testJsonMalformato() throws Exception {
		Problem problem = read("{\"nome\":", APICreate.class);

		assertEquals("VAL.400.FORMAT", problem.getDetail());
		assertNull(problem.getErrori());
	}

	@Test
	void testBodyAssente() throws Exception {
		Problem problem = handle(new HttpMessageNotReadableException("Required request body is missing", new MockHttpInputMessage(new byte[0])));

		assertEquals("VAL.400.FORMAT", problem.getDetail());
		assertNull(problem.getErrori());
	}

	private ResponseEntity<Object> handleClientApi(int code, String responseBody) {
		return advisor.handleClientApiException(new ClientApiException(new ApiException("errore servizio esterno", code, null, responseBody)));
	}

	private static void assertAutenticazioneRifiutata(ResponseEntity<Object> response) {
		assertEquals(HttpStatus.BAD_GATEWAY, response.getStatusCode());
		Problem problem = (Problem) response.getBody();
		assertEquals(502, problem.getStatus());
		assertEquals("INT.502.AUTH", problem.getDetail());
		assertEquals(Map.of("statusCode", "401"), problem.getErrori().get(0).getParams());
	}

	@Test
	void testClientApi401ConProblemRestituito502() {
		// Un 401 del servizio esterno non deve arrivare al frontend come 401 (refresh token e logout)
		assertAutenticazioneRifiutata(handleClientApi(401,
				"{\"type\":\"https://govway.org/handling-errors/401/AuthenticationRequired.html\",\"title\":\"AuthenticationRequired\",\"status\":401,\"detail\":\"Authentication required\"}"));
	}

	@Test
	void testClientApi401SenzaProblemRestituito502() {
		assertAutenticazioneRifiutata(handleClientApi(401, "Unauthorized"));
	}

	@Test
	void testClientApiAltriStatusInvariati() {
		ResponseEntity<Object> response = handleClientApi(404, "{\"status\":404,\"title\":\"Not Found\",\"detail\":\"eservice non trovato\"}");

		assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
		assertEquals("eservice non trovato", ((Problem) response.getBody()).getDetail());

		response = handleClientApi(403, "Forbidden");

		assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
		assertEquals(403, ((Problem) response.getBody()).getStatus());
	}

	private Problem handleInternalError(ResponseEntity<Object> response) {
		assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
		Problem problem = (Problem) response.getBody();
		assertEquals(500, problem.getStatus());
		// L'identificativo scritto nel log arriva al client sia in instance sia nei params della traduzione
		String idErrore = problem.getErrori().get(0).getParams().get("idErrore");
		assertNotNull(idErrore);
		assertEquals(URI.create("urn:uuid:" + idErrore), problem.getInstance());
		return problem;
	}

	@Test
	void testEccezioneNonGestitaSenzaMessaggioInterno() throws Exception {
		// Casi della segnalazione: NPE e istruzione SQL fallita
		for(Exception ex : List.of(
				new NullPointerException("Cannot invoke \"org.govway.catalogo.core.orm.entity.RuoloOrganizzazione.ordinal()\" because \"ruolo\" is null"),
				new IllegalStateException("could not execute statement [ERROR: null value in column \"esterna\" of relation \"organizzazioni\"] [insert into organizzazioni (...)]"))) {

			Problem problem = handleInternalError(advisor.handleGenericException(ex, null));

			assertEquals("SYS.500", problem.getDetail());
			assertEquals(Set.of("idErrore"), problem.getErrori().get(0).getParams().keySet());
			String body = om.writeValueAsString(problem);
			assertFalse(body.contains("ruolo") || body.contains("organizzazioni") || body.contains("Cannot invoke"), body);
		}
	}

	@Test
	void testIdentificativoDistintoPerOgniErrore() {
		Problem primo = handleInternalError(advisor.handleGenericException(new NullPointerException(), null));
		Problem secondo = handleInternalError(advisor.handleGenericException(new NullPointerException(), null));

		assertNotEquals(primo.getInstance(), secondo.getInstance());
	}

	@Test
	void testEccezioneApplicativaNonMappataMantieneCodice() {
		Problem problem = handleInternalError(advisor.handleGenericException(new InternalException(ErrorCode.SYS_500_DB), null));

		assertEquals("SYS.500.DB", problem.getDetail());
	}

	@Test
	void testInternalExceptionMantieneCodiceEParametri() {
		Problem problem = handleInternalError(advisor.handleAllInternalExceptions(
				new InternalException(ErrorCode.INT_500_PDND, Map.of("dettagli", "eservice non raggiungibile")), null));

		assertEquals("INT.500.PDND", problem.getDetail());
		assertEquals("eservice non raggiungibile", problem.getErrori().get(0).getParams().get("dettagli"));
		assertEquals(2, problem.getErrori().get(0).getParams().size());
	}

	@Test
	void testServiceExceptionGestitaDallHandlerGenerico() {
		// Prima dichiarata sull'handler di InternalException, il cui parametro non la accetta
		assertEquals("handleGenericException", resolveHandler(new ServiceException("Unable to create requested service")));
		assertEquals("handleAllInternalExceptions", resolveHandler(new InternalException(ErrorCode.SYS_500)));
	}

	@Test
	void testValoreNonConvertibileSenzaMessaggioInterno() throws Exception {
		List<Exception> eccezioni = List.of(
				new ConversionFailedException(TypeDescriptor.valueOf(String.class), TypeDescriptor.valueOf(RuoloAPIEnum.class), "xxx", new IllegalArgumentException("Unexpected value 'xxx'")),
				catturaEccezioneJackson("{\"ruolo\":\"xxx\"}", ValueInstantiationException.class),
				InvalidDefinitionException.from((com.fasterxml.jackson.core.JsonParser) null, "Cannot construct instance of `org.govway.catalogo.servlets.model.APICreate`", om.constructType(APICreate.class)));

		for(Exception ex : eccezioni) {
			assertEquals("handleFormatoNonValido", resolveHandler(ex));
			ResponseEntity<Object> response = advisor.handleFormatoNonValido(ex);

			assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
			Problem problem = (Problem) response.getBody();
			assertEquals("VAL.400.FORMAT", problem.getDetail());
			String body = om.writeValueAsString(problem);
			assertFalse(body.contains("org.govway") || body.contains("xxx"), body);
		}
	}

	private Exception catturaEccezioneJackson(String json, Class<? extends Exception> tipo) {
		// Deserializzazione diretta di un enum generato da openapi-generator (fromValue lancia IllegalArgumentException)
		Exception ex = assertThrows(Exception.class, () -> om.readValue(json, APICreate.class));
		assertInstanceOf(tipo, ex);
		return ex;
	}

	private static String resolveHandler(Exception ex) {
		return new ExceptionHandlerMethodResolver(ControllerAdvisor.class).resolveMethod(ex).getName();
	}
}

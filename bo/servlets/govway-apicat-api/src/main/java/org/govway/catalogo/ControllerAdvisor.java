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
import java.lang.reflect.Array;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.govway.catalogo.exception.AbstractGovCatException;
import org.govway.catalogo.exception.ClientApiException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.Campo;
import org.govway.catalogo.servlets.model.EntitaComplessaError;
import org.govway.catalogo.servlets.model.Problem;
import org.govway.catalogo.servlets.pdnd.client.api.impl.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;

import com.fasterxml.jackson.databind.BeanDescription;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.exc.ValueInstantiationException;
import com.fasterxml.jackson.databind.introspect.BeanPropertyDefinition;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;


@ControllerAdvice
public class ControllerAdvisor extends AbstractControllerAdvisor {

	private Logger logger = LoggerFactory.getLogger(ControllerAdvisor.class);

	/** Usato solo per risolvere i nomi JSON delle proprietà dei modelli (stessa naming strategy del converter REST) */
	private static final ObjectMapper JSON_NAMING_MAPPER = new ObjectMapper().setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

	/** Messaggio dell'IllegalArgumentException lanciata dal fromValue() degli enum generati da openapi-generator */
	private static final Pattern ENUM_UNEXPECTED_VALUE = Pattern.compile("Unexpected value '(.*)'", Pattern.DOTALL);

	private static final String PARAM_CAMPO = "campo";

	private record Violazione(ErrorCode errorCode, String campo, Map<String, String> params) {}

	protected ResponseEntity<Object> toEntity(Exception ex, HttpStatus status) {

		Problem problem = newProblem(status);
		problem.setDetail(ex.getMessage());


		if(ex instanceof UpdateEntitaComplessaNonValidaSemanticamenteException) {
			problem.setErrori(((UpdateEntitaComplessaNonValidaSemanticamenteException)ex).getErrori());
		} else if(ex instanceof AbstractGovCatException) {
			problem.setErrori(getErrori((AbstractGovCatException)ex));
		}

		return new ResponseEntity<>(problem, status);

	}

	private List<EntitaComplessaError> getErrori(AbstractGovCatException ex) {
		EntitaComplessaError e = new EntitaComplessaError();
		e.setParams(ex.getParameters());
		return List.of(e);
	}

	private Problem newProblem(HttpStatus status) {
		Problem problem = new Problem();
		problem.setStatus(status.value());
		problem.setTitle(status.getReasonPhrase());
		try {problem.setType(new URI("https://tools.ietf.org/html/rfc7231#section-6.5.1"));} catch (URISyntaxException e) {}
		return problem;
	}

	/**
	 * Violazioni Bean Validation sul body: una voce in errori per ogni campo non valido
	 * (ordinate per campo), detail valorizzato con il codice della prima.
	 */
	@Override
	protected ResponseEntity<Object> toEntity(MethodArgumentNotValidException ex) {
		Object target = ex.getBindingResult().getTarget();
		JavaType rootType = target != null ? JSON_NAMING_MAPPER.constructType(target.getClass()) : null;

		List<Violazione> violazioni = ex.getBindingResult().getFieldErrors().stream()
				.map(fe -> toViolazione(fe, toJsonPath(rootType, fe.getField())))
				.sorted(Comparator.comparing(Violazione::campo))
				.toList();

		logger.debug("Richiesta non valida: {}", violazioni);

		if(violazioni.isEmpty()) {
			return toBadRequest(ErrorCode.VAL_400_FORMAT, List.of());
		}
		return toBadRequest(violazioni.get(0).errorCode(), violazioni);
	}

	/**
	 * Body JSON non deserializzabile: enum con valore non ammesso -> VAL.400.ENUM,
	 * ogni altro caso (tipo errato, JSON malformato, body assente) -> VAL.400.FORMAT.
	 */
	@Override
	protected ResponseEntity<Object> toEntity(HttpMessageNotReadableException ex) {

		logger.debug("Body della richiesta non leggibile: {}", ex.getMessage());

		if(!(ex.getCause() instanceof JsonMappingException jme) || jme.getPath().isEmpty()) {
			return toBadRequest(ErrorCode.VAL_400_FORMAT, List.of());
		}

		String campo = toJsonPath(jme.getPath());
		Optional<String> valoreEnum = getValoreEnumNonValido(jme);
		Violazione violazione = valoreEnum.isPresent()
				? new Violazione(ErrorCode.VAL_400_ENUM, campo, Map.of("source", valoreEnum.get(), "tipo", getTipoEnum(jme)))
				: new Violazione(ErrorCode.VAL_400_FORMAT, campo, Map.of(PARAM_CAMPO, campo));
		return toBadRequest(violazione.errorCode(), List.of(violazione));
	}

	private ResponseEntity<Object> toBadRequest(ErrorCode errorCode, List<Violazione> violazioni) {
		Problem problem = newProblem(HttpStatus.BAD_REQUEST);
		problem.setDetail(errorCode.getCode());
		if(!violazioni.isEmpty()) {
			problem.setErrori(violazioni.stream().map(this::toEntitaComplessaError).toList());
		}
		return new ResponseEntity<>(problem, HttpStatus.BAD_REQUEST);
	}

	private EntitaComplessaError toEntitaComplessaError(Violazione violazione) {
		Campo campo = new Campo();
		campo.setNomeCampo(violazione.campo());
		EntitaComplessaError e = new EntitaComplessaError();
		e.setParams(violazione.params());
		e.setCampi(List.of(campo));
		return e;
	}

	private Violazione toViolazione(FieldError fe, String campo) {
		Map<String, Object> attributi = fe.contains(ConstraintViolation.class)
				? fe.unwrap(ConstraintViolation.class).getConstraintDescriptor().getAttributes()
				: Map.of();

		String constraint = fe.getCode() != null ? fe.getCode() : "";
		if(constraint.equals(NotNull.class.getSimpleName())) {
			return new Violazione(ErrorCode.VAL_400_REQUIRED, campo, Map.of(PARAM_CAMPO, campo));
		}
		if(constraint.equals(Size.class.getSimpleName()) && attributi.get("min") instanceof Integer min && attributi.get("max") instanceof Integer max) {
			return new Violazione(ErrorCode.VAL_400_LENGTH, campo, Map.of(PARAM_CAMPO, campo,
					"lunghezzaAttesa", formatLunghezzaAttesa(min, max),
					"lunghezzaTrovata", getLunghezza(fe.getRejectedValue())));
		}
		if(constraint.equals(jakarta.validation.constraints.Pattern.class.getSimpleName()) && attributi.get("regexp") instanceof String regexp) {
			return new Violazione(ErrorCode.VAL_400_PATTERN, campo, Map.of(PARAM_CAMPO, campo, "pattern", regexp));
		}
		return new Violazione(ErrorCode.VAL_400_FORMAT, campo, Map.of(PARAM_CAMPO, campo));
	}

	private static String formatLunghezzaAttesa(int min, int max) {
		if(min == max) {
			return String.valueOf(min);
		}
		if(max == Integer.MAX_VALUE) {
			return ">= " + min;
		}
		if(min == 0) {
			return "<= " + max;
		}
		return min + "-" + max;
	}

	private static String getLunghezza(Object valore) {
		if(valore instanceof CharSequence cs) {
			return String.valueOf(cs.length());
		}
		if(valore instanceof Collection<?> c) {
			return String.valueOf(c.size());
		}
		if(valore instanceof Map<?, ?> m) {
			return String.valueOf(m.size());
		}
		if(valore != null && valore.getClass().isArray()) {
			return String.valueOf(Array.getLength(valore));
		}
		return "0";
	}

	/**
	 * Converte il path Java di un FieldError (es. gruppiAuthType[0].resources) nel path JSON
	 * (es. gruppi_auth_type[0].resources), risolvendo i nomi tramite introspezione Jackson
	 * sul tipo della richiesta. I segmenti non risolvibili vengono lasciati invariati.
	 */
	private static String toJsonPath(JavaType rootType, String javaPath) {
		StringBuilder sb = new StringBuilder();
		JavaType type = rootType;
		for(String segmento : javaPath.split("\\.")) {
			int idx = segmento.indexOf('[');
			String nome = idx >= 0 ? segmento.substring(0, idx) : segmento;
			String indici = idx >= 0 ? segmento.substring(idx) : "";

			BeanPropertyDefinition proprieta = findProprieta(type, nome);
			type = proprieta != null ? proprieta.getPrimaryType() : null;
			for(int i = 0; type != null && i < countIndici(indici); i++) {
				type = type.getContentType();
			}

			if(sb.length() > 0) {
				sb.append('.');
			}
			sb.append(proprieta != null ? proprieta.getName() : nome).append(indici);
		}
		return sb.toString();
	}

	private static BeanPropertyDefinition findProprieta(JavaType type, String nomeJava) {
		if(type == null) {
			return null;
		}
		BeanDescription bd = JSON_NAMING_MAPPER.getDeserializationConfig().introspect(type);
		return bd.findProperties().stream()
				.filter(p -> p.getInternalName().equals(nomeJava))
				.findFirst()
				.orElse(null);
	}

	private static int countIndici(String indici) {
		return (int) indici.chars().filter(c -> c == '[').count();
	}

	private static String toJsonPath(List<JsonMappingException.Reference> path) {
		StringBuilder sb = new StringBuilder();
		for(JsonMappingException.Reference ref : path) {
			if(ref.getFieldName() != null) {
				if(sb.length() > 0) {
					sb.append('.');
				}
				sb.append(ref.getFieldName());
			} else if(ref.getIndex() >= 0) {
				sb.append('[').append(ref.getIndex()).append(']');
			}
		}
		return sb.toString();
	}

	private static Optional<String> getValoreEnumNonValido(JsonMappingException jme) {
		if(jme instanceof InvalidFormatException ife && ife.getTargetType() != null && ife.getTargetType().isEnum() && ife.getValue() != null) {
			return Optional.of(ife.getValue().toString());
		}
		if(jme instanceof ValueInstantiationException vie && vie.getType() != null && vie.getType().isEnumType()
				&& vie.getCause() instanceof IllegalArgumentException iae && iae.getMessage() != null) {
			Matcher m = ENUM_UNEXPECTED_VALUE.matcher(iae.getMessage());
			if(m.matches()) {
				return Optional.of(m.group(1));
			}
		}
		return Optional.empty();
	}

	private static String getTipoEnum(JsonMappingException jme) {
		if(jme instanceof InvalidFormatException ife) {
			return ife.getTargetType().getName();
		}
		return ((ValueInstantiationException) jme).getType().getRawClass().getName();
	}

	@Override
	protected ResponseEntity<Object> toEntity(ClientApiException ex) {
		
		
		ApiException apiException = ex.getE();

		logger.error("Errore restituito dal client (HTTP {}): {}",
				apiException != null ? apiException.getCode() : null,
				apiException != null ? apiException.getResponseBody() : null);

		ObjectMapper om = new ObjectMapper();
		om.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
		om.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
		
		Problem problem;
		HttpStatus status;
		try {
		    Objects.requireNonNull(apiException, "ApiException non valorizzata");
		    problem = om.readValue(apiException.getResponseBody().getBytes(), Problem.class);
		    status = HttpStatus.resolve(problem.getStatus());
		    
		    // Se status è null, assegna un valore di default (es. INTERNAL_SERVER_ERROR)
		    if (status == null) {
		        status = HttpStatus.INTERNAL_SERVER_ERROR;
		    }
		} catch(Exception e) {
		    logger.error("Errore serializzazione: " + e.getMessage(), e);
		    status = apiException != null ? HttpStatus.resolve(apiException.getCode()) : null;

		    // Se status è ancora null, assegna un valore di default
		    if (status == null) {
		        status = HttpStatus.INTERNAL_SERVER_ERROR;
		    }

		    problem = new Problem();
		    problem.setStatus(status.value());
		    problem.setTitle(status.getReasonPhrase());
		    try {
		        problem.setType(new URI("https://TODO"));
		    } catch (URISyntaxException ec) {
		        logger.error("Errore nella creazione dell'URI", ec);
		    }
		    problem.setDetail(ex.getMessage());
		}


		return new ResponseEntity<>(problem, status);
	} 


}

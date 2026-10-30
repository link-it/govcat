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
package org.govway.catalogo.core.business.utils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map.Entry;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Riconoscimento e analisi delle specifiche REST in formato Swagger 2.0.
 * <p>
 * L'analisi e` strutturale (Jackson) e non risolve i {@code $ref}: e` sufficiente a riconoscere
 * il formato e a estrarre l'elenco delle operazioni, senza dipendere dallo stack Swagger 1.x.
 */
public class SwaggerUtils {

	private static final Logger logger = LoggerFactory.getLogger(SwaggerUtils.class);

	// Stessi metodi estratti da OpenapiUtils, per avere risultati coerenti tra i due formati
	private static final String[] METODI = {"get", "post", "put", "head", "delete", "patch"};

	public static boolean isSwagger(byte[] swaggerBytes) {
		try {
			return isSwagger(readTree(swaggerBytes));
		} catch(Exception e) {
			logger.debug("Documento non riconosciuto come Swagger 2.0: {}", e.getMessage());
			return false;
		}
	}

	private static boolean isSwagger(JsonNode root) {
		if(root == null || !root.isObject()) {
			return false;
		}
		JsonNode version = root.get("swagger");
		return version != null && (version.isTextual() || version.isNumber()) && version.asText().startsWith("2.")
				&& root.path("info").isObject()
				&& root.path("paths").isObject();
	}

	public static List<ResourceInfo> getProtocolInfoFromSwagger(byte[] swaggerBytes) throws Exception {

		try {
			JsonNode root = readTree(swaggerBytes);
			if(!isSwagger(root)) {
				throw new IllegalArgumentException("Il documento non e` una specifica Swagger 2.0");
			}

			List<ResourceInfo> resources = new ArrayList<>();

			Iterator<Entry<String, JsonNode>> paths = root.get("paths").fields();
			while(paths.hasNext()) {
				Entry<String, JsonNode> entry = paths.next();
				String path = entry.getKey();
				JsonNode pathV = entry.getValue();

				// Le estensioni (x-*) non sono path; le chiavi non operative (parameters, $ref, x-*) vengono ignorate
				if(path.startsWith("x-") || !pathV.isObject()) {
					continue;
				}

				for(String metodo: METODI) {
					JsonNode oper = pathV.get(metodo);
					if(oper != null && oper.isObject()) {
						resources.add(newResourceInfo(metodo.toUpperCase(), path, getContentTypes(oper)));
					}
				}
			}

			return resources;
		} catch(Exception e) {
			logger.debug("Impossibile recuperare le operazioni dal descrittore Swagger 2.0: {}", e.getMessage());
			throw new Exception("Impossibile recuperare le informazioni sulle azioni/risorse dal descrittore fornito");
		}
	}

	private static JsonNode readTree(byte[] swaggerBytes) throws IOException {
		byte[] jsonBytes = YamltoJsonUtils.convertYamlToJson(swaggerBytes);
		return new ObjectMapper().readTree(jsonBytes);
	}

	private static List<String> getContentTypes(JsonNode oper) {
		List<String> contentTypes = new ArrayList<>();
		JsonNode consumes = oper.get("consumes");
		if(consumes != null && consumes.isArray()) {
			consumes.forEach(c -> {
				if(c.isTextual()) {
					contentTypes.add(c.asText());
				}
			});
		}
		return contentTypes;
	}

	private static ResourceInfo newResourceInfo(String op, String path, List<String> contentTypes) {
		ResourceInfo operationInfo = new ResourceInfo();

		operationInfo.setOp(op);
		operationInfo.setPath(path);
		operationInfo.setContentTypes(contentTypes);

		return operationInfo;
	}

}

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
package org.govway.catalogo.core.business.utils;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map.Entry;
import java.util.Set;
import java.util.stream.Collectors;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.parser.OpenAPIV3Parser;
import io.swagger.v3.parser.core.models.SwaggerParseResult;

public class OpenapiUtils {

	public static boolean isOpenapi(byte[] openapiBytes) {
		try {

			return getOpenAPI(openapiBytes)!=null;
		} catch(RuntimeException e) {
			return false;
		} catch(Throwable e) {
			return false;
		}
	}

	private static OpenAPI getOpenAPI(byte[] openapi) throws IOException {

		byte[] minimalOpenApi = OpenApiMinifierRaw.extractMinimalOpenApi(openapi);

		SwaggerParseResult pr = new OpenAPIV3Parser().readContents(new String(minimalOpenApi));

		return pr.getOpenAPI();
	}

	public static List<ResourceInfo> getProtocolInfoFromOpenapi(byte[] openapiBytes) throws Exception {

		try {
			Set<ResourceInfo> resources = new HashSet<>();

			OpenAPI openapi = getOpenAPI(openapiBytes);
			
			for(Entry<String, PathItem> entry: openapi.getPaths().entrySet()) {

				String path = entry.getKey();

				PathItem pathV = entry.getValue();

				if(pathV.getGet()!=null) {
					List<String> lst = getContentTypes(pathV.getGet());
					resources.add(newResourceInfo("GET", path, lst));
				}
				if(pathV.getPost()!=null) {
					List<String> lst = getContentTypes(pathV.getPost());
					resources.add(newResourceInfo("POST", path, lst));
				}
				if(pathV.getPut()!=null) {
					List<String> lst = getContentTypes(pathV.getPut());
					resources.add(newResourceInfo("PUT", path, lst));
				}
				if(pathV.getHead()!=null) {
					List<String> lst = getContentTypes(pathV.getHead());
					resources.add(newResourceInfo("HEAD", path, lst));
				}
				if(pathV.getDelete()!=null) {
					List<String> lst = getContentTypes(pathV.getDelete());
					resources.add(newResourceInfo("DELETE", path, lst));
				}
				if(pathV.getPatch()!=null) {
					List<String> lst = getContentTypes(pathV.getPatch());
					resources.add(newResourceInfo("PATCH", path, lst));
				}
			}

			return resources.stream().collect(Collectors.toList());
		} catch(RuntimeException e) {
			throw new Exception("Impossibile recuperare le informazioni sulle azioni/risorse dal descrittore fornito");
		} catch(Throwable e) {
			throw new Exception("Impossibile recuperare le informazioni sulle azioni/risorse dal descrittore fornito");
		}

	}

	private static List<String> getContentTypes(Operation oper) {
		return oper.getRequestBody() != null ? oper.getRequestBody().getContent().entrySet().stream().map(c -> {
			return c.getKey();
		}).collect(Collectors.toList()) : Arrays.asList();
	}

	private static ResourceInfo newResourceInfo(String op, String path, List<String> contentTypes) {
		ResourceInfo operationInfo = new ResourceInfo();

		operationInfo.setOp(op);
		operationInfo.setPath(path);
		operationInfo.setContentTypes(contentTypes);

		return operationInfo;
	}


}

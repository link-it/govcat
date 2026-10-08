package testsuite;
import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.stream.Collectors;

import org.govway.catalogo.core.business.utils.OpenapiUtils;
import org.govway.catalogo.core.business.utils.ResourceInfo;
import org.govway.catalogo.core.business.utils.SwaggerUtils;
import org.junit.jupiter.api.Test;

public class SwaggerUtilsTest {

	private static final String SWAGGER_YAML =
			"swagger: '2.0'\n" +
			"info:\n" +
			"  title: Sample API\n" +
			"  version: 1.0.0\n" +
			"basePath: /sample\n" +
			"x-root-extension: valore\n" +
			"paths:\n" +
			"  x-paths-extension:\n" +
			"    get: {}\n" +
			"  /hello:\n" +
			"    parameters:\n" +
			"      - in: query\n" +
			"        name: q\n" +
			"        type: string\n" +
			"    x-path-extension: valore\n" +
			"    get:\n" +
			"      responses:\n" +
			"        '200':\n" +
			"          description: ok\n" +
			"    post:\n" +
			"      consumes:\n" +
			"        - application/json\n" +
			"        - application/xml\n" +
			"      responses:\n" +
			"        '200':\n" +
			"          description: ok\n" +
			"    options:\n" +
			"      responses:\n" +
			"        '200':\n" +
			"          description: ok\n" +
			"  /items/{id}:\n" +
			"    put:\n" +
			"      responses:\n" +
			"        '200':\n" +
			"          description: ok\n" +
			"    delete:\n" +
			"      responses:\n" +
			"        '200':\n" +
			"          description: ok\n" +
			"    head:\n" +
			"      responses:\n" +
			"        '200':\n" +
			"          description: ok\n" +
			"    patch:\n" +
			"      responses:\n" +
			"        '200':\n" +
			"          description: ok\n";

	private static final String SWAGGER_JSON =
			"{\"swagger\":\"2.0\",\"info\":{\"title\":\"Sample API\",\"version\":\"1.0.0\"}," +
			"\"paths\":{\"/hello\":{\"get\":{\"responses\":{\"200\":{\"description\":\"ok\"}}}}}}";

	private static final String OPENAPI_YAML =
			"openapi: 3.0.1\n" +
			"info:\n" +
			"  title: Sample API\n" +
			"  version: 1.0.0\n" +
			"paths:\n" +
			"  /hello:\n" +
			"    get:\n" +
			"      responses:\n" +
			"        '200':\n" +
			"          description: ok\n";

	private static List<String> operazioni(List<ResourceInfo> resources) {
		return resources.stream().map(r -> r.getOp() + " " + r.getPath()).sorted().collect(Collectors.toList());
	}

	@Test
	void testIsSwagger_yaml_returnsTrue() {
		assertTrue(SwaggerUtils.isSwagger(SWAGGER_YAML.getBytes()));
	}

	@Test
	void testIsSwagger_json_returnsTrue() {
		assertTrue(SwaggerUtils.isSwagger(SWAGGER_JSON.getBytes()));
	}

	@Test
	void testIsSwagger_versioneNumerica_returnsTrue() {
		// swagger: 2.0 senza apici viene letto dal parser YAML come numero
		assertTrue(SwaggerUtils.isSwagger(SWAGGER_YAML.replace("swagger: '2.0'", "swagger: 2.0").getBytes()));
	}

	@Test
	void testIsSwagger_openapi_returnsFalse() {
		assertFalse(SwaggerUtils.isSwagger(OPENAPI_YAML.getBytes()));
	}

	@Test
	void testIsOpenapi_swagger_returnsFalse() {
		// I due riconoscimenti devono restare mutuamente esclusivi
		assertFalse(OpenapiUtils.isOpenapi(SWAGGER_YAML.getBytes()));
		assertFalse(OpenapiUtils.isOpenapi(SWAGGER_JSON.getBytes()));
	}

	@Test
	void testIsSwagger_documentiNonValidi_returnsFalse() {
		assertFalse(SwaggerUtils.isSwagger("invalid: [:::]".getBytes()));
		assertFalse(SwaggerUtils.isSwagger("{ non e` json".getBytes()));
		assertFalse(SwaggerUtils.isSwagger("testo libero".getBytes()));
		assertFalse(SwaggerUtils.isSwagger(new byte[0]));
		assertFalse(SwaggerUtils.isSwagger("[1, 2]".getBytes()));
	}

	@Test
	void testIsSwagger_strutturaIncompleta_returnsFalse() {
		assertFalse(SwaggerUtils.isSwagger(SWAGGER_YAML.replace("swagger: '2.0'", "swagger: '1.2'").getBytes()));
		assertFalse(SwaggerUtils.isSwagger(SWAGGER_YAML.replace("swagger: '2.0'\n", "").getBytes()));
		assertFalse(SwaggerUtils.isSwagger("swagger: '2.0'\ninfo:\n  title: t\n  version: 1\n".getBytes()));
		assertFalse(SwaggerUtils.isSwagger("swagger: '2.0'\npaths: {}\n".getBytes()));
		assertFalse(SwaggerUtils.isSwagger("swagger: '2.0'\ninfo:\n  title: t\n  version: 1\npaths: []\n".getBytes()));
	}

	@Test
	void testGetProtocolInfoFromSwagger_returnsExpectedResources() throws Exception {
		List<ResourceInfo> result = SwaggerUtils.getProtocolInfoFromSwagger(SWAGGER_YAML.getBytes());

		// parameters, estensioni x-* e OPTIONS non producono operazioni (come per OpenAPI 3)
		assertEquals(List.of("DELETE /items/{id}", "GET /hello", "HEAD /items/{id}", "PATCH /items/{id}", "POST /hello", "PUT /items/{id}"),
				operazioni(result));

		ResourceInfo post = result.stream().filter(r -> "POST".equals(r.getOp())).findFirst().orElseThrow();
		assertEquals(List.of("application/json", "application/xml"), post.getContentTypes());

		ResourceInfo get = result.stream().filter(r -> "GET".equals(r.getOp())).findFirst().orElseThrow();
		assertEquals(List.of(), get.getContentTypes());
	}

	@Test
	void testGetProtocolInfoFromSwagger_json() throws Exception {
		assertEquals(List.of("GET /hello"), operazioni(SwaggerUtils.getProtocolInfoFromSwagger(SWAGGER_JSON.getBytes())));
	}

	@Test
	void testGetProtocolInfoFromSwagger_pathsVuoto_returnsEmptyList() throws Exception {
		String swagger = "swagger: '2.0'\ninfo:\n  title: t\n  version: 1\npaths: {}\n";
		assertTrue(SwaggerUtils.getProtocolInfoFromSwagger(swagger.getBytes()).isEmpty());
	}

	@Test
	void testGetProtocolInfoFromSwagger_documentoNonSwagger_throwsException() {
		Exception ex = assertThrows(Exception.class, () -> SwaggerUtils.getProtocolInfoFromSwagger(OPENAPI_YAML.getBytes()));
		assertEquals("Impossibile recuperare le informazioni sulle azioni/risorse dal descrittore fornito", ex.getMessage());

		ex = assertThrows(Exception.class, () -> SwaggerUtils.getProtocolInfoFromSwagger("invalid: [:::]".getBytes()));
		assertEquals("Impossibile recuperare le informazioni sulle azioni/risorse dal descrittore fornito", ex.getMessage());
	}
}

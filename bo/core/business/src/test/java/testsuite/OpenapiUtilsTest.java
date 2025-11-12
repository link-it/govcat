package testsuite;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;

import org.govway.catalogo.core.business.utils.OpenapiUtils;
import org.govway.catalogo.core.business.utils.ResourceInfo;
import org.govway.catalogo.core.business.utils.YamltoJsonUtils;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class OpenapiUtilsTest {

	private static final String VALID_OPENAPI_YAML = 
		    "openapi: 3.0.1\n" +
		    "info:\n" +
		    "  title: Sample API\n" +
		    "  version: 1.0.0\n" +
		    "paths:\n" +
		    "  /hello:\n" +
		    "    get:\n" +
		    "      requestBody:\n" +
		    "        content:\n" +
		    "          application/json: {}\n" +
		    "    post:\n" +
		    "      requestBody:\n" +
		    "        content:\n" +
		    "          application/xml: {}\n";

    private static final byte[] VALID_OPENAPI_BYTES = VALID_OPENAPI_YAML.getBytes();

    @Test
    void testIsOpenapi_validYaml_returnsTrue() throws Exception {
        try (MockedStatic<YamltoJsonUtils> mocked = mockStatic(YamltoJsonUtils.class)) {
            mocked.when(() -> YamltoJsonUtils.convertYamlToJson(any())).thenReturn(VALID_OPENAPI_BYTES);

            boolean result = OpenapiUtils.isOpenapi(VALID_OPENAPI_BYTES);
            assertTrue(result);
        }
    }

    @Test
    void testIsOpenapi_invalidYaml_returnsFalse() {
        byte[] invalidYaml = "invalid: [:::]".getBytes();

        try (MockedStatic<YamltoJsonUtils> mocked = mockStatic(YamltoJsonUtils.class)) {
            mocked.when(() -> YamltoJsonUtils.convertYamlToJson(any()))
                  .thenThrow(new RuntimeException("Invalid YAML"));

            boolean result = OpenapiUtils.isOpenapi(invalidYaml);
            assertFalse(result);
        }
    }

    @Test
    void testGetProtocolInfoFromOpenapi_returnsExpectedResources() throws Exception {
        try (MockedStatic<YamltoJsonUtils> mocked = mockStatic(YamltoJsonUtils.class)) {
            mocked.when(() -> YamltoJsonUtils.convertYamlToJson(any())).thenReturn(VALID_OPENAPI_BYTES);

            List<ResourceInfo> result = OpenapiUtils.getProtocolInfoFromOpenapi(VALID_OPENAPI_BYTES);

            assertEquals(2, result.size());

            ResourceInfo get = new ResourceInfo();
            get.setOp("GET");
            get.setPath("/hello");
            get.setContentTypes(List.of("application/json"));

            ResourceInfo post = new ResourceInfo();
            post.setOp("POST");
            post.setPath("/hello");
            post.setContentTypes(List.of("application/xml"));

            boolean foundGet = result.stream().anyMatch(r ->
            "GET".equals(r.getOp()) &&
            "/hello".equals(r.getPath()) &&
            r.getContentTypes().equals(List.of("application/json"))
	        );
	        assertTrue(foundGet);

	        boolean foundPost = result.stream().anyMatch(r ->
            "POST".equals(r.getOp()) &&
            "/hello".equals(r.getPath()) &&
            r.getContentTypes().equals(List.of("application/xml"))
	        );
	        assertTrue(foundPost);
        }
    }

    @Test
    void testGetProtocolInfoFromOpenapi_throwsExceptionOnParseError() {
        try (MockedStatic<YamltoJsonUtils> mocked = mockStatic(YamltoJsonUtils.class)) {
            mocked.when(() -> YamltoJsonUtils.convertYamlToJson(any()))
                  .thenThrow(new RuntimeException("Parsing failed"));

            Exception ex = assertThrows(Exception.class,
                () -> OpenapiUtils.getProtocolInfoFromOpenapi("bad".getBytes()));

            assertEquals("Impossibile recuperare le informazioni sulle azioni/risorse dal descrittore fornito", ex.getMessage());
        }
    }
}

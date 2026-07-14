package testsuite;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.servlets.model.Problem;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.hateoas.Link;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Verifica che i link HATEOAS vuoti non vengano serializzati come "links": [] nelle response
 * (regressione introdotta da Spring Boot 4 / HATEOAS 3.x, corretta dal mixin
 * {@code RepresentationModelLinksMixin}). Usa l'ObjectMapper del message converter MVC reale.
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
public class HateoasLinksSerializationTest {

    @Autowired
    private RequestMappingHandlerAdapter adapter;

    private ObjectMapper responseObjectMapper() {
        for (HttpMessageConverter<?> c : adapter.getMessageConverters()) {
            if (c instanceof MappingJackson2HttpMessageConverter converter) {
                return converter.getObjectMapper();
            }
        }
        throw new IllegalStateException("MappingJackson2HttpMessageConverter non trovato");
    }

    @Test
    public void linksVuotiVengonoOmessi() throws Exception {
        Problem problem = new Problem();
        problem.setStatus(409);
        problem.setTitle("Conflict");
        String json = responseObjectMapper().writeValueAsString(problem);
        assertFalse(json.contains("\"links\""),
                "I links vuoti non devono comparire nella response. JSON: " + json);
    }

    @Test
    public void linksValorizzatiRestanoSerializzati() throws Exception {
        Problem problem = new Problem();
        problem.setStatus(409);
        problem.add(Link.of("https://example.org/x", "self"));
        String json = responseObjectMapper().writeValueAsString(problem);
        assertTrue(json.contains("\"links\""),
                "I links valorizzati devono essere serializzati. JSON: " + json);
    }
}

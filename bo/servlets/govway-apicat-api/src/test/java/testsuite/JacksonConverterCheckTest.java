package testsuite;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;

import org.govway.catalogo.OpenAPI2SpringBoot;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter;

/**
 * Guardia di regressione per il vincolo "Jackson 2" (Spring Boot 4 / Spring 7).
 *
 * Spring Framework 7 introduce {@code JacksonJsonHttpMessageConverter} basato su
 * Jackson 3 (tools.jackson) e deprecata {@code MappingJackson2HttpMessageConverter}.
 * L'applicazione deve continuare a serializzare con Jackson 2: verifichiamo che il
 * message converter MVC per application/json sia quello Jackson 2 e NON quello Jackson 3
 * (che serializzerebbe erroneamente i com.fasterxml JsonNode come POJO).
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
public class JacksonConverterCheckTest {

    @Autowired
    private RequestMappingHandlerAdapter adapter;

    @Test
    public void ilConverterJsonEJackson2() {
        boolean jackson2Presente = false;
        boolean jackson3Presente = false;
        for (HttpMessageConverter<?> c : adapter.getMessageConverters()) {
            boolean gestisceJson = c.getSupportedMediaTypes().stream()
                    .anyMatch(mt -> mt.includes(MediaType.APPLICATION_JSON));
            if (!gestisceJson) {
                continue;
            }
            String name = c.getClass().getName();
            if (name.equals("org.springframework.http.converter.json.MappingJackson2HttpMessageConverter")) {
                jackson2Presente = true;
            }
            if (name.equals("org.springframework.http.converter.json.JacksonJsonHttpMessageConverter")) {
                jackson3Presente = true;
            }
        }
        assertTrue(jackson2Presente,
                "Atteso il converter Jackson 2 (MappingJackson2HttpMessageConverter) per application/json");
        assertFalse(jackson3Presente,
                "Il converter Jackson 3 (JacksonJsonHttpMessageConverter) non deve gestire application/json: il vincolo e' restare su Jackson 2");
    }
}

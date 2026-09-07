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
package testsuite;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.fail;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.pdnd.controllers.PDNDMockServerV3;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.JsonParser;

/**
 * Verifica che le risposte del mock PDND v3, serializzate come lo sono in risposta HTTP,
 * siano accettate dal client v3 generato: quest'ultimo valida i campi obbligatori della
 * specifica e scarterebbe altrimenti la risposta.
 *
 * Regression test: risposte simulate prive dei campi data obbligatori (`createdAt`)
 * facevano fallire ogni invocazione verso il mock con un errore di deserializzazione.
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = OpenAPI2SpringBoot.class)
@EnableAutoConfiguration
@AutoConfigureTestDatabase(replace = Replace.ANY)
@ActiveProfiles("test")
public class PdndMockV3ConformitaTest {

    private static final UUID ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final String MODEL_CLIENT_V3 = "org.govway.catalogo.servlets.pdnd.v3.model.";

    @Autowired
    private RequestMappingHandlerAdapter adapter;

    @ParameterizedTest
    @ValueSource(strings = {"collaudo", "produzione"})
    public void leRisposteSimulateSonoAccettateDalClientV3(String ambiente) {
        ObjectMapper mapper = getObjectMapperRisposte();
        PDNDMockServerV3 server = new PDNDMockServerV3(ambiente);

        List<ResponseEntity<?>> risposte = new ArrayList<>();
        risposte.add(server.getStatus());
        risposte.add(server.getTenant(ID));
        risposte.add(server.getTenants(0, 50, "c_h501", null));
        risposte.add(server.getEService(ID));
        risposte.add(server.getEServices(0, 50, null, null, null, null, null, null, null, null));
        risposte.add(server.getEServiceDescriptor(ID, ID));
        risposte.add(server.getEServiceDescriptors(ID, 0, 50, null));
        risposte.add(server.getEServiceDescriptorDocuments(ID, ID, 0, 50));
        risposte.add(server.getEServiceDescriptorCertifiedAttributes(ID, ID, 0, 50));
        risposte.add(server.getEServiceDescriptorDeclaredAttributes(ID, ID, 0, 50));
        risposte.add(server.getEServiceDescriptorVerifiedAttributes(ID, ID, 0, 50));
        risposte.add(server.getAgreement(ID));
        risposte.add(server.getAgreements(0, 50, null, null, null, null, null));
        risposte.add(server.getAgreementPurposes(ID, 50, 0));
        risposte.add(server.getPurpose(ID));
        risposte.add(server.getPurposeAgreement(ID));
        risposte.add(server.getClient(ID));
        risposte.add(server.getJWKByKid("kid"));
        risposte.add(server.getCertifiedAttribute(ID));
        risposte.add(server.getDeclaredAttribute(ID));
        risposte.add(server.getVerifiedAttribute(ID));
        risposte.add(server.approveAgreement(ID));
        risposte.add(server.approvePurpose(ID));

        for (ResponseEntity<?> risposta : risposte) {
            Object body = risposta.getBody();
            assertNotNull(body, "risposta simulata senza corpo");
            validaConIlClientV3(mapper, body);
        }
    }

    /**
     * Serializza il corpo della risposta con l'ObjectMapper utilizzato per le risposte HTTP e
     * lo sottopone alla validazione della classe corrispondente del client v3.
     */
    private void validaConIlClientV3(ObjectMapper mapper, Object body) {
        String nome = body.getClass().getSimpleName();
        try {
            String json = mapper.writeValueAsString(body);

            Class<?> modelClient = Class.forName(MODEL_CLIENT_V3 + nome);
            Method validate = modelClient.getMethod("validateJsonElement", com.google.gson.JsonElement.class);
            validate.invoke(null, JsonParser.parseString(json));
        } catch (Exception e) {
            Throwable causa = e.getCause() != null ? e.getCause() : e;
            fail("La risposta simulata [" + nome + "] non e' accettata dal client v3: " + causa.getMessage());
        }
    }

    private ObjectMapper getObjectMapperRisposte() {
        for (HttpMessageConverter<?> c : this.adapter.getMessageConverters()) {
            if (c instanceof MappingJackson2HttpMessageConverter converter
                    && converter.getSupportedMediaTypes().stream()
                            .anyMatch(mt -> mt.includes(MediaType.APPLICATION_JSON))) {
                return converter.getObjectMapper();
            }
        }

        return fail("Converter Jackson 2 per application/json non presente");
    }
}

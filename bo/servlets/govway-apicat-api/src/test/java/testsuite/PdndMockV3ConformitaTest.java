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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.pdnd.controllers.PDNDClientV3;
import org.govway.catalogo.pdnd.controllers.PDNDMockServerV3;
import org.govway.catalogo.servlets.pdnd.v3.client.api.GatewayApi;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.AgreementRejection;
import org.govway.catalogo.servlets.pdnd.v3.mockserver.model.Document;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.JsonParser;

import okhttp3.Call;
import okhttp3.Protocol;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;

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
        risposte.add(server.rejectAgreement(ID, rifiuto()));
        risposte.add(server.suspendAgreement(ID));
        risposte.add(server.unsuspendAgreement(ID));
        risposte.add(server.suspendPurpose(ID));
        risposte.add(server.unsuspendPurpose(ID));

        // attributi assegnati al fruitore e registro degli attributi certificati
        risposte.add(server.getTenantCertifiedAttributes(ID, 0, 50));
        risposte.add(server.getTenantDeclaredAttributes(ID, 0, 50, null));
        risposte.add(server.getTenantVerifiedAttributes(ID, 0, 50));
        risposte.add(server.getTenantVerifiedAttributeVerifiers(ID, ID, 0, 50));
        risposte.add(server.getCertifiedAttributes(0, 50));
        risposte.add(server.assignTenantCertifiedAttribute(ID, null));
        risposte.add(server.revokeTenantCertifiedAttribute(ID, ID));

        // flussi di eventi
        risposte.add(server.getEServicesEvents(50, null, null));
        risposte.add(server.getKeyEvents(50, null));
        risposte.add(server.getAgreementsEvents(50, null, null));
        risposte.add(server.getPurposeEvents(50, null, null));

        for (ResponseEntity<?> risposta : risposte) {
            Object body = risposta.getBody();
            assertNotNull(body, "risposta simulata senza corpo");
            validaConIlClientV3(mapper, body);
        }
    }

    /**
     * Il download non restituisce un modello json ma un multipart: la conformita' si verifica
     * sottoponendo la risposta simulata al client, che e' quanto accade in esecuzione.
     */
    @ParameterizedTest
    @ValueSource(strings = {"collaudo", "produzione"})
    public void ilDocumentoSimulatoELeggibileDalClientV3(String ambiente) throws Exception {
        PDNDMockServerV3 server = new PDNDMockServerV3(ambiente);

        Document documento = server.getEServiceDescriptorDocuments(ID, ID, 0, 50).getBody().getResults().get(0);
        ResponseEntity<Resource> simulata = server.downloadEServiceDescriptorDocument(ID, ID, documento.getId());

        GatewayApi api = mock(GatewayApi.class);
        Call chiamata = mock(Call.class);
        when(chiamata.execute()).thenReturn(toResponse(simulata));
        when(api.downloadEServiceDescriptorDocumentCall(ID, ID, documento.getId(), null)).thenReturn(chiamata);

        ResponseEntity<Resource> scaricato =
                new PDNDClientV3(api).downloadEServiceDescriptorDocument(ID, ID, documento.getId());

        assertEquals(documento.getName(), scaricato.getHeaders().getContentDisposition().getFilename());
        assertEquals(MediaType.parseMediaType(documento.getContentType()),
                scaricato.getHeaders().getContentType());
        assertTrue(new String(scaricato.getBody().getInputStream().readAllBytes(), StandardCharsets.UTF_8)
                .contains("openapi: 3.0.3"));
    }

    /** Traduce la risposta simulata nella risposta http che il client riceverebbe dalla PDND. */
    private Response toResponse(ResponseEntity<Resource> simulata) throws IOException {
        return new Response.Builder()
                .request(new Request.Builder().url("https://pdnd.example.gov.it/v3/download").build())
                .protocol(Protocol.HTTP_1_1)
                .code(simulata.getStatusCode().value())
                .message("OK")
                .body(ResponseBody.create(simulata.getBody().getInputStream().readAllBytes(),
                        okhttp3.MediaType.parse(simulata.getHeaders().getContentType().toString())))
                .build();
    }

    /** Motivazione del rifiuto conforme al contratto: almeno venti caratteri. */
    private AgreementRejection rifiuto() {
        AgreementRejection rifiuto = new AgreementRejection();
        rifiuto.setReason("La richiesta non riporta la finalita' del trattamento dei dati");
        return rifiuto;
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

package testsuite;

import com.google.gson.JsonElement;
import com.google.gson.JsonParser;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.govway.catalogo.gest.clients.govwayconfig.ExtendedJSON;
import org.govway.catalogo.gest.clients.govwayconfig.model.ApiInterfacciaRest;
import org.govway.catalogo.gest.clients.govwayconfig.model.ApiInterfacciaSoap;

import org.govway.catalogo.gest.clients.govwayconfig.model.OneOfApiBaseTipoInterfaccia;
import org.govway.catalogo.gest.clients.govwayconfig.model.OneOfControlloAccessiAutenticazioneAutenticazione;

import org.govway.catalogo.gest.clients.govwayconfig.model.TipoApiEnum;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

public class ExtendedJSONTest {

    private ExtendedJSON extendedJSON;
    private Gson gson;

    @BeforeEach
    void setUp() {
        extendedJSON = new ExtendedJSON();
        gson = extendedJSON.getGson();
    }

    @Test
    void testDeserializeApiInterfacciaSoap() {
        String json = "{ \"protocollo\": \"" + TipoApiEnum.SOAP + "\", \"campoSoap\": \"valore1\" }";
        JsonElement jsonElement = JsonParser.parseString(json);
        OneOfApiBaseTipoInterfaccia result = gson.fromJson(jsonElement, OneOfApiBaseTipoInterfaccia.class);
        assertThat(result).isInstanceOf(ApiInterfacciaSoap.class);
        assertThat(((ApiInterfacciaSoap) result).getProtocollo()).isEqualTo(TipoApiEnum.SOAP);
    }

    @Test
    void testDeserializeApiInterfacciaRest() {
        String json = "{ \"protocollo\": \"" + TipoApiEnum.REST + "\", \"campoRest\": \"valore2\" }";
        JsonElement jsonElement = JsonParser.parseString(json);
        OneOfApiBaseTipoInterfaccia result = gson.fromJson(jsonElement, OneOfApiBaseTipoInterfaccia.class);
        assertThat(result).isInstanceOf(ApiInterfacciaRest.class);
        assertThat(((ApiInterfacciaRest) result).getProtocollo()).isEqualTo(TipoApiEnum.REST);
    }

    /*
    @Test
    void testDeserializeAutenticazioneJwt() {
        String json = "{ \"tipo\": \"JWT\", \"issuer\": \"issuerTest\" }";
        OneOfControlloAccessiAutenticazioneAutenticazione result =
                gson.fromJson(json, OneOfControlloAccessiAutenticazioneAutenticazione.class);
        assertThat(result).isInstanceOf(APIImplAutenticazioneJwt.class);
        assertThat(((APIImplAutenticazioneJwt) result).getIssuer()).isEqualTo("issuerTest");
    }
	*/
    @Test
    void testSerializeAndDeserializeOffsetDateTime() {
        OffsetDateTime now = OffsetDateTime.of(2024, 6, 26, 12, 34, 56, 0, ZoneOffset.UTC);
        String json = gson.toJson(now);
        OffsetDateTime deserialized = gson.fromJson(json, OffsetDateTime.class);
        assertThat(deserialized).isEqualTo(now);
    }

    @Test
    void testSerializeAndDeserializeLocalDate() {
        LocalDate today = LocalDate.of(2024, 6, 26);
        String json = gson.toJson(today);
        LocalDate deserialized = gson.fromJson(json, LocalDate.class);
        assertThat(deserialized).isEqualTo(today);
    }
    /*
    @Test
    void testSerializeAndDeserializeEnum() {
        StatoEnum stato = StatoEnum.ATTIVO;
        String json = gson.toJson(stato);
        StatoEnum deserialized = gson.fromJson(json, StatoEnum.class);
        assertThat(deserialized).isEqualTo(stato);
    }
	*/
    
    @Test
    void testPrettyPrintJson() {
        String json = "{ \"a\":1, \"b\":2 }";
        JsonElement element = JsonParser.parseString(json);

        Gson prettyGson = new GsonBuilder().setPrettyPrinting().create();
        String pretty = prettyGson.toJson(element);

        assertThat(pretty).contains("\n");
        assertThat(pretty).contains("\"a\": 1");
        assertThat(pretty).contains("\"b\": 2");
    }

    @Test
    void testDeserializeUnknownProtocolReturnsNull() {
        String json = "{ \"protocollo\": \"IGNOTO\" }";
        OneOfApiBaseTipoInterfaccia result = gson.fromJson(json, OneOfApiBaseTipoInterfaccia.class);
        assertThat(result).isNull();
    }

    @Test
    void testDeserializeUnknownTipoReturnsNull() {
        String json = "{ \"tipo\": \"X509\" }";
        OneOfControlloAccessiAutenticazioneAutenticazione result =
                gson.fromJson(json, OneOfControlloAccessiAutenticazioneAutenticazione.class);
        assertThat(result).isNull();
    }
}

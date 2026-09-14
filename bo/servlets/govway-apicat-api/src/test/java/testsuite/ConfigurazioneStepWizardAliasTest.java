package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.List;

import org.govway.catalogo.OpenAPI2SpringBoot;
import org.govway.catalogo.servlets.model.ConfigurazioneStepWizard;
import org.govway.catalogo.servlets.model.ConfigurazioneStepWizardSezione;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;

/**
 * La chiave degli stati negli step del wizard si chiamava {@code stati_adesione} ed e' stata
 * rinominata in {@code stati} da quando lo schema e' condiviso con il wizard dei servizi.
 *
 * <p>L'ObjectMapper che legge il {@code configurazione.json} ha FAIL_ON_UNKNOWN_PROPERTIES attivo:
 * senza l'alias registrato da {@code OpenAPI2SpringBoot.stepWizardStatiAliasModule()} un file di
 * configurazione scritto per una versione precedente (comprese quelle dei plugin custom)
 * impedirebbe l'avvio dell'applicazione. Questi test verificano che entrambi i nomi siano
 * accettati in lettura.
 */
public class ConfigurazioneStepWizardAliasTest {

	private ObjectMapper mapper() {
		ObjectMapper om = new ObjectMapper();
		om.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
		om.registerModule(OpenAPI2SpringBoot.stepWizardStatiAliasModule());
		return om;
	}

	@Test
	public void chiaveNuovaLetta() throws Exception {
		String json = "{\"code\":\"collaudo\",\"descrizione\":\"Collaudo\","
				+ "\"stati\":[\"bozza\",\"richiesto_collaudo\"],\"sezioni_attive\":[\"collaudo\"]}";

		ConfigurazioneStepWizard step = mapper().readValue(json, ConfigurazioneStepWizard.class);

		assertEquals(List.of("bozza", "richiesto_collaudo"), step.getStati());
		assertEquals(List.of("collaudo"), step.getSezioniAttive());
	}

	@Test
	public void chiaveDeprecataAncoraLetta() throws Exception {
		String json = "{\"code\":\"collaudo\",\"descrizione\":\"Collaudo\","
				+ "\"stati_adesione\":[\"bozza\",\"richiesto_collaudo\"],\"sezioni_attive\":[\"collaudo\"]}";

		ConfigurazioneStepWizard step = mapper().readValue(json, ConfigurazioneStepWizard.class);

		assertNotNull(step.getStati(), "la chiave deprecata 'stati_adesione' deve popolare 'stati'");
		assertEquals(List.of("bozza", "richiesto_collaudo"), step.getStati());
	}

	@Test
	public void chiaveDeprecataAncoraLettaNelleSezioni() throws Exception {
		String json = "{\"code\":\"in_compilazione\",\"descrizione\":\"In Compilazione\","
				+ "\"stati_adesione\":[\"bozza\"]}";

		ConfigurazioneStepWizardSezione sezione = mapper().readValue(json, ConfigurazioneStepWizardSezione.class);

		assertEquals(List.of("bozza"), sezione.getStati());
	}
}

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

import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.EstensioneAdesioneEntity;
import org.govway.catalogo.pdnd.controllers.IPDNDClient;
import org.govway.catalogo.pdnd.controllers.PDNDClientFactory;
import org.govway.catalogo.services.RateLimitingFinalitaService;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneRateLimitingFinalita;
import org.govway.catalogo.servlets.model.ConfigurazioneRiferimentoProprietaCustom;
import org.govway.catalogo.servlets.pdnd.model.Purpose;
import org.govway.catalogo.servlets.pdnd.model.PurposeState;
import org.govway.catalogo.servlets.pdnd.model.PurposeWaitingForApproval;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.persistence.EntityManager;

/**
 * Supporto ai test del confronto delle quote di rate limiting con le finalita` PDND (Issue 446):
 * proprieta` della finalita` in configurazione, PDND simulata e finalita` indicata dall'adesione.
 */
final class FinalitaPdndTestUtils {

	/** Gruppi e proprieta` della finalita` fra le proprieta_custom delle adesioni del configurazione.json di test. */
	static final String GRUPPO_COLLAUDO = "PDNDCollaudo";
	static final String GRUPPO_PRODUZIONE = "PDNDProduzione";
	static final String PROPRIETA = "finalita";

	private static final String CAMPO_FACTORY = "pdndClientFactory";

	private FinalitaPdndTestUtils() {}

	/** Stato da ripristinare a fine test: configurazione della finalita` e factory PDND originali. */
	record Ripristino(Configurazione configurazione, ConfigurazioneRateLimitingFinalita finalita,
			RateLimitingFinalitaService service, Object factory) {

		void esegui() {
			this.configurazione.getAdesione().getRateLimiting().setFinalita(this.finalita);
			ReflectionTestUtils.setField(this.service, CAMPO_FACTORY, this.factory);
		}
	}

	/**
	 * Indica la proprieta` della finalita` per il collaudo (la produzione resta non configurata) e
	 * sostituisce la PDND con il client simulato indicato, per entrambi gli ambienti.
	 */
	static Ripristino configura(Configurazione configurazione, RateLimitingFinalitaService service, IPDNDClient client) {
		Ripristino ripristino = new Ripristino(configurazione, configurazione.getAdesione().getRateLimiting().getFinalita(),
				service, ReflectionTestUtils.getField(service, CAMPO_FACTORY));

		configurazione.getAdesione().getRateLimiting().setFinalita(new ConfigurazioneRateLimitingFinalita()
				.collaudo(new ConfigurazioneRiferimentoProprietaCustom().nomeGruppo(GRUPPO_COLLAUDO).nomeProprieta(PROPRIETA)));

		PDNDClientFactory factory = mock(PDNDClientFactory.class);
		when(factory.getClientCollaudo()).thenReturn(client);
		when(factory.getClientProduzione()).thenReturn(client);
		ReflectionTestUtils.setField(service, CAMPO_FACTORY, factory);

		return ripristino;
	}

	/** La PDND simulata restituisce la finalita` attiva indicata. */
	static void simulaFinalita(IPDNDClient client, String purposeId, String titolo, int quota, Integer quotaInAttesa) {
		Purpose purpose = new Purpose();
		purpose.setId(UUID.fromString(purposeId));
		purpose.setTitle(titolo);
		purpose.setThroughput(quota);
		purpose.setState(PurposeState.ACTIVE);
		if(quotaInAttesa != null) {
			PurposeWaitingForApproval inAttesa = new PurposeWaitingForApproval();
			inAttesa.setId(UUID.randomUUID());
			inAttesa.setThroughput(quotaInAttesa);
			purpose.setWaitingForApproval(inAttesa);
		}
		// doReturn: ridefinisce anche uno stub precedente che lancia un'eccezione
		doReturn(ResponseEntity.ok(purpose)).when(client).getPurpose(UUID.fromString(purposeId));
	}

	/** Valorizza sul DB la proprieta` della finalita` dell'adesione nell'ambiente (non specifica per API). */
	static void setFinalitaAdesione(EntityManager entityManager, UUID idAdesione, AmbienteEnum ambiente, String purposeId) {
		AdesioneEntity adesione = entityManager.createQuery("SELECT a FROM AdesioneEntity a WHERE a.idAdesione = :id", AdesioneEntity.class)
				.setParameter("id", idAdesione.toString())
				.getSingleResult();

		EstensioneAdesioneEntity estensione = new EstensioneAdesioneEntity();
		estensione.setAdesione(adesione);
		estensione.setAmbiente(ambiente);
		estensione.setGruppo(AmbienteEnum.COLLAUDO.equals(ambiente) ? GRUPPO_COLLAUDO : GRUPPO_PRODUZIONE);
		estensione.setNome(PROPRIETA);
		estensione.setValore(purposeId);
		entityManager.persist(estensione);
		entityManager.flush();
	}
}

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
package org.govway.catalogo.services;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.govway.catalogo.core.dao.specifications.ClientSpecification;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity.AuthType;
import org.govway.catalogo.core.orm.entity.EstensioneClientEntity;
import org.govway.catalogo.core.services.ClientService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Servizio per la verifica periodica delle scadenze dei certificati di autenticazione dei client.
 * Mantiene in memoria l'elenco dei client con certificato in scadenza, aggiornato periodicamente.
 */
@Service
public class CertificatoScadenzaService {

	private static final String CERTIFICATO_AUTENTICAZIONE = "autenticazione_CERTIFICATO";

	private static final int PAGE_SIZE = 50;

	private static final List<AuthType> AUTH_TYPES_CON_CERTIFICATO = Arrays.asList(
		AuthType.HTTPS, AuthType.HTTPS_SIGN, AuthType.HTTPS_PDND, AuthType.HTTPS_PDND_SIGN
	);

	private Logger logger = LoggerFactory.getLogger(CertificatoScadenzaService.class);

	@Autowired
	private ClientService clientService;

	@Value("${certificati.scadenza.giorni:30}")
	private int giorniScadenza;

	private volatile Set<Long> clientIdsInScadenza = Collections.emptySet();

	private volatile Map<UUID, Date> clientScadenzeCertificato = Collections.emptyMap();

	/**
	 * Verifica le scadenze dei certificati di autenticazione.
	 * Eseguito all'avvio dell'applicativo e poi ogni 24 ore.
	 */
	@Scheduled(fixedDelay = 86400000, initialDelay = 0)
	public void verificaScadenzeCertificati() {
		this.logger.info("Avvio verifica scadenze certificati (soglia: {} giorni)", this.giorniScadenza);

		try {
			Set<Long> nuoviIds = new HashSet<>();
			Map<UUID, Date> nuoveScadenze = new HashMap<>();

			this.clientService.runTransaction(() -> {
				Date soglia = Date.from(Instant.now().plus(this.giorniScadenza, ChronoUnit.DAYS));

				for (AuthType authType : AUTH_TYPES_CON_CERTIFICATO) {
					verificaClientPerAuthType(authType, soglia, nuoviIds, nuoveScadenze);
				}
			});

			this.clientIdsInScadenza = Collections.unmodifiableSet(nuoviIds);
			this.clientScadenzeCertificato = Collections.unmodifiableMap(nuoveScadenze);
			this.logger.info("Verifica scadenze completata: {} client con certificato in scadenza", nuoviIds.size());

		} catch (Exception e) {
			this.logger.error("Errore durante la verifica delle scadenze dei certificati: " + e.getMessage(), e);
		}
	}

	public Set<Long> getClientIdsInScadenza() {
		return this.clientIdsInScadenza;
	}

	public Map<UUID, Date> getClientScadenzeCertificato() {
		return this.clientScadenzeCertificato;
	}

	private void verificaClientPerAuthType(AuthType authType, Date soglia, Set<Long> ids, Map<UUID, Date> scadenze) {
		int pageNumber = 0;
		Page<ClientEntity> page;

		do {
			ClientSpecification spec = new ClientSpecification();
			spec.setAuthType(Optional.of(authType));

			page = this.clientService.findAll(spec, PageRequest.of(pageNumber, PAGE_SIZE));

			for (ClientEntity client : page.getContent()) {
				try {
					Date scadenza = getScadenzaCertificato(client);
					if (scadenza != null && scadenza.before(soglia)) {
						ids.add(client.getId());
						scadenze.put(UUID.fromString(client.getIdClient()), scadenza);
						this.logger.debug("Client {} (id={}) ha certificato in scadenza: {}",
							client.getNome(), client.getId(), scadenza);
					}
				} catch (Exception e) {
					this.logger.warn("Errore verifica certificato per client {} (id={}): {}",
						client.getNome(), client.getId(), e.getMessage());
				}
			}

			pageNumber++;
		} while (page.hasNext());
	}

	private Date getScadenzaCertificato(ClientEntity client) {
		Optional<EstensioneClientEntity> certEstensione = client.getEstensioni().stream()
			.filter(e -> CERTIFICATO_AUTENTICAZIONE.equals(e.getNome()))
			.findAny();

		if (certEstensione.isEmpty() || certEstensione.get().getDocumento() == null
				|| certEstensione.get().getDocumento().getRawData() == null) {
			return null;
		}

		try (InputStream certStream = new ByteArrayInputStream(certEstensione.get().getDocumento().getRawData())) {
			CertificateFactory cf = CertificateFactory.getInstance("X.509");
			X509Certificate certificate = (X509Certificate) cf.generateCertificate(certStream);
			return certificate.getNotAfter();
		} catch (Exception e) {
			this.logger.warn("Impossibile leggere il certificato per il client {} (id={}): {}",
				client.getNome(), client.getId(), e.getMessage());
			return null;
		}
	}
}

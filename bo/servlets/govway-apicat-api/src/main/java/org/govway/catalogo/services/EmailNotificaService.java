/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
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

import java.util.List;

import org.govway.catalogo.core.dao.specifications.NotificaSpecification;
import org.govway.catalogo.core.orm.entity.NotificaEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.NotificaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Servizio per l'invio delle email delle notifiche.
 * Recupera le notifiche di tipo email non ancora inviate e le invia.
 */
@Service
public class EmailNotificaService {

	private Logger logger = LoggerFactory.getLogger(EmailNotificaService.class);

	@Autowired(required = false)
	private JavaMailSender mailSender;

	@Autowired
	private NotificaService notificaService;

	@Value("${email.notifiche.from:no-reply@govcat.it}")
	private String fromAddress;

	@Value("${email.notifiche.enabled:true}")
	private boolean emailEnabled;

	@Value("${email.notifiche.batch.size:50}")
	private int batchSize;

	/**
	 * Elabora le notifiche email pendenti in batch.
	 * Questo metodo viene eseguito periodicamente secondo la schedulazione configurata.
	 */
	@Scheduled(fixedDelayString = "${email.notifiche.schedule.delay:60000}", initialDelayString = "${email.notifiche.schedule.initial:10000}")
	public void processEmailNotifichePendenti() {
		if (!emailEnabled) {
			this.logger.debug("Invio email notifiche disabilitato");
			return;
		}

		if (mailSender == null) {
			this.logger.warn("JavaMailSender non configurato, impossibile inviare email");
			return;
		}

		try {
			this.notificaService.runTransaction(() -> {
				elaboraEmailPendenti();
			});
		} catch (Exception e) {
			this.logger.error("Errore durante l'elaborazione delle email pendenti: " + e.getMessage(), e);
		}
	}

	/**
	 * Elabora le email pendenti all'interno di una transazione.
	 */
	private void elaboraEmailPendenti() {
		NotificaSpecification spec = new NotificaSpecification();
		spec.setSoloEmailNonInviate(true);

		Page<NotificaEntity> notifiche = this.notificaService.findAll(spec, PageRequest.of(0, batchSize));

		if (notifiche.isEmpty()) {
			this.logger.debug("Nessuna email da inviare");
			return;
		}

		this.logger.info("Trovate {} email da inviare", notifiche.getTotalElements());

		List<NotificaEntity> content = notifiche.getContent();
		for (NotificaEntity notifica : content) {
			try {
				inviaEmail(notifica);
				notifica.setEmailInviata(true);
				this.notificaService.save(notifica);
				this.logger.info("Email inviata con successo per notifica {}", notifica.getIdNotifica());
			} catch (Exception e) {
				this.logger.error("Errore durante l'invio dell'email per notifica {}: {}",
						notifica.getIdNotifica(), e.getMessage(), e);
				// Non aggiorniamo emailInviata, sarà riprovata al prossimo ciclo
			}
		}
	}

	/**
	 * Invia un'email per una singola notifica.
	 */
	private void inviaEmail(NotificaEntity notifica) throws MailException {
		UtenteEntity destinatario = notifica.getDestinatario();

		String emailDestinatario = getEmailDestinatario(destinatario);
		if (emailDestinatario == null || emailDestinatario.isBlank()) {
			this.logger.warn("Destinatario {} senza indirizzo email, notifica {} marcata come inviata",
					destinatario.getPrincipal(), notifica.getIdNotifica());
			return;
		}

		SimpleMailMessage message = new SimpleMailMessage();
		message.setFrom(fromAddress);
		message.setTo(emailDestinatario);
		message.setSubject(buildSubject(notifica));
		message.setText(buildBody(notifica));

		this.logger.debug("Invio email a {} per notifica {}", emailDestinatario, notifica.getIdNotifica());
		mailSender.send(message);
	}

	/**
	 * Restituisce l'indirizzo email del destinatario.
	 * Preferisce l'email aziendale se presente, altrimenti usa l'email personale.
	 */
	private String getEmailDestinatario(UtenteEntity utente) {
		if (utente.getEmailAziendale() != null && !utente.getEmailAziendale().isBlank()) {
			return utente.getEmailAziendale();
		}
		return utente.getEmail();
	}

	/**
	 * Costruisce l'oggetto dell'email basandosi sulla notifica.
	 */
	private String buildSubject(NotificaEntity notifica) {
		StringBuilder sb = new StringBuilder("[GovCat] ");

		if (notifica.getInfoOggetto() != null && !notifica.getInfoOggetto().isBlank()) {
			sb.append(notifica.getInfoOggetto());
		} else {
			switch (notifica.getTipo()) {
				case COMUNICAZIONE_EMAIL:
					sb.append("Nuova comunicazione");
					break;
				case CAMBIO_STATO_EMAIL:
					sb.append("Cambio stato");
					break;
				default:
					sb.append("Notifica");
			}
		}

		return sb.toString();
	}

	/**
	 * Costruisce il corpo dell'email basandosi sulla notifica.
	 */
	private String buildBody(NotificaEntity notifica) {
		StringBuilder sb = new StringBuilder();

		sb.append("Gentile ").append(notifica.getDestinatario().getNome())
		  .append(" ").append(notifica.getDestinatario().getCognome()).append(",\n\n");

		if (notifica.getInfoMessaggio() != null && !notifica.getInfoMessaggio().isBlank()) {
			sb.append(notifica.getInfoMessaggio());
		} else {
			switch (notifica.getTipo()) {
				case COMUNICAZIONE_EMAIL:
					sb.append("Hai ricevuto una nuova comunicazione.");
					break;
				case CAMBIO_STATO_EMAIL:
					sb.append("Si è verificato un cambio di stato");
					if (notifica.getInfoStato() != null) {
						sb.append(": ").append(notifica.getInfoStato());
					}
					sb.append(".");
					break;
				default:
					sb.append("Hai ricevuto una nuova notifica.");
			}
		}

		sb.append("\n\n");
		sb.append("Accedi al portale per maggiori dettagli.\n\n");
		sb.append("Cordiali saluti,\n");
		sb.append("Il team GovCat");

		return sb.toString();
	}

	/**
	 * Invia un'email immediatamente (asincrono).
	 * Utile per inviare email urgenti senza attendere il batch.
	 */
	@Async
	public void inviaEmailAsync(NotificaEntity notifica) {
		if (!emailEnabled || mailSender == null) {
			return;
		}

		try {
			this.notificaService.runTransaction(() -> {
				try {
					inviaEmail(notifica);
					notifica.setEmailInviata(true);
					this.notificaService.save(notifica);
				} catch (Exception e) {
					this.logger.error("Errore durante l'invio asincrono dell'email: " + e.getMessage(), e);
				}
			});
		} catch (Exception e) {
			this.logger.error("Errore durante la transazione per l'invio email: " + e.getMessage(), e);
		}
	}
}

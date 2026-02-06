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
import java.util.Locale;

import org.govway.catalogo.core.dao.specifications.NotificaSpecification;
import org.govway.catalogo.core.orm.entity.NotificaEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.NotificaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;

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

	@Autowired
	private MessageSource messageSource;

	@Value("${email.notifiche.from:no-reply@govcat.it}")
	private String fromAddress;

	@Value("${email.notifiche.enabled:true}")
	private boolean emailEnabled;

	@Value("${email.notifiche.batch.size:50}")
	private int batchSize;

	@Value("${email.notifiche.locale:it}")
	private String localeCode;

	@Value("${email.notifiche.portal.url:}")
	private String portalUrl;

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
	 * L'email viene inviata in formato multipart/alternative con versione plain text e HTML.
	 */
	private void inviaEmail(NotificaEntity notifica) throws MailException, MessagingException {
		UtenteEntity destinatario = notifica.getDestinatario();

		String emailDestinatario = getEmailDestinatario(destinatario);
		if (emailDestinatario == null || emailDestinatario.isBlank()) {
			this.logger.warn("Destinatario {} senza indirizzo email, notifica {} marcata come inviata",
					destinatario.getPrincipal(), notifica.getIdNotifica());
			return;
		}

		MimeMessage mimeMessage = mailSender.createMimeMessage();
		MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");

		helper.setFrom(fromAddress);
		helper.setTo(emailDestinatario);
		helper.setSubject(buildSubject(notifica));

		String textBody = buildTextBody(notifica);
		String htmlBody = buildHtmlBody(notifica);

		// Crea struttura multipart/alternative semplice
		MimeMultipart multipart = new MimeMultipart("alternative");

		// Parte plain text
		MimeBodyPart textPart = new MimeBodyPart();
		textPart.setText(textBody, "UTF-8", "plain");

		// Parte HTML
		MimeBodyPart htmlPart = new MimeBodyPart();
		htmlPart.setText(htmlBody, "UTF-8", "html");

		// L'ordine è importante: prima text, poi html (i client preferiscono l'ultimo che possono renderizzare)
		multipart.addBodyPart(textPart);
		multipart.addBodyPart(htmlPart);

		mimeMessage.setContent(multipart);

		this.logger.debug("Invio email a {} per notifica {}", emailDestinatario, notifica.getIdNotifica());
		mailSender.send(mimeMessage);
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
	 * Restituisce il Locale configurato per le email.
	 */
	private Locale getLocale() {
		Locale locale = new Locale(localeCode);
		this.logger.debug("Locale configurato per le email: {} (da localeCode={})", locale, localeCode);
		return locale;
	}

	/**
	 * Ottiene un messaggio localizzato dal MessageSource.
	 */
	private String getMessage(String key, Object... args) {
		return messageSource.getMessage(key, args, getLocale());
	}

	/**
	 * Costruisce l'oggetto dell'email basandosi sulla notifica.
	 */
	private String buildSubject(NotificaEntity notifica) {
		StringBuilder sb = new StringBuilder(getMessage("email.subject.prefix"));
		sb.append(" ");

		if (notifica.getInfoOggetto() != null && !notifica.getInfoOggetto().isBlank()) {
			sb.append(notifica.getInfoOggetto());
		} else {
			switch (notifica.getTipo()) {
				case COMUNICAZIONE_EMAIL:
					sb.append(getMessage("email.subject.comunicazione"));
					break;
				case CAMBIO_STATO_EMAIL:
					sb.append(getMessage("email.subject.cambio_stato"));
					break;
				default:
					sb.append(getMessage("email.subject.default"));
			}
		}

		return sb.toString();
	}

	/**
	 * Costruisce il corpo dell'email in formato plain text.
	 */
	private String buildTextBody(NotificaEntity notifica) {
		StringBuilder sb = new StringBuilder();

		// Saluto iniziale con nome e cognome
		sb.append(getMessage("email.body.text.greeting",
				notifica.getDestinatario().getNome(),
				notifica.getDestinatario().getCognome()));
		sb.append("\n\n");

		if (notifica.getInfoMessaggio() != null && !notifica.getInfoMessaggio().isBlank()) {
			sb.append(notifica.getInfoMessaggio());
		} else {
			switch (notifica.getTipo()) {
				case COMUNICAZIONE_EMAIL:
					sb.append(getMessage("email.body.text.comunicazione"));
					break;
				case CAMBIO_STATO_EMAIL:
					if (notifica.getInfoStato() != null && !notifica.getInfoStato().isBlank()) {
						sb.append(getMessage("email.body.text.cambio_stato.con_stato", notifica.getInfoStato()));
					} else {
						sb.append(getMessage("email.body.text.cambio_stato")).append(".");
					}
					break;
				default:
					sb.append(getMessage("email.body.text.default"));
			}
		}

		sb.append("\n\n");
		sb.append(getMessage("email.body.text.portal_link", portalUrl)).append("\n\n");
		sb.append(getMessage("email.body.text.regards")).append("\n");
		sb.append(getMessage("email.body.text.signature"));

		return sb.toString();
	}

	/**
	 * Costruisce il corpo dell'email in formato HTML.
	 */
	private String buildHtmlBody(NotificaEntity notifica) {
		StringBuilder sb = new StringBuilder();

		// Struttura HTML completa
		sb.append("<!DOCTYPE html>");
		sb.append("<html>");
		sb.append("<head>");
		sb.append("<meta charset=\"UTF-8\">");
		sb.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
		sb.append("</head>");
		sb.append("<body style=\"margin:0;padding:20px;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;\">");
		sb.append("<div style=\"max-width:600px;margin:0 auto;background-color:#ffffff;padding:30px;border-radius:8px;\">");

		// Saluto iniziale con nome e cognome
		sb.append(getMessage("email.body.html.greeting",
				notifica.getDestinatario().getNome(),
				notifica.getDestinatario().getCognome()));

		if (notifica.getInfoMessaggio() != null && !notifica.getInfoMessaggio().isBlank()) {
			sb.append("<p style=\"padding-bottom:0px;margin-bottom:-5px;font-size:16px;color:#333333;line-height:1.5;text-align:left;\">");
			sb.append(notifica.getInfoMessaggio());
			sb.append("</p>");
		} else {
			switch (notifica.getTipo()) {
				case COMUNICAZIONE_EMAIL:
					sb.append(getMessage("email.body.html.comunicazione"));
					break;
				case CAMBIO_STATO_EMAIL:
					if (notifica.getInfoStato() != null && !notifica.getInfoStato().isBlank()) {
						sb.append(getMessage("email.body.html.cambio_stato.con_stato", notifica.getInfoStato()));
					} else {
						sb.append(getMessage("email.body.html.cambio_stato"));
					}
					break;
				default:
					sb.append(getMessage("email.body.html.default"));
			}
		}

		sb.append(getMessage("email.body.html.portal_link", portalUrl));
		sb.append(getMessage("email.body.html.regards"));
		sb.append(getMessage("email.body.html.signature"));

		// Chiusura struttura HTML
		sb.append("</div>");
		sb.append("</body>");
		sb.append("</html>");

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

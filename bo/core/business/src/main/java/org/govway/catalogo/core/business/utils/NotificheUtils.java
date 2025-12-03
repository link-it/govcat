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
package org.govway.catalogo.core.business.utils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.MessaggioAdesioneEntity;
import org.govway.catalogo.core.orm.entity.MessaggioServizioEntity;
import org.govway.catalogo.core.orm.entity.NotificaEntity;
import org.govway.catalogo.core.orm.entity.NotificaEntity.STATO;
import org.govway.catalogo.core.orm.entity.NotificaEntity.TIPO;
import org.govway.catalogo.core.orm.entity.NotificaEntity.TIPO_ENTITA;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.StatoAdesioneEntity;
import org.govway.catalogo.core.orm.entity.StatoServizioEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.AdesioneService;
import org.govway.catalogo.core.services.ServizioService;
import org.springframework.beans.factory.annotation.Autowired;

public class NotificheUtils {

	@Autowired
	private ServizioService servizioService;
	
	@Autowired
	private AdesioneService adesioneService;
	
	public List<NotificaEntity> getNotificheCreazioneServizio(ServizioEntity servizio) {

		MessaggioServizioEntity entity = new MessaggioServizioEntity();
		entity.setUuid(UUID.randomUUID().toString());
		entity.setData(new Date());
		entity.setUtente(servizio.getRichiedente());
		entity.setServizio(servizio);
		entity.setOggetto("Creazione servizio");
		entity.setTesto("Si richiede la creazione del servizio"); 
		this.servizioService.save(entity);
		
		return getNotificheMessaggioServizio(entity);
	}

	public List<NotificaEntity> getNotificheCambioStatoServizio(ServizioEntity servizio) {

		List<NotificaEntity> notifiche = new ArrayList<>();

		UtenteEntity mittente = servizio.getUtenteUltimaModifica();

		StatoServizioEntity stato = servizio.getStati().stream().reduce(null,(subtotal, element) -> subtotal  == null ? element : subtotal.getData().after(element.getData()) ? subtotal : element);

		// Notifiche push
		List<UtenteEntity> lstUtentiPush = getDestinatari(mittente, servizio, TIPO.CAMBIO_STATO);
		for(UtenteEntity utente: lstUtentiPush) {
			notifiche.add(getNotifica(mittente, servizio, null, stato.getUuid(), stato.getStato(), null, null, TIPO.CAMBIO_STATO, TIPO_ENTITA.SERVIZIO, utente));
		}

		// Notifiche email
		List<UtenteEntity> lstUtentiEmail = getDestinatari(mittente, servizio, TIPO.CAMBIO_STATO_EMAIL);
		for(UtenteEntity utente: lstUtentiEmail) {
			notifiche.add(getNotifica(mittente, servizio, null, stato.getUuid(), stato.getStato(), null, null, TIPO.CAMBIO_STATO_EMAIL, TIPO_ENTITA.SERVIZIO_EMAIL, utente));
		}

		return notifiche;

	}

	public List<NotificaEntity> getNotificheMessaggioServizio(MessaggioServizioEntity messaggioServizio) {
		return getNotificheMessaggioServizio(messaggioServizio, TargetComunicazioneEnum.PUBBLICA, true);
	}

	public List<NotificaEntity> getNotificheMessaggioServizio(MessaggioServizioEntity messaggioServizio, TargetComunicazioneEnum target, boolean includiTecnici) {

		List<NotificaEntity> notifiche = new ArrayList<>();

		ServizioEntity servizio = messaggioServizio.getServizio();
		UtenteEntity mittente = messaggioServizio.getUtente();

		// Notifiche push
		List<UtenteEntity> lstUtentiPush = getDestinatari(mittente, servizio, TIPO.COMUNICAZIONE, target, includiTecnici);
		for(UtenteEntity utente: lstUtentiPush) {
			notifiche.add(getNotifica(mittente, servizio, null, messaggioServizio.getUuid(), null, messaggioServizio.getOggetto(), messaggioServizio.getTesto(), TIPO.COMUNICAZIONE, TIPO_ENTITA.SERVIZIO, utente));
		}

		// Notifiche email
		List<UtenteEntity> lstUtentiEmail = getDestinatari(mittente, servizio, TIPO.COMUNICAZIONE_EMAIL, target, includiTecnici);
		for(UtenteEntity utente: lstUtentiEmail) {
			notifiche.add(getNotifica(mittente, servizio, null, messaggioServizio.getUuid(), null, messaggioServizio.getOggetto(), messaggioServizio.getTesto(), TIPO.COMUNICAZIONE_EMAIL, TIPO_ENTITA.SERVIZIO_EMAIL, utente));
		}

		return notifiche;

	}
	
	public List<NotificaEntity> getNotificheCreazioneAdesione(AdesioneEntity adesione) {

		MessaggioAdesioneEntity entity = new MessaggioAdesioneEntity();
		entity.setUuid(UUID.randomUUID().toString());
		entity.setData(new Date());
		entity.setUtente(adesione.getRichiedente());
		entity.setAdesione(adesione);
		entity.setOggetto("Creazione adesione");
		entity.setTesto("Si richiede la creazione dell'adesione"); 

		this.adesioneService.save(entity);
		
		return getNotificheMessaggioAdesione(entity);
	}

	public List<NotificaEntity> getNotificheCambioStatoAdesione(AdesioneEntity adesione) {

		List<NotificaEntity> notifiche = new ArrayList<>();

		UtenteEntity mittente = adesione.getUtenteUltimaModifica();

		StatoAdesioneEntity stato = adesione.getStati().stream().reduce(null,(subtotal, element) -> subtotal  == null ? element : subtotal.getData().after(element.getData()) ? subtotal : element);

		// Notifiche push
		List<UtenteEntity> lstUtentiPush = getDestinatari(mittente, adesione, TIPO.CAMBIO_STATO);
		for(UtenteEntity utente: lstUtentiPush) {
			notifiche.add(getNotifica(mittente, null, adesione, stato.getUuid(), stato.getStato(), null, null, TIPO.CAMBIO_STATO, TIPO_ENTITA.ADESIONE, utente));
		}

		// Notifiche email
		List<UtenteEntity> lstUtentiEmail = getDestinatari(mittente, adesione, TIPO.CAMBIO_STATO_EMAIL);
		for(UtenteEntity utente: lstUtentiEmail) {
			notifiche.add(getNotifica(mittente, null, adesione, stato.getUuid(), stato.getStato(), null, null, TIPO.CAMBIO_STATO_EMAIL, TIPO_ENTITA.ADESIONE_EMAIL, utente));
		}

		return notifiche;

	}

	public List<NotificaEntity> getNotificheMessaggioAdesione(MessaggioAdesioneEntity messaggioAdesione) {

		List<NotificaEntity> notifiche = new ArrayList<>();

		AdesioneEntity adesione = messaggioAdesione.getAdesione();
		UtenteEntity mittente = messaggioAdesione.getUtente();

		// Notifiche push
		List<UtenteEntity> lstUtentiPush = getDestinatari(mittente, adesione, TIPO.COMUNICAZIONE);
		for(UtenteEntity utente: lstUtentiPush) {
			notifiche.add(getNotifica(mittente, null, adesione, messaggioAdesione.getUuid(), null, messaggioAdesione.getOggetto(), messaggioAdesione.getTesto(), TIPO.COMUNICAZIONE, TIPO_ENTITA.ADESIONE, utente));
		}

		// Notifiche email
		List<UtenteEntity> lstUtentiEmail = getDestinatari(mittente, adesione, TIPO.COMUNICAZIONE_EMAIL);
		for(UtenteEntity utente: lstUtentiEmail) {
			notifiche.add(getNotifica(mittente, null, adesione, messaggioAdesione.getUuid(), null, messaggioAdesione.getOggetto(), messaggioAdesione.getTesto(), TIPO.COMUNICAZIONE_EMAIL, TIPO_ENTITA.ADESIONE_EMAIL, utente));
		}

		return notifiche;

	}
	
	private List<UtenteEntity> getDestinatari(UtenteEntity mittente, ServizioEntity servizio, TIPO tipo) {
		return getDestinatari(mittente, servizio, tipo, TargetComunicazioneEnum.PUBBLICA, true);
	}

	private List<UtenteEntity> getDestinatari(UtenteEntity mittente, ServizioEntity servizio, TIPO tipo, TargetComunicazioneEnum target, boolean includiTecnici) {

		Map<RuoloNotificaEnum, List<UtenteEntity>> destinatari = new HashMap<>();

		// Determina il TIPO_ENTITA in base al TIPO
		TIPO_ENTITA tipoEntita = isEmailTipo(tipo) ? TIPO_ENTITA.SERVIZIO_EMAIL : TIPO_ENTITA.SERVIZIO;

		switch (target) {
			case PUBBLICA:
				// Include referenti del servizio + aderenti
				addDestinatariServizio(destinatari, servizio, includiTecnici, isEmailTipo(tipo));
				addDestinatariAderenti(destinatari, servizio, includiTecnici, isEmailTipo(tipo));
				break;
			case SOLO_REFERENTI:
				// Include solo referenti del servizio (dominio + servizio + richiedente)
				addDestinatariServizio(destinatari, servizio, includiTecnici, isEmailTipo(tipo));
				break;
			case SOLO_ADERENTI:
				// Include solo aderenti al servizio
				addDestinatariAderenti(destinatari, servizio, includiTecnici, isEmailTipo(tipo));
				break;
		}

		return getDestinatari(mittente, destinatari, tipo, tipoEntita);

	}

	private boolean isEmailTipo(TIPO tipo) {
		return tipo == TIPO.COMUNICAZIONE_EMAIL || tipo == TIPO.CAMBIO_STATO_EMAIL;
	}

	private List<UtenteEntity> getDestinatari(UtenteEntity mittente, Map<RuoloNotificaEnum, List<UtenteEntity>> destinatari, TIPO tipo, TIPO_ENTITA tipoEntita) {
		
		Set<UtenteEntity> list = new HashSet<>();

		for(Entry<RuoloNotificaEnum, List<UtenteEntity>> e: destinatari.entrySet()) {
			for(UtenteEntity utente: e.getValue()) {
				addIf(list, utente, tipo, tipoEntita, e.getKey());
			}
		}
		
		list.remove(mittente);
		
		return list.stream().collect(Collectors.toList());
		
	}

	private void addIf(Set<UtenteEntity> list, UtenteEntity destinatario, TIPO tipo, TIPO_ENTITA tipoEntita,
			RuoloNotificaEnum tag) {
		 List<Boolean> notificaAbilitataLst = new ArrayList<>();
		 notificaAbilitataLst.add(isAbilitato(destinatario, tipo));
		 notificaAbilitataLst.add(isAbilitato(destinatario, tipoEntita));
		 notificaAbilitataLst.add(isRuoloAbilitato(destinatario, tag));
		
		 
		 if(notificaAbilitataLst.stream().reduce(Boolean.TRUE, Boolean::logicalAnd)) {
			 list.add(destinatario);
		 }

	}

	private Boolean isAbilitato(UtenteEntity destinatario, TIPO tipo) {
		
		List<TIPO> tipi = getTipi(destinatario.getTipiNotificheAbilitate());
		if(tipi == null) return true;
		
		return tipi.contains(tipo);

	}

	private Boolean isAbilitato(UtenteEntity destinatario, TIPO_ENTITA tipoEntita) {
		
		List<TIPO_ENTITA> tipi = getTipiEntita(destinatario.getTipiEntitaNotificheAbilitate());
		if(tipi == null) return true;
		
		return tipi.contains(tipoEntita);

	}

	private Boolean isRuoloAbilitato(UtenteEntity destinatario, RuoloNotificaEnum ruolo) {
		
		List<RuoloNotificaEnum> tipi = this.getRuoli(destinatario.getRuoliNotificheAbilitate());
		if(tipi == null) return true;

		return tipi.contains(ruolo);

	}

	private static final String SEPARATOR = ","; 
	public List<TIPO> getTipi(String tipi) {
		if(tipi == null) return null;
		if(tipi.isEmpty()) return new ArrayList<>();
		return Arrays.asList(tipi.split(SEPARATOR)).stream().map(e -> TIPO.valueOf(e)).collect(Collectors.toList());
	}

	public List<TIPO_ENTITA> getTipiEntita(String tipoEntita) {
		if(tipoEntita == null) return null;
		if(tipoEntita.isEmpty()) return new ArrayList<>();
		return Arrays.asList(tipoEntita.split(SEPARATOR)).stream().map(e -> TIPO_ENTITA.valueOf(e)).collect(Collectors.toList());
	}

	public List<RuoloNotificaEnum> getRuoli(String ruoli) {
		if(ruoli == null) return null;
		if(ruoli.isEmpty()) return new ArrayList<>();
		return Arrays.asList(ruoli.split(SEPARATOR)).stream().map(e -> RuoloNotificaEnum.valueOf(e)).collect(Collectors.toList());
	}

	public String getTipi(List<TIPO> tipi) {
		if(tipi == null) return null;
		return tipi.stream().map(e -> e.toString()).collect(Collectors.joining(SEPARATOR));
	}

	public String getTipiEntita(List<TIPO_ENTITA> tipiEntita) {
		if(tipiEntita == null) return null;
		return tipiEntita.stream().map(e -> e.toString()).collect(Collectors.joining(SEPARATOR));
	}

	public String getRuoli(List<RuoloNotificaEnum> tag) {
		if(tag == null) return null;
		return tag.stream().map(e -> e.toString()).collect(Collectors.joining(SEPARATOR));
	}

	private List<UtenteEntity> getDestinatari(UtenteEntity mittente, AdesioneEntity adesione, TIPO tipo) {
		Map<RuoloNotificaEnum, List<UtenteEntity>> destinatari = new HashMap<>();

		boolean isEmail = isEmailTipo(tipo);
		TIPO_ENTITA tipoEntita = isEmail ? TIPO_ENTITA.ADESIONE_EMAIL : TIPO_ENTITA.ADESIONE;

		addDestinatariAdesione(adesione, destinatari, isEmail);

		ServizioEntity servizio = adesione.getServizio();

		addDestinatariAdesioneServizio(destinatari, servizio, isEmail);

		return getDestinatari(mittente, destinatari, tipo, tipoEntita);

	}

	private void addDestinatariAdesione(AdesioneEntity adesione, Map<RuoloNotificaEnum, List<UtenteEntity>> destinatari) {
		addDestinatariAdesione(adesione, destinatari, false);
	}

	private void addDestinatariAdesione(AdesioneEntity adesione, Map<RuoloNotificaEnum, List<UtenteEntity>> destinatari, boolean isEmail) {
		if (isEmail) {
			destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_ADESIONE_EMAIL, adesione.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
			destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_ADESIONE_EMAIL, adesione.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
			destinatari.put(RuoloNotificaEnum.ADESIONE_RICHIEDENTE_ADESIONE_EMAIL, Arrays.asList(adesione.getRichiedente()));
		} else {
			destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_ADESIONE, adesione.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
			destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_ADESIONE, adesione.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
			destinatari.put(RuoloNotificaEnum.ADESIONE_RICHIEDENTE_ADESIONE, Arrays.asList(adesione.getRichiedente()));
		}
	}

	private void addDestinatariServizio(Map<RuoloNotificaEnum, List<UtenteEntity>> destinatari, ServizioEntity servizio) {
		addDestinatariServizio(destinatari, servizio, true, false);
	}

	private void addDestinatariServizio(Map<RuoloNotificaEnum, List<UtenteEntity>> destinatari, ServizioEntity servizio, boolean includiTecnici, boolean isEmail) {
		if (isEmail) {
			destinatari.put(RuoloNotificaEnum.SERVIZIO_REFERENTE_DOMINIO_EMAIL, servizio.getDominio().getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
			if (includiTecnici) {
				destinatari.put(RuoloNotificaEnum.SERVIZIO_REFERENTE_TECNICO_DOMINIO_EMAIL, servizio.getDominio().getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
			}
			destinatari.put(RuoloNotificaEnum.SERVIZIO_REFERENTE_SERVIZIO_EMAIL, servizio.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
			if (includiTecnici) {
				destinatari.put(RuoloNotificaEnum.SERVIZIO_REFERENTE_TECNICO_SERVIZIO_EMAIL, servizio.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
			}
			destinatari.put(RuoloNotificaEnum.SERVIZIO_RICHIEDENTE_SERVIZIO_EMAIL, Arrays.asList(servizio.getRichiedente()));
		} else {
			destinatari.put(RuoloNotificaEnum.SERVIZIO_REFERENTE_DOMINIO, servizio.getDominio().getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
			if (includiTecnici) {
				destinatari.put(RuoloNotificaEnum.SERVIZIO_REFERENTE_TECNICO_DOMINIO, servizio.getDominio().getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
			}
			destinatari.put(RuoloNotificaEnum.SERVIZIO_REFERENTE_SERVIZIO, servizio.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
			if (includiTecnici) {
				destinatari.put(RuoloNotificaEnum.SERVIZIO_REFERENTE_TECNICO_SERVIZIO, servizio.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
			}
			destinatari.put(RuoloNotificaEnum.SERVIZIO_RICHIEDENTE_SERVIZIO, Arrays.asList(servizio.getRichiedente()));
		}
	}

	private void addDestinatariAderenti(Map<RuoloNotificaEnum, List<UtenteEntity>> destinatari, ServizioEntity servizio, boolean includiTecnici, boolean isEmail) {
		// Raccoglie i referenti di tutte le adesioni al servizio
		for (AdesioneEntity adesione : servizio.getAdesioni()) {
			if (isEmail) {
				// Referenti dell'adesione (email)
				List<UtenteEntity> referentiAdesione = adesione.getReferenti().stream()
						.filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE))
						.map(r -> r.getReferente())
						.collect(Collectors.toList());
				destinatari.merge(RuoloNotificaEnum.ADESIONE_REFERENTE_ADESIONE_EMAIL, referentiAdesione, (old, newList) -> {
					Set<UtenteEntity> merged = new HashSet<>(old);
					merged.addAll(newList);
					return new ArrayList<>(merged);
				});

				if (includiTecnici) {
					List<UtenteEntity> tecniciAdesione = adesione.getReferenti().stream()
							.filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO))
							.map(r -> r.getReferente())
							.collect(Collectors.toList());
					destinatari.merge(RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_ADESIONE_EMAIL, tecniciAdesione, (old, newList) -> {
						Set<UtenteEntity> merged = new HashSet<>(old);
						merged.addAll(newList);
						return new ArrayList<>(merged);
					});
				}

				// Richiedente dell'adesione
				if (adesione.getRichiedente() != null) {
					destinatari.merge(RuoloNotificaEnum.ADESIONE_RICHIEDENTE_ADESIONE_EMAIL, Arrays.asList(adesione.getRichiedente()), (old, newList) -> {
						Set<UtenteEntity> merged = new HashSet<>(old);
						merged.addAll(newList);
						return new ArrayList<>(merged);
					});
				}
			} else {
				// Referenti dell'adesione (push)
				List<UtenteEntity> referentiAdesione = adesione.getReferenti().stream()
						.filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE))
						.map(r -> r.getReferente())
						.collect(Collectors.toList());
				destinatari.merge(RuoloNotificaEnum.ADESIONE_REFERENTE_ADESIONE, referentiAdesione, (old, newList) -> {
					Set<UtenteEntity> merged = new HashSet<>(old);
					merged.addAll(newList);
					return new ArrayList<>(merged);
				});

				if (includiTecnici) {
					List<UtenteEntity> tecniciAdesione = adesione.getReferenti().stream()
							.filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO))
							.map(r -> r.getReferente())
							.collect(Collectors.toList());
					destinatari.merge(RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_ADESIONE, tecniciAdesione, (old, newList) -> {
						Set<UtenteEntity> merged = new HashSet<>(old);
						merged.addAll(newList);
						return new ArrayList<>(merged);
					});
				}

				// Richiedente dell'adesione
				if (adesione.getRichiedente() != null) {
					destinatari.merge(RuoloNotificaEnum.ADESIONE_RICHIEDENTE_ADESIONE, Arrays.asList(adesione.getRichiedente()), (old, newList) -> {
						Set<UtenteEntity> merged = new HashSet<>(old);
						merged.addAll(newList);
						return new ArrayList<>(merged);
					});
				}
			}
		}
	}

	private void addDestinatariAdesioneServizio(Map<RuoloNotificaEnum, List<UtenteEntity>> destinatari, ServizioEntity servizio) {
		addDestinatariAdesioneServizio(destinatari, servizio, false);
	}

	private void addDestinatariAdesioneServizio(Map<RuoloNotificaEnum, List<UtenteEntity>> destinatari, ServizioEntity servizio, boolean isEmail) {
		if (isEmail) {
			destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_DOMINIO_EMAIL, servizio.getDominio().getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
			destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_DOMINIO_EMAIL, servizio.getDominio().getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
			destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_SERVIZIO_EMAIL, servizio.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
			destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_SERVIZIO_EMAIL, servizio.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
			destinatari.put(RuoloNotificaEnum.ADESIONE_RICHIEDENTE_SERVIZIO_EMAIL, Arrays.asList(servizio.getRichiedente()));
		} else {
			destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_DOMINIO, servizio.getDominio().getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
			destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_DOMINIO, servizio.getDominio().getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
			destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_SERVIZIO, servizio.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
			destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_SERVIZIO, servizio.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
			destinatari.put(RuoloNotificaEnum.ADESIONE_RICHIEDENTE_SERVIZIO, Arrays.asList(servizio.getRichiedente()));
		}
	}

	private NotificaEntity getNotifica(UtenteEntity mittente, ServizioEntity servizio, AdesioneEntity adesione, String idEntita, String stato, String oggetto, String messaggio, TIPO tipo, TIPO_ENTITA tipoEntita, UtenteEntity destinatario) {
		NotificaEntity notifica = new NotificaEntity();
		notifica.setMittente(mittente);
		notifica.setData(new Date());
		notifica.setServizio(servizio);
		notifica.setAdesione(adesione);
		
		notifica.setIdEntita(idEntita);
		notifica.setIdNotifica(UUID.randomUUID().toString());
		notifica.setStato(STATO.NUOVA);
		notifica.setTipo(tipo);
		notifica.setTipoEntita(tipoEntita);
		notifica.setInfoStato(stato);
		notifica.setInfoOggetto(oggetto);
		notifica.setInfoMessaggio(messaggio);
		notifica.setDestinatario(destinatario);
		return notifica;
	}
}

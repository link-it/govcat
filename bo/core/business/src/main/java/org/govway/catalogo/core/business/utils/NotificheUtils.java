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

		List<UtenteEntity> lstUtenti = getDestinatari(mittente, servizio, TIPO.CAMBIO_STATO);

		StatoServizioEntity stato = servizio.getStati().stream().reduce(null,(subtotal, element) -> subtotal  == null ? element : subtotal.getData().after(element.getData()) ? subtotal : element); 
		for(UtenteEntity utente: lstUtenti) {
			notifiche.add(getNotifica(mittente, servizio, null, stato.getUuid(), stato.getStato(), null, null, TIPO.CAMBIO_STATO, TIPO_ENTITA.SERVIZIO, utente));
		}
		
		return notifiche;
		
	}

	public List<NotificaEntity> getNotificheMessaggioServizio(MessaggioServizioEntity messaggioServizio) {
		
		List<NotificaEntity> notifiche = new ArrayList<>();

		ServizioEntity servizio = messaggioServizio.getServizio();
		UtenteEntity mittente = messaggioServizio.getUtente();
		List<UtenteEntity> lstUtenti = getDestinatari(mittente, servizio, TIPO.COMUNICAZIONE);

		for(UtenteEntity utente: lstUtenti) {
			notifiche.add(getNotifica(mittente, servizio, null, messaggioServizio.getUuid(), null, messaggioServizio.getOggetto(), messaggioServizio.getTesto(), TIPO.COMUNICAZIONE, TIPO_ENTITA.SERVIZIO, utente));
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
		List<UtenteEntity> lstUtenti = getDestinatari(mittente, adesione, TIPO.CAMBIO_STATO);

		StatoAdesioneEntity stato = adesione.getStati().stream().reduce(null,(subtotal, element) -> subtotal  == null ? element : subtotal.getData().after(element.getData()) ? subtotal : element); 
		for(UtenteEntity utente: lstUtenti) {
			notifiche.add(getNotifica(mittente, null, adesione, stato.getUuid(), stato.getStato(), null, null, TIPO.CAMBIO_STATO, TIPO_ENTITA.ADESIONE, utente));
		}
		
		return notifiche;
		
	}

	public List<NotificaEntity> getNotificheMessaggioAdesione(MessaggioAdesioneEntity messaggioAdesione) {
		
		List<NotificaEntity> notifiche = new ArrayList<>();

		AdesioneEntity adesione = messaggioAdesione.getAdesione();
		UtenteEntity mittente = messaggioAdesione.getUtente();
		List<UtenteEntity> lstUtenti = getDestinatari(mittente, adesione, TIPO.COMUNICAZIONE);

		for(UtenteEntity utente: lstUtenti) {
			notifiche.add(getNotifica(mittente, null, adesione, messaggioAdesione.getUuid(), null, messaggioAdesione.getOggetto(), messaggioAdesione.getTesto(), TIPO.COMUNICAZIONE, TIPO_ENTITA.ADESIONE, utente));
		}
		
		return notifiche;
		
	}
	
	private List<UtenteEntity> getDestinatari(UtenteEntity mittente, ServizioEntity servizio, TIPO tipo) {
		
		Map<RuoloNotificaEnum, List<UtenteEntity>> destinatari = new HashMap<>();


		addDestinatariServizio(destinatari, servizio);

		return getDestinatari(mittente, destinatari, tipo, TIPO_ENTITA.SERVIZIO);
		
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

		addDestinatariAdesione(adesione, destinatari);

		ServizioEntity servizio = adesione.getServizio();
		
		addDestinatariAdesioneServizio(destinatari, servizio);

		return getDestinatari(mittente, destinatari, tipo, TIPO_ENTITA.ADESIONE);
		
	}

	private void addDestinatariAdesione(AdesioneEntity adesione, Map<RuoloNotificaEnum, List<UtenteEntity>> destinatari) {
		destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_ADESIONE, adesione.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
		destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_ADESIONE, adesione.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
		destinatari.put(RuoloNotificaEnum.ADESIONE_RICHIEDENTE_ADESIONE, Arrays.asList(adesione.getRichiedente()));
	}

	private void addDestinatariServizio(Map<RuoloNotificaEnum, List<UtenteEntity>> destinatari, ServizioEntity servizio) {
		destinatari.put(RuoloNotificaEnum.SERVIZIO_REFERENTE_DOMINIO, servizio.getDominio().getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
		destinatari.put(RuoloNotificaEnum.SERVIZIO_REFERENTE_TECNICO_DOMINIO, servizio.getDominio().getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
		destinatari.put(RuoloNotificaEnum.SERVIZIO_REFERENTE_SERVIZIO, servizio.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
		destinatari.put(RuoloNotificaEnum.SERVIZIO_REFERENTE_TECNICO_SERVIZIO, servizio.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
		destinatari.put(RuoloNotificaEnum.SERVIZIO_RICHIEDENTE_SERVIZIO, Arrays.asList(servizio.getRichiedente()));
	}

	private void addDestinatariAdesioneServizio(Map<RuoloNotificaEnum, List<UtenteEntity>> destinatari, ServizioEntity servizio) {
		destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_DOMINIO, servizio.getDominio().getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
		destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_DOMINIO, servizio.getDominio().getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
		destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_SERVIZIO, servizio.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE)).map(r -> r.getReferente()).collect(Collectors.toList()));
		destinatari.put(RuoloNotificaEnum.ADESIONE_REFERENTE_TECNICO_SERVIZIO, servizio.getReferenti().stream().filter(r -> r.getTipo().equals(TIPO_REFERENTE.REFERENTE_TECNICO)).map(r -> r.getReferente()).collect(Collectors.toList()));
		destinatari.put(RuoloNotificaEnum.ADESIONE_RICHIEDENTE_SERVIZIO, Arrays.asList(servizio.getRichiedente()));
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

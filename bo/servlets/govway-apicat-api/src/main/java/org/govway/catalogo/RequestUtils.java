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
package org.govway.catalogo;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;

import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Ruolo;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Stato;
import org.govway.catalogo.core.services.OrganizzazioneService;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.Idm;
import org.govway.catalogo.servlets.model.RuoloUtenteEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

public class RequestUtils {

    @Value("${header.email}")
	protected String emailHeader;
    @Value("${header.first_name}")
	protected String firstNameHeader;
    @Value("${header.last_name}")
	protected String lastNameHeader;
    @Value("${header.cf}")
	protected String cfHeader;
    @Value("${header.username}")
	protected String usernameHeader;
    @Value("${headerAuthentication}")
    protected String headerAuthentication;
    @Value("${header.ruoli}")
	protected String ruoliHeader;
    @Value("${header.sede}")
	protected String sedeHeader;
    @Value("${header.matricola}")
	protected String matricolaHeader;
    @Value("${header.telefono}")
	protected String telefonoHeader;
    @Value("${header.classi}")
	protected String classiHeader;
    @Value("${header.organization}")
	protected String organizationHeader;
    @Value("${ruolo_gestore_idm}")
	protected String ruoloGestoreIdm;
    @Value("${ruolo_referente_servizio_idm}")
	protected String ruoloReferenteServizioIdm;

    @Value("${whitelist.className}")
	protected String whiteList;
    
    @Autowired
    private Configurazione configurazione;

//    @Autowired
//    private ClasseUtenteService classeUtenteService;

    @Autowired
    private OrganizzazioneService organizzazioneService;

	public InfoProfilo getPrincipal(boolean checkStato) {
	    Authentication a = SecurityContextHolder.getContext().getAuthentication();
	    
	    // Verifica se l'oggetto Authentication è null o non è istanziato correttamente
	    if (a == null || a.getPrincipal() == null || !(a.getPrincipal() instanceof InfoProfilo)) {
	    	return null;
	    }

	    if(a.getPrincipal() instanceof InfoProfilo) {
	    	InfoProfilo p = (InfoProfilo) a.getPrincipal();
	    	
	    	if(checkStato) {
		    	if(p.utente == null || !p.utente.getStato().equals(Stato.ABILITATO)) {
		    		throw new NotAuthorizedException("Utente non abilitato");
		    	}
	    	}

	    	if(configurazione.getUtente().isAggiornamentoIdmAbilitato() && p.utente != null  && p.utente.getStato().equals(Stato.ABILITATO)) {
//		    	updateContact(p.utente); //TODO
	    	}

		    return p;
	    } else {
	    	return null;
	    }

	}

	public InfoProfilo getPrincipal() {
		return getPrincipal(true);
	}

	
	private String getHeader(String name) {
		HttpServletRequest curRequest = 
				((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
				.getRequest();
		
		return curRequest.getHeader(name);
	}
	
	public UtenteEntity getUtente() {
		UtenteEntity utente = new UtenteEntity();
		utente.setIdUtente(UUID.randomUUID().toString());
		utente.setPrincipal(this.getUsername());
		utente.setEmailAziendale(this.getEmail());
		utente.setNome(this.getFirstName());
		utente.setCognome(this.getLastName());
		utente.setTelefonoAziendale(this.getTelefono());
		if(utente.getTelefonoAziendale() == null) {
			//mettere 00-00000 se null, temporaneamente
			utente.setTelefonoAziendale("00-000000");
		}

		if(this.configurazione.getUtente().isRuoloDaIdmAbilitato()) {
			Ruolo ruolo = this.getRuoloCodificatoDB();
			if(ruolo != null) {
				utente.setRuolo(ruolo);
			}
		}

		OrganizzazioneEntity orgDB = this.getOrganizzazioneDB();
		
		if(orgDB != null) {
			utente.setOrganizzazione(orgDB);
		}


		Set<ClasseUtenteEntity> classiDB = this.getClassiDB();
		
		if(!classiDB.isEmpty()) {
			utente.getClassi().addAll(classiDB);
		}

		return utente;
	}
	
	private OrganizzazioneEntity getOrganizzazioneDB() {
		String orgUntrimmed = this.getOrganization();
		if(orgUntrimmed != null) {
			String org = orgUntrimmed.trim();

			return this.organizzazioneService.findByNome(org).orElseGet(() -> {
				OrganizzazioneEntity o = new OrganizzazioneEntity();
				o.setNome(org);
				o.setIdOrganizzazione(UUID.randomUUID().toString());

				o.setAderente(true);
				
				this.organizzazioneService.save(o);
				
				return o;
			});	
		}
		
		return null;
	}

	private Set<ClasseUtenteEntity> getClassiDB() {
//		String cuString = this.getClassi();

		Set<ClasseUtenteEntity> set = new HashSet<>();

//		if(cuString != null) {
//			String[] cuLst = cuString.split(",");
//			
//			for(String cuUntrimmed: cuLst) {
//				String cu = cuUntrimmed.trim();
//				set.add(this.classeUtenteService.findByNome(cu).orElseGet(() -> {
//					ClasseUtenteEntity cuVO = new ClasseUtenteEntity();
//					cuVO.setNome(cu);
//					cuVO.setIdClasseUtente(UUID.randomUUID().toString());
//					this.classeUtenteService.save(cuVO);
//					return cuVO;
//				}));
//			
//			}
//		}
		
		return set;
	}

	public Idm getIdm() {
		Idm info = new Idm();
		info.setPrincipal(this.getUsername());
		info.setNome(this.getFirstName());
		info.setCognome(this.getLastName());
		info.setCodiceFiscale(this.getCf());
		info.setEmail(this.getEmail());
		info.setTelefono(this.getTelefono());
		info.setMatricola(this.getMatricola());
		info.setSede(this.getSede());
		
		if(this.configurazione.getUtente().isRuoloDaIdmAbilitato()) {
			info.setRuoli(this.getRuoli());
			info.setRuoloCodificato(this.getRuoloCodificato());
		}
		return info;
	}

	private RuoloUtenteEnum getRuoloCodificato() {
		return this.getRuoloCodificato(this.getRuoli());
	}

	private Ruolo getRuoloCodificatoDB() {
		return this.getRuoloCodificatoDB(this.getRuoli());
	}

	private RuoloUtenteEnum getRuoloCodificato(List<String> ruoli) {
		
		if(ruoli != null) {
			if(ruoli.stream().anyMatch(r -> r.equals(this.ruoloGestoreIdm))) {
				return RuoloUtenteEnum.GESTORE;
			}
			if(ruoli.stream().anyMatch(r -> r.equals(this.ruoloReferenteServizioIdm))) {
				return RuoloUtenteEnum.REFERENTE_SERVIZIO;
			}
		}
		
		return null;
		
	}

	private Ruolo getRuoloCodificatoDB(List<String> ruoli) {
		
		if(ruoli != null) {
			if(ruoli.stream().anyMatch(r -> r.equals(this.ruoloGestoreIdm))) {
				return Ruolo.AMMINISTRATORE;
			}
			if(ruoli.stream().anyMatch(r -> r.equals(this.ruoloReferenteServizioIdm))) {
				return Ruolo.REFERENTE_SERVIZIO;
			}
		}
		
		return null;
		
	}

	private List<String> getRuoli() {
		String ruoliString = getHeader(this.ruoliHeader);
		
		if(ruoliString!= null) {
			return Arrays.asList(ruoliString.split(","));
		} else {
			return null;
		}
	}

	private String getSede() {
		return getHeader(this.sedeHeader);
	}

	private String getTelefono() {
		return getHeader(this.telefonoHeader);
	}

	private String getMatricola() {
		return getHeader(this.matricolaHeader);
	}

	public String getEmail() {
		return getHeader(this.emailHeader);
	}

	public String getFirstName() {
		return getHeader(this.firstNameHeader);
	}

	public String getLastName() {
		return getHeader(this.lastNameHeader);
	}

	public String getCf() {
		return getHeader(this.cfHeader);
	}

	public String getUsername() {
		return getHeader(this.usernameHeader);
	}

	public String getHeaderAuthentication() {
		return getHeader(this.headerAuthentication);
	}

	public String getClassi() {
		return getHeader(this.classiHeader);
	}

	public String getOrganization() {
		return getHeader(this.organizationHeader);
	}

	public boolean isWhiteListed() {
//		String classi = getClassi();
//		return classi != null && classi.contains(this.whiteList);
		return false;
	}

}

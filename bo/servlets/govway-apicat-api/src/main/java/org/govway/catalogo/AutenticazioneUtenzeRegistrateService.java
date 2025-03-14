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

import java.util.Collection;
import java.util.Collections;
import java.util.Optional;

import org.govway.catalogo.core.dao.specifications.UtenteSpecification;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.AbstractService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.AuthenticationUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AutenticazioneUtenzeRegistrateService extends AbstractService implements UserDetailsService, AuthenticationUserDetailsService<Authentication> {
	
	@Override
	public UserDetails loadUserDetails(Authentication token) throws UsernameNotFoundException {
		Logger logger = LoggerFactory.getLogger(AutenticazioneUtenzeRegistrateService.class);
		
		String username = (String) token.getPrincipal();
		logger.info("Carico informazioni per username " + username);
		return this.loadUserDetails(username, token.getAuthorities());
	}

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

		Logger logger = LoggerFactory.getLogger(AutenticazioneUtenzeRegistrateService.class);
		logger.info("Lettura delle informazioni per username: [" + username + "] in corso..");
		
		return this.loadUserDetails(username, Collections.emptySet());
	}
	
	
	private UserDetails loadUserDetails(String principal, Collection<? extends GrantedAuthority> authorities) {
		if(principal ==null) {
			return new InfoProfilo(null);
		} else {
			UtenteSpecification filter = new UtenteSpecification();
			filter.setPrincipal(Optional.of(principal));
			return this.runTransaction(() -> {

				Optional<UtenteEntity> oContact = this.utenteRepo.findOne(filter);
				
				if(!oContact.isPresent()) {
					return new InfoProfilo(principal);
				}
				
				UtenteEntity contact = oContact.get();
				
				if(contact.getOrganizzazione()!=null) {
					contact.getOrganizzazione().getSoggetti().stream().forEach(s -> {s.getNome();});
				}
				
				contact.getClassi().stream().forEach( e-> {e.getNome();});
				
				return new InfoProfilo(principal, contact, authorities);
			});
		}
	}
	
}

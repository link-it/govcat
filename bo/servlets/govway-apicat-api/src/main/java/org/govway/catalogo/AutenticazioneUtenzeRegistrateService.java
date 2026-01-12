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
package org.govway.catalogo;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.govway.catalogo.core.dao.specifications.UtenteSpecification;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.AbstractService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.AuthenticationUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AutenticazioneUtenzeRegistrateService extends AbstractService implements UserDetailsService, AuthenticationUserDetailsService<Authentication> {

	private static final Logger logger = LoggerFactory.getLogger(AutenticazioneUtenzeRegistrateService.class);

	@Override
	public UserDetails loadUserDetails(Authentication token) throws UsernameNotFoundException {

		String username = (String) token.getPrincipal();
		logger.info("Carico informazioni per username " + username);

		UserDetails result = this.loadUserDetails(username, token.getAuthorities());
		return result;
	}

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

		logger.info("Lettura delle informazioni per username: [" + username + "] in corso..");

		UserDetails result = this.loadUserDetails(username, Collections.emptySet());
		return result;
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

				// Spring Security 6.x requires at least one authority for authenticated users
				List<GrantedAuthority> userAuthorities = new ArrayList<>();
				if (authorities != null && !authorities.isEmpty()) {
					userAuthorities.addAll(authorities);
				} else {
					// Add authorities based on user role and status
					if (contact.getRuolo() != null) {
						userAuthorities.add(new SimpleGrantedAuthority("ROLE_" + contact.getRuolo().name()));
					}
					// Always add basic USER authority for Spring Security 6.x
					userAuthorities.add(new SimpleGrantedAuthority("ROLE_USER"));
				}

				InfoProfilo result = new InfoProfilo(principal, contact, userAuthorities);

				return result;
			});
		}
	}
	
}

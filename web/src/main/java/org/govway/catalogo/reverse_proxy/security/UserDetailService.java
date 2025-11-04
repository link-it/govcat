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
package org.govway.catalogo.reverse_proxy.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.AuthenticationUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class UserDetailService implements UserDetailsService, AuthenticationUserDetailsService<PreAuthenticatedAuthenticationToken> {

private Logger logger = LoggerFactory.getLogger(UserDetailService.class);
	
	@Override
	public UserDetails loadUserDetails(PreAuthenticatedAuthenticationToken token) throws UsernameNotFoundException {
		String username = (String) token.getPrincipal();
		
		ReverseProxyAuthenticationDetails authenticationDetails =  (ReverseProxyAuthenticationDetails) token.getDetails();
		
		return this.loadUserDetails(username, token.getAuthorities(), authenticationDetails);
	}

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		return this.loadUserDetails(username, Collections.emptySet(), null);
	}
	
	
	private UserDetails loadUserDetails(String principal, Collection<? extends GrantedAuthority> authorities, ReverseProxyAuthenticationDetails authenticationDetails) {
		logger.debug("Lettura delle informazioni per username: [{}] in corso..", principal);

		// Spring Security 6.x requires at least one authority for authenticated users
		List<GrantedAuthority> userAuthorities = new ArrayList<>();
		if (authorities != null && !authorities.isEmpty()) {
			userAuthorities.addAll(authorities);
		} else if (principal != null) {
			// Add a default authority for authenticated users to satisfy Spring Security 6.x
			userAuthorities.add(new SimpleGrantedAuthority("ROLE_USER"));
			logger.debug("Added default ROLE_USER authority for principal: {}", principal);
		}

		ReverseProxyUserDetails user = null;
		if(principal ==null) {
			user = new ReverseProxyUserDetails(null, "", false, false, false, false, userAuthorities, authenticationDetails);
		} else {
			user = new ReverseProxyUserDetails(principal, "", true, true, true, true, userAuthorities, authenticationDetails);
		}
		logger.debug("Lettura delle informazioni per username: [{}] completata.", principal);
		return user;
	}
}

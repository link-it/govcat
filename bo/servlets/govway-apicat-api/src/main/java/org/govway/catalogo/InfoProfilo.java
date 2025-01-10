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

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Descrive la modalità con cui il principal sta utilizzando la api del portale
 *
 */
public class InfoProfilo implements UserDetails {
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	public final String idUtente;
	public final UtenteEntity utente;
	private List<GrantedAuthority> roles;
	
	public InfoProfilo(String contactId) {
		super();
		this.idUtente = contactId;
		this.utente = null;
		this.roles = new ArrayList<GrantedAuthority>();
	}

	public InfoProfilo(String contactId, UtenteEntity contact, Collection<? extends GrantedAuthority> roles) {
		super();
		this.idUtente = contactId;
		this.utente = contact;
		this.roles = new ArrayList<GrantedAuthority>();
		this.roles.addAll(roles);
		
	}
	

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return roles;
	}


	@Override
	public String getPassword() {
		return "";
	}


	@Override
	public String getUsername() {
		return idUtente;
	}


	@Override
	public boolean isAccountNonExpired() {
		return true;
	}


	@Override
	public boolean isAccountNonLocked() {
		return true;
	}


	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}


	@Override
	public boolean isEnabled() {
		return true;
	}

}

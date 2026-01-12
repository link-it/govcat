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
package org.govway.catalogo.core.orm.entity;

import java.util.HashSet;
import java.util.Set;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "client")
public class ClientEntity {
	
	
	public enum AuthType {HTTPS,PDND,HTTPS_PDND,SIGN_PDND,HTTPS_PDND_SIGN,HTTPS_SIGN,SIGN,HTTP_BASIC,INDIRIZZO_IP,NO_DATI,OAUTH_AUTHORIZATION_CODE,OAUTH_CLIENT_CREDENTIALS}

	public enum StatoEnum {NUOVO, CONFIGURATO}

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_client", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_client", sequenceName = "seq_client", allocationSize = 1)
	private Long id;
	
    @Column(name = "nome", nullable = false)
	private String nome;
    
    @Column(name = "descrizione")
	private String descrizione;

    @Column(name = "id_client", nullable = false)
    private String idClient;
    
    @Column(name = "auth_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private AuthType authType;
    
	@ManyToOne
    @JoinColumn(name = "id_soggetto", referencedColumnName = "id")
    private SoggettoEntity soggetto;
    
    @Column(nullable=false)
    @Enumerated(EnumType.STRING)
    private AmbienteEnum ambiente;
    
    @Column(nullable=false)
    @Enumerated(EnumType.STRING)
    private StatoEnum stato;

    @Column(name = "indirizzo_ip")
    private String indirizzoIp;

	@OneToMany(mappedBy = "client", orphanRemoval = true)
	@Cascade(CascadeType.ALL)
	private Set<EstensioneClientEntity> estensioni = new HashSet<>();

	@OneToMany(mappedBy = "client")
	private Set<ClientAdesioneEntity> adesioni = new HashSet<>();



}

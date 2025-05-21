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
package org.govway.catalogo.core.orm.entity;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.Lob;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;
import org.hibernate.annotations.Type;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "api")
public class ApiEntity {

	public enum RUOLO {EROGATO_SOGGETTO_DOMINIO,EROGATO_SOGGETTO_ADERENTE}
	public enum PROTOCOLLO {WSDL11, WSDL12, SWAGGER_2,OPENAPI_3}

	@Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_api", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_api", sequenceName = "seq_api", allocationSize = 1)
	private Long id;
    
    @Column(name="id_api", nullable=false)
	private String idApi;
	
    @OneToMany(mappedBy = "api", orphanRemoval = true)
	@Cascade(CascadeType.ALL)
    private List<AuthTypeEntity> authType = new ArrayList<>(); 

    @Column(nullable=false)
	private String nome;
	
    @Column(name = "url_invocazione", nullable = true)
	private String urlInvocazione;
    
    @Column(nullable=false)
	private Integer versione;

    @Column(nullable=false)
    @Enumerated(EnumType.STRING)
	private RUOLO ruolo;
	
	@Column
	@Lob
	private byte[] descrizione;
    
    @Column(name="codice_asset")
    private String codiceAsset;

    @OneToMany(mappedBy = "api", orphanRemoval = true)
	@Cascade(CascadeType.ALL)
    private List<EstensioneApiEntity> estensioni = new ArrayList<>(); 

    @OneToMany(mappedBy = "api")
	@Cascade(CascadeType.ALL)
    private Set<AllegatoApiEntity> allegati = new HashSet<>(); 

    @OneToMany(mappedBy = "api")
    private Set<ErogazioneEntity> erogazioni = new HashSet<>(); 

	@ManyToOne
    @JoinColumn(name = "id_config_collaudo", referencedColumnName = "id")
	@Cascade(CascadeType.ALL)
	private ApiConfigEntity collaudo;
	
	@ManyToOne
    @JoinColumn(name = "id_config_produzione", referencedColumnName = "id")
	@Cascade(CascadeType.ALL)
	private ApiConfigEntity produzione;
	
    @ManyToMany
    @JoinTable(
    name = "api_servizi", 
    joinColumns = @JoinColumn(name = "id_api"), 
    inverseJoinColumns = @JoinColumn(name = "id_servizio"))
    private Set<ServizioEntity> servizi = new HashSet<>();

    public ServizioEntity getServizio() {
        return this.servizi.stream()
            .findAny()
            .orElseThrow(() -> new IllegalStateException("Nessun servizio disponibile"));
    }
}

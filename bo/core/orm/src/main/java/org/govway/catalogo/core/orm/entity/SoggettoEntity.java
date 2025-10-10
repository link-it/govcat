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

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "soggetti")
public class SoggettoEntity {
	
    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_soggetti", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_soggetti", sequenceName = "seq_soggetti", allocationSize = 1)
	private Long id;
	
    @Column(name = "nome", nullable = false, unique = true)
	private String nome;
    
    @Column(name = "nome_gateway", nullable = true)
	private String nomeGateway;
    
    @Column(name = "tipo_gateway", nullable = true)
	private String tipoGateway;
    
    @Column(name = "url_invocazione", nullable = true)
	private String urlInvocazione;
    
    @Column(name = "descrizione")
	private String descrizione;

    @Column(name = "id_soggetto", nullable = false)
    private String idSoggetto;
    
    @Column(name = "referente", nullable = false)
    private boolean referente;
    
    @Column(name = "aderente", nullable = false)
    private boolean aderente;
    
    @Column(name = "skip_collaudo", nullable = false)
    private boolean skipCollaudo;
    
	@ManyToOne
    @JoinColumn(name = "id_organizzazione", referencedColumnName = "id")
    private OrganizzazioneEntity organizzazione;
    
    @OneToMany(mappedBy = "soggetto")
	private Set<AdesioneEntity> adesioni = new HashSet<>();
    
    @OneToMany(mappedBy = "soggettoReferente")
	private Set<DominioEntity> domini = new HashSet<>();
	
    @Column(name = "url_prefix_collaudo", nullable = true)
    private String urlPrefixCollaudo;

    @Column(name = "url_prefix_produzione", nullable = true)
    private String urlPrefixProduzione;

}

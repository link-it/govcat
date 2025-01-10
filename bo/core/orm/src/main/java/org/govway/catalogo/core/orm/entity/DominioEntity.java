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

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
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
@Table(name = "domini")
public class DominioEntity {

	public enum VISIBILITA {PUBBLICO,PRIVATO,RISERVATO, COMPONENTE}

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_domini", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_domini", sequenceName = "seq_domini", allocationSize = 1)
	private Long id;

    @Column(name = "id_dominio", nullable=false)
    private String idDominio;

    
    @Column(nullable=false)
    private String nome;
    
    @Column(nullable=true)
    private String tag;
    
    @Column(nullable=false)
    private boolean deprecato;
    
	@ManyToOne
    @JoinColumn(name = "id_soggetto_referente", referencedColumnName = "id")
	private SoggettoEntity soggettoReferente;

    @Enumerated(EnumType.STRING)
	private VISIBILITA visibilita;

    private String descrizione;
	
    @Column(name = "url_invocazione", nullable = true)
	private String urlInvocazione;
    
    @Column(name = "url_prefix_collaudo", nullable = true)
    private String urlPrefixCollaudo;

    @Column(name = "url_prefix_produzione", nullable = true)
    private String urlPrefixProduzione;

    @ManyToMany
    @JoinTable(
    name = "classi_domini", 
    joinColumns = @JoinColumn(name = "id_dominio"), 
    inverseJoinColumns = @JoinColumn(name = "id_classe"))
	private Set<ClasseUtenteEntity> classi = new HashSet<>();

    @OneToMany(mappedBy = "dominio")
    @Cascade({CascadeType.PERSIST,CascadeType.DELETE})
    private Set<ReferenteDominioEntity> referenti = new HashSet<>();
	
    @OneToMany(mappedBy = "dominio")
    private Set<ServizioEntity> servizi = new HashSet<>();
	
}

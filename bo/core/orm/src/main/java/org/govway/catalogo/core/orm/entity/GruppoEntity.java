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
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "gruppi")
public class GruppoEntity {

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_gruppi", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_gruppi", sequenceName = "seq_gruppi", allocationSize = 1)
	private Long id;

    @Column(name = "id_gruppo", nullable=false)
    private String idGruppo;

    @Column(nullable=false)
    private String nome;
    
    @Column(name = "tipo", nullable = false)
	@Enumerated(EnumType.STRING)
	private TipoServizio tipo;
    
	@OneToOne(optional = true)
    @JoinColumn(name = "id_gruppo_padre", referencedColumnName = "id")
	private GruppoEntity gruppoPadre;

    private String descrizione;
	
    @Column(name="descrizione_sintetica")
    private String descrizioneSintetica;
	
	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_immagine", referencedColumnName = "id")
    @Cascade({CascadeType.PERSIST,CascadeType.MERGE})
    private DocumentoEntity immagine;
    
    @OneToMany(mappedBy = "gruppoPadre")
    private Set<GruppoEntity> figli = new HashSet<>(); 

    @ManyToMany
    @JoinTable(
    name = "gruppi_servizi", 
    joinColumns = @JoinColumn(name = "id_gruppo"), 
    inverseJoinColumns = @JoinColumn(name = "id_servizio"))
    private Set<ServizioEntity> servizi = new HashSet<>();


}

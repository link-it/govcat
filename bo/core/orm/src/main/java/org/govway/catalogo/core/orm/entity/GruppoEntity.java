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

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
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
    
	@ManyToOne(optional = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_gruppo_padre", referencedColumnName = "id")
	private GruppoEntity gruppoPadre;

    private String descrizione;

    private String alberatura;

    @Column(name="descrizione_sintetica")
    private String descrizioneSintetica;
	
	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_immagine", referencedColumnName = "id")
    @Cascade({CascadeType.PERSIST,CascadeType.MERGE})
    private DocumentoEntity immagine;
    
    @OneToMany(mappedBy = "gruppoPadre", fetch = FetchType.LAZY)
    private Set<GruppoEntity> figli = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
    name = "gruppi_servizi",
    joinColumns = @JoinColumn(name = "id_gruppo"),
    inverseJoinColumns = @JoinColumn(name = "id_servizio"))
    private Set<ServizioEntity> servizi = new HashSet<>();


}

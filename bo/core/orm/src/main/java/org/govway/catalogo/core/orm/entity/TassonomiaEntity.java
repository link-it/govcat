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
import jakarta.persistence.OneToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tassonomie")
public class TassonomiaEntity {
	
    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_tassonomie", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_tassonomie", sequenceName = "seq_tassonomie", allocationSize = 1)
	private Long id;
	
    @Column(name = "id_tassonomia", nullable = false)
	private String idTassonomia;

    private String nome;
    private String descrizione;
    
    private boolean visibile;
    private boolean obbligatorio;
    
	@ManyToOne
    @JoinColumn(name = "id_immagine", referencedColumnName = "id")
    @Cascade({CascadeType.PERSIST,CascadeType.MERGE})
    private DocumentoEntity immagine;
    

	@OneToOne(optional = true)
    @JoinColumn(name = "id_categoria_default", referencedColumnName = "id")
	private CategoriaEntity categoriaDefault;

	@OneToMany(mappedBy = "tassonomia")
	private Set<CategoriaEntity> categorie = new HashSet<>();
}

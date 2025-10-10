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
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "classi")
public class ClasseUtenteEntity {

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_classi", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_classi", sequenceName = "seq_classi", allocationSize = 1)
	private Long id;
    
    @Column(name="id_classe_utente", nullable=false)
	private String idClasseUtente;
	
    @Column(nullable=false)
	private String nome;
	
	private String descrizione;
	
    @ManyToMany
    @JoinTable(
    name = "referenti_classi", 
    joinColumns = @JoinColumn(name = "id_classe"), 
    inverseJoinColumns = @JoinColumn(name = "id_referente"))
    @Cascade({CascadeType.PERSIST,CascadeType.DELETE})
    private Set<UtenteEntity> referenti = new HashSet<>();
	
    @ManyToMany
    @JoinTable(
    name = "utenti_classi", 
    joinColumns = @JoinColumn(name = "id_classe"), 
    inverseJoinColumns = @JoinColumn(name = "id_utente"))
    @Cascade({CascadeType.PERSIST,CascadeType.MERGE})
    private Set<UtenteEntity> utentiAssociati = new HashSet<>();
}

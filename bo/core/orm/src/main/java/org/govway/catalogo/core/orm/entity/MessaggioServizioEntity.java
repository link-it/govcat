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

import java.util.Date;
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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "messaggi_servizi")
public class MessaggioServizioEntity {

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_messaggi_servizi", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_messaggi_servizi", sequenceName = "seq_messaggi_servizi", allocationSize = 1)
	private Long id;
	
	@ManyToOne
    @JoinColumn(name = "id_utente", referencedColumnName = "id")
	private UtenteEntity utente;	
	private String uuid;
	private String oggetto;
	private String testo;
	
	@Column(name = "data")
    private Date data;
	
    @ManyToMany
    @JoinTable(
    name = "allegati_messaggi_servizi", 
    joinColumns = @JoinColumn(name = "id_messaggio"), 
    inverseJoinColumns = @JoinColumn(name = "id_allegato"))
	@Cascade({CascadeType.ALL})
    private Set<DocumentoEntity> allegati = new HashSet<>();
    
	@ManyToOne
    @JoinColumn(name = "id_servizio", referencedColumnName = "id")
    private ServizioEntity servizio;

}

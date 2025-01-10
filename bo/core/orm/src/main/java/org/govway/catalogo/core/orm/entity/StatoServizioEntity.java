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

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "stati_servizio")
public class StatoServizioEntity {
	
    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_stati_servizio", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_stati_servizio", sequenceName = "seq_stati_servizio", allocationSize = 1)
	private Long id;

	@Column(nullable = false)
	private String uuid;

	@Column(nullable = false)
    private String stato;

    @Column(nullable = false)
	private Date data;
	@ManyToOne
    @JoinColumn(name = "id_utente", referencedColumnName = "id")
	private UtenteEntity utente;

	private String commento;
	
	@ManyToOne
    @JoinColumn(name = "id_servizio", referencedColumnName = "id")
	private ServizioEntity servizio;

}

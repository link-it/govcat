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

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
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
@Table(name = "referenti_domini")
public class ReferenteDominioEntity {

	@Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_referenti_domini", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_referenti_domini", sequenceName = "seq_referenti_domini", allocationSize = 1)
    private Long id;
	
	@ManyToOne
    @JoinColumn(name = "id_referente", referencedColumnName = "id")
	private UtenteEntity referente;

	@ManyToOne
    @JoinColumn(name = "id_dominio", referencedColumnName = "id")
	private DominioEntity dominio;
	
	@Enumerated(EnumType.STRING)
	private TIPO_REFERENTE tipo;

}

/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
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

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "aziende_esterne", uniqueConstraints = {
		@UniqueConstraint(name = "uq_azienda_esterna_nome", columnNames = "nome")
})
public class AziendaEsternaEntity {

	@Id
	@Column(name = "id")
	@GeneratedValue(generator = "seq_aziende_esterne", strategy = GenerationType.SEQUENCE)
	@SequenceGenerator(name = "seq_aziende_esterne", sequenceName = "seq_aziende_esterne", allocationSize = 1)
	private Long id;

	@Column(name = "nome", nullable = false)
	private String nome;
}

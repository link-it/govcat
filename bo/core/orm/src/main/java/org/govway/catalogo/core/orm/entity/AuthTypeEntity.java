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

import jakarta.persistence.*;

import org.hibernate.annotations.JdbcTypeCode;

import lombok.Getter;
import lombok.Setter;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@Entity
@Table(name = "api_auth_types")
public class AuthTypeEntity {

	@Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_api_auth_types", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_api_auth_types", sequenceName = "seq_api_auth_types", allocationSize = 1)
	private Long id;

	@Column(nullable=false)
	@Lob
    @JdbcTypeCode(SqlTypes.LONGVARBINARY)
	@Convert(disableConversion = true)
	private byte[] resources;
	
	@Column(nullable=false)
	private String profilo;

	private String note;
	
	@ManyToOne
    @JoinColumn(name = "id_api", referencedColumnName = "id", nullable = false)
	private ApiEntity api;
	
}

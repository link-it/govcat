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

import jakarta.persistence.*;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;

import lombok.Getter;
import lombok.Setter;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@Entity
@Table(name = "documenti")
public class DocumentoEntity {

	@Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_documenti", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_documenti", sequenceName = "seq_documenti", allocationSize = 1)
	private Long id;
	
	@Column( nullable = false )
	private String uuid;

	private String tipo;
	
	@Column( nullable = false, name = "rawdata")
	@Lob
    @JdbcTypeCode(SqlTypes.LONGVARBINARY)
	@Convert(disableConversion = true)
	private byte[] rawData;
	
	@Column(nullable = true, name = "versione")
	private Integer versione = 1;
	
	@Column( nullable = false, name = "data_creazione")
	private Date dataCreazione;

	@Column( nullable = false, name = "utente_creazione")
	private String utenteCreazione;

	@Column(name = "data_ultima_modifica")
	private Date dataUltimaModifica;

	@Column(name = "utente_ultima_modifica")
	private String utenteUltimaModifica;

	private String descrizione;
	@Column( nullable = false )

	private String filename;

}

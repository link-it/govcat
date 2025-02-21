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
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "estensioni_client")
public class EstensioneClientEntity {
	
	public enum StatoEnum {NUOVO, CONFIGURATO}

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_estensioni_client", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_estensioni_client", sequenceName = "seq_estensioni_client", allocationSize = 1)
	private Long id;
	
    private String nome;

	@Column(length = 4000)
    private String valore;

    @ManyToOne
    @JoinColumn(name = "id_documento", referencedColumnName = "id")
	@Cascade({CascadeType.ALL})
    private DocumentoEntity documento;
    
	@ManyToOne
    @JoinColumn(name = "id_client", referencedColumnName = "id")
    private ClientEntity client;
}

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

import lombok.Getter;
import lombok.Setter;

import jakarta.persistence.*;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

@Getter
@Setter
@Entity
@Table(name = "estensioni_adesioni")
public class EstensioneAdesioneEntity {

	@Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_estensioni_adesioni", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_estensioni_adesioni", sequenceName = "seq_estensioni_adesioni", allocationSize = 1)
	private Long id;

	@Column(nullable=false)
	private String nome;
	
	@Column(nullable=false)
	private String gruppo;

	@Column
	private String valore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_documento", referencedColumnName = "id")
	@Cascade({CascadeType.ALL})
    private DocumentoEntity documento;

	@Column(nullable=false)
    @Enumerated(EnumType.STRING)
	private AmbienteEnum ambiente;

	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_adesioni", referencedColumnName = "id", nullable = false)
	private AdesioneEntity adesione;

	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_api", referencedColumnName = "id", nullable = true)
	private ApiEntity api;
}

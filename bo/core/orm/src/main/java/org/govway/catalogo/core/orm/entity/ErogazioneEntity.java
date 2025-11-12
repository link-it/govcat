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

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "erogazioni")
public class ErogazioneEntity {
	
	public enum StatoEnum {NUOVO, CONFIGURATO}

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_erogazioni", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_erogazioni", sequenceName = "seq_erogazioni", allocationSize = 1)
	private Long id;
	
	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_api", referencedColumnName = "id")
    private ApiEntity api;
    
    @Column(nullable=false)
    @Enumerated(EnumType.STRING)
    private AmbienteEnum ambiente;
    
    @Column(nullable=false)
    @Enumerated(EnumType.STRING)
    private StatoEnum stato;

    @Column(name = "indirizzi_ip")
    private String indirizziIp;

    @Column(name = "url")
    private String url;

}

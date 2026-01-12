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

import org.govway.catalogo.core.orm.entity.ApiEntity.PROTOCOLLO;
import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "api_config")
public class ApiConfigEntity {

	@Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_api_config", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_api_config", sequenceName = "seq_api_config", allocationSize = 1)
	private Long id;
    
    @Column(name="url", nullable=true)
	private String url;
    
	@ManyToOne
    @JoinColumn(name = "id_specifica", referencedColumnName = "id")
	@Cascade({CascadeType.PERSIST, CascadeType.MERGE, CascadeType.DETACH})
    private DocumentoEntity specifica;
 
    @Column(nullable=false)
    @Enumerated(EnumType.STRING)
	private PROTOCOLLO protocollo;
    
    @Column(name = "url_prefix", nullable = true)
    private String urlPrefix;
    
    @Column(name="nome_gateway", nullable = true)
	private String nomeGateway;
	
    @Column(name="versione_gateway", nullable = true)
	private Integer versioneGateway;
	
}

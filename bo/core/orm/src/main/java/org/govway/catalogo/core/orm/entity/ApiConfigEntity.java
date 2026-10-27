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
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

import org.govway.catalogo.core.orm.entity.ApiEntity.PROTOCOLLO;
import org.hibernate.annotations.BatchSize;
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
    
	@ManyToOne(fetch = FetchType.LAZY)
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

    /**
     * URL di invocazione associate alla specifica di questo ambiente, nell'ordine di selezione.
     * Collezione vuota: vale la sola URL predefinita.
     *
     * Senza orphanRemoval: le righe non piu` selezionate sono cancellate esplicitamente
     * (ApiDettaglioAssembler), perche' la cascata degli orfani fallisce quando la collezione
     * viene svuotata del tutto. Il batch serve alle scansioni su molte API (host ammessi dalla
     * CSP, export CSV), che inizializzano la collezione di ogni riga.
     */
    @OneToMany(mappedBy = "apiConfig", fetch = FetchType.LAZY, cascade = jakarta.persistence.CascadeType.ALL)
    @OrderBy("posizione ASC, id ASC")
    @BatchSize(size = 100)
    private List<ApiConfigUrlInvocazioneEntity> urlInvocazione = new ArrayList<>();

    /**
     * Quote di rate limiting complessive del servizio per questo ambiente, al piu` una per periodo.
     *
     * Senza orphanRemoval per lo stesso motivo di urlInvocazione: le righe rimosse sono cancellate
     * esplicitamente (RateLimitingService).
     */
    @OneToMany(mappedBy = "apiConfig", fetch = FetchType.LAZY, cascade = jakarta.persistence.CascadeType.ALL)
    @OrderBy("id ASC")
    @BatchSize(size = 100)
    private List<ApiConfigRateLimitingEntity> rateLimiting = new ArrayList<>();

}

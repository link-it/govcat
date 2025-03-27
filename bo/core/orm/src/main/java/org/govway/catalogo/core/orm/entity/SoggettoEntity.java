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
import java.util.HashSet;
import java.util.Set;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "soggetti")
public class SoggettoEntity {
	
    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_soggetti", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_soggetti", sequenceName = "seq_soggetti", allocationSize = 1)
	private Long id;
	
    // si, sia per fruitore che erogatore(ci si arriva dal dominio del servizio a cui aderisce)
    @Column(name = "nome", nullable = false, unique = true)
	private String nome;
    
    @Column(name = "nome_gateway", nullable = true)
	private String nomeGateway;
    
    @Column(name = "tipo_gateway", nullable = true)
	private String tipoGateway;
    
    @Column(name = "url_invocazione", nullable = true)
	private String urlInvocazione;
    
    @Column(name = "descrizione")
	private String descrizione;

    @Column(name = "id_soggetto", nullable = false)
    private String idSoggetto;
    
    @Column(name = "referente", nullable = false)
    private boolean referente;
    
    @Column(name = "aderente", nullable = false)
    private boolean aderente;
    
    @Column(name = "skip_collaudo", nullable = false)
    private boolean skipCollaudo;
    
    @Column(name = "data_creazione")
    private Date dataCreazione;
    
    @Column(name = "data_ultima_modifica")
    private Date dataUltimaModifica;
    
	@ManyToOne
    @JoinColumn(name = "id_richiedente", referencedColumnName = "id")
	private UtenteEntity richiedente;
    
	@ManyToOne
    @JoinColumn(name = "id_utente_ultima_modifica", referencedColumnName = "id")
	private UtenteEntity utenteUltimaModifica;
    
	@ManyToOne
    @JoinColumn(name = "id_organizzazione", referencedColumnName = "id")
    private OrganizzazioneEntity organizzazione;
    
    @OneToMany(mappedBy = "soggetto")
	private Set<AdesioneEntity> adesioni = new HashSet<>();
    
    @OneToMany(mappedBy = "soggettoReferente")
	private Set<DominioEntity> domini = new HashSet<>();
	
    @Column(name = "url_prefix_collaudo", nullable = true)
    private String urlPrefixCollaudo;

    @Column(name = "url_prefix_produzione", nullable = true)
    private String urlPrefixProduzione;

}

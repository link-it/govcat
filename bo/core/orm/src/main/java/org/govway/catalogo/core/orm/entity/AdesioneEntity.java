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

import java.util.*;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "adesioni")
public class AdesioneEntity {

	public enum STATO_CONFIGURAZIONE {OK,KO,IN_CODA, RETRY, FALLITA}

	@Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_adesioni", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_adesioni", sequenceName = "seq_adesioni", allocationSize = 1)
	private Long id;
    
    @Column(name="id_adesione", nullable=false)
	private String idAdesione;
	
	@ManyToOne
    @JoinColumn(name = "id_servizio", referencedColumnName = "id")
    private ServizioEntity servizio;
	
	@ManyToOne
    @JoinColumn(name = "id_soggetto", referencedColumnName = "id")
    private SoggettoEntity soggetto;
    
    @Column(name = "skip_collaudo", nullable = false)
    private boolean skipCollaudo;
    
    @Column(nullable = false)
	private String stato;
	
    @Column(name="id_logico")
	private String idLogico;
	
    @Column(name="search_terms", nullable = false)
	private String searchTerms;
    
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

    @OneToMany(mappedBy = "adesione")
    @Cascade(CascadeType.ALL)
	private Set<StatoAdesioneEntity> stati = new HashSet<>();
    
    @OneToMany(mappedBy = "adesione")
    @Cascade(CascadeType.ALL)
	private Set<NotificaEntity> notifiche = new HashSet<>();
    
    @OneToMany(mappedBy = "adesione")
    @Cascade({CascadeType.PERSIST,CascadeType.DELETE})
    private Set<ReferenteAdesioneEntity> referenti = new HashSet<>();

    @OneToMany(mappedBy = "adesione")
    @Cascade(CascadeType.PERSIST)
	private Set<MessaggioAdesioneEntity> messaggi = new HashSet<>();

    @OneToMany(mappedBy = "adesione", orphanRemoval = true)
    @Cascade(CascadeType.ALL)
    private List<EstensioneAdesioneEntity> estensioni = new ArrayList<>();

    @Column(name = "tentativi")
    private Integer tentativi;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "stato_configurazione")
    private STATO_CONFIGURAZIONE statoConfigurazione;
    
    @Column(name = "messaggio_configurazione")
    private String messaggioConfigurazione;

    @ManyToMany
    @JoinTable(
    name = "erogazioni_adesioni", 
    joinColumns = @JoinColumn(name = "id_adesione"), 
    inverseJoinColumns = @JoinColumn(name = "id_erogazione"))
	@Cascade({CascadeType.ALL})
    private Set<ErogazioneEntity> erogazioni = new HashSet<>();

	@OneToMany(mappedBy = "adesione", orphanRemoval = true)
    @Cascade(CascadeType.ALL)
	private Set<ClientAdesioneEntity> client = new HashSet<>();

	@OneToOne(optional = true)
    @JoinColumn(name = "id_adesione_collaudo", referencedColumnName = "id")
	private AdesioneEntity adesioneCollaudo;

	
	@Override
	public String toString() {
		if(this.idLogico!= null) {
			return this.getServizio().getNome() + "/" + this.getSoggetto().getNome() + "/" + this.idLogico;
		} else {
			return this.getServizio().getNome() + "/" + this.getSoggetto().getNome();
		}
	}

}

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
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

import org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA;
import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "servizi")
public class ServizioEntity {
	
    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_servizi", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_servizi", sequenceName = "seq_servizi", allocationSize = 1)
	private Long id;
	
    @Column(name = "id_servizio", nullable = false)
	private String idServizio;
    
    @Column(name = "nome", nullable = false)
	private String nome;
    
    @Column(name = "versione", nullable = false)
	private String versione;
    
    @Column(name = "tipo", nullable = false)
	@Enumerated(EnumType.STRING)
	private TipoServizio tipo;

    @Column(name = "stato")
    private String stato;
    
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

	// si
	@ManyToOne
    @JoinColumn(name = "id_dominio", referencedColumnName = "id")
    private DominioEntity dominio;

	// si
	@ManyToOne
    @JoinColumn(name = "id_soggetto_interno", referencedColumnName = "id")
    private SoggettoEntity soggettoInterno;

    @ManyToMany
    @JoinTable(
    name = "gruppi_servizi", 
    joinColumns = @JoinColumn(name = "id_servizio"), 
    inverseJoinColumns = @JoinColumn(name = "id_gruppo"))
    private Set<GruppoEntity> gruppi = new HashSet<>();

    @OneToMany(mappedBy = "servizio")
    @Cascade({CascadeType.PERSIST,CascadeType.DELETE})
    private Set<ReferenteServizioEntity> referenti = new HashSet<>();

	@Column(name = "descrizione_sintetica")
	private String descrizioneSintetica;

	@Column(name = "descrizione", length = 4000)
	private String descrizione;
	
	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_immagine", referencedColumnName = "id")
    @Cascade({CascadeType.PERSIST,CascadeType.MERGE})
    private DocumentoEntity immagine;
    
    @ManyToMany
    @JoinTable(
    name = "tag_servizi",
    joinColumns = @JoinColumn(name = "id_servizio"), 
    inverseJoinColumns = @JoinColumn(name = "id_tag"))
    @Cascade({CascadeType.PERSIST,CascadeType.MERGE})
	private Set<TagEntity> tags = new HashSet<>();

    @Enumerated(EnumType.STRING)
	private VISIBILITA visibilita;

    @Column(name = "termini_ricerca")
    private String terminiRicerca;
    
    @Column(name = "note", length=1000)
    private String note;
    
    //@Column(name = "eliminabile")
    //private boolean eliminabile = true;
    
    @Column(name = "url_invocazione", nullable = true)
	private String urlInvocazione;
    
    @Column(name = "url_prefix_collaudo", nullable = true)
    private String urlPrefixCollaudo;

    @Column(name = "url_prefix_produzione", nullable = true)
    private String urlPrefixProduzione;

    @Column(name = "package", nullable = false)
    private boolean _package;
    
    @Column(name = "skip_collaudo", nullable = false)
    private boolean skipCollaudo;
    
    @OneToMany(mappedBy = "_package")
    @Cascade(CascadeType.ALL)
	private Set<PackageServizioEntity> componenti = new HashSet<>();

    @OneToMany(mappedBy = "servizio")
    @Cascade(CascadeType.ALL)
	private Set<PackageServizioEntity> packages = new HashSet<>();

    @Column(name = "multi_adesione")
    private boolean multiAdesione;

    @Column(name = "adesione_consentita")
    private boolean adesioneConsentita;

    @ManyToMany
    @JoinTable(
    name = "classi_servizi", 
    joinColumns = @JoinColumn(name = "id_servizio"), 
    inverseJoinColumns = @JoinColumn(name = "id_classe"))
	private Set<ClasseUtenteEntity> classi = new HashSet<>();

    @ManyToMany
    @JoinTable(
    name = "categorie_servizi", 
    joinColumns = @JoinColumn(name = "id_servizio"), 
    inverseJoinColumns = @JoinColumn(name = "id_categoria"))
	private Set<CategoriaEntity> categorie = new HashSet<>();

    @OneToMany(mappedBy = "servizio")
    @Cascade(CascadeType.ALL)
	private Set<StatoServizioEntity> stati = new HashSet<>();
    
    @OneToMany(mappedBy = "servizio")
    @Cascade(CascadeType.ALL)
	private Set<NotificaEntity> notifiche = new HashSet<>();
    
    @OneToMany(mappedBy = "servizio")
    @Cascade({CascadeType.PERSIST,CascadeType.DELETE})
	private Set<MessaggioServizioEntity> messaggi = new HashSet<>();
	
    @OneToMany(mappedBy = "servizio")
	private Set<AdesioneEntity> adesioni = new HashSet<>();
	
    @ManyToMany
    @JoinTable(
    name = "api_servizi", 
    joinColumns = @JoinColumn(name = "id_servizio"), 
    inverseJoinColumns = @JoinColumn(name = "id_api"))
    private Set<ApiEntity> api = new HashSet<>();
	
    @OneToMany(mappedBy = "servizio")
    @Cascade(CascadeType.PERSIST)
    private Set<AllegatoServizioEntity> allegati = new HashSet<>(); 

}

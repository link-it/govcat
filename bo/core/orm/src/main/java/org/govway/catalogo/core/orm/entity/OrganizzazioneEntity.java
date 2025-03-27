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
import javax.persistence.OneToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "organizations")
public class OrganizzazioneEntity {
	
    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_organizations", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_organizations", sequenceName = "seq_organizations", allocationSize = 1)
	private Long id;
	
    @Column(name = "name", nullable = false, unique = true)
	private String nome;
    
    @Column(name = "descrizione")
	private String descrizione;
    
    @Column(name = "id_organizzazione", nullable = false)
	private String idOrganizzazione;

    @Column(name = "codice_ente")
    private String codiceEnte;
    
    @Column(name = "codice_fiscale_soggetto")
    private String codiceFiscaleSoggetto;
    
    @Column(name = "id_tipo_utente")
    private String idTipoUtente;
    
    @Column(name = "referente", nullable = false)
    private boolean referente;
    
    @Column(name = "aderente", nullable = false)
    private boolean aderente;
    
    @Column(name = "esterna", nullable = false)
    private boolean esterna;
    
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
    
    @OneToMany(mappedBy = "organizzazione")
    private Set<SoggettoEntity> soggetti = new HashSet<>();
    
    @OneToOne
    @JoinColumn(name = "id_soggetto_default", referencedColumnName = "id")
    private SoggettoEntity soggettoDefault;
    
    @OneToMany(mappedBy = "organizzazione")
    private Set<UtenteEntity> utenti = new HashSet<>();
    

}

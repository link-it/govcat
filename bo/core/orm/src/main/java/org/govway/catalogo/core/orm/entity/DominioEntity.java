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

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "domini")
public class DominioEntity {

	public enum VISIBILITA {PUBBLICO,PRIVATO,RISERVATO, COMPONENTE}

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_domini", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_domini", sequenceName = "seq_domini", allocationSize = 1)
	private Long id;

    @Column(name = "id_dominio", nullable=false)
    private String idDominio;

    
    @Column(nullable=false)
    private String nome;
    
    @Column(nullable=true)
    private String tag;
    
    @Column(nullable=false)
    private boolean deprecato;
    
    @Column(name = "skip_collaudo", nullable = false)
    private boolean skipCollaudo;
    
	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_soggetto_referente", referencedColumnName = "id")
	private SoggettoEntity soggettoReferente;

    @Enumerated(EnumType.STRING)
	private VISIBILITA visibilita;

    private String descrizione;

    @Column(name = "url_invocazione", nullable = true)
	private String urlInvocazione;

    @Column(name = "url_prefix_collaudo", nullable = true)
    private String urlPrefixCollaudo;

    @Column(name = "url_prefix_produzione", nullable = true)
    private String urlPrefixProduzione;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
    name = "classi_domini",
    joinColumns = @JoinColumn(name = "id_dominio"),
    inverseJoinColumns = @JoinColumn(name = "id_classe"))
	private Set<ClasseUtenteEntity> classi = new HashSet<>();

    @OneToMany(mappedBy = "dominio", fetch = FetchType.LAZY)
    @Cascade({CascadeType.PERSIST,CascadeType.DELETE})
    private Set<ReferenteDominioEntity> referenti = new HashSet<>();

    @OneToMany(mappedBy = "dominio", fetch = FetchType.LAZY)
    private Set<ServizioEntity> servizi = new HashSet<>();
	
}

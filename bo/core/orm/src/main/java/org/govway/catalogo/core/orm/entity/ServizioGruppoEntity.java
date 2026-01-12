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
import javax.persistence.FetchType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;
import javax.persistence.Table;

import org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA;
import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "servizi_gruppi")
public class ServizioGruppoEntity {
	
	public enum TipoServizioGruppoEnum {SERVIZIO, GRUPPO}

	@Id
	private Long id;
	
    @Column(name = "id_entita")
	private String idEntita;

	@Column(name = "tipo", nullable = false)
	@Enumerated(EnumType.STRING)
	private TipoServizioGruppoEnum tipo;
    
    @Column(name = "tipo_componente", nullable = false)
	@Enumerated(EnumType.STRING)
	private TipoServizio tipoComponente;

    @Column(name = "nome", nullable = false)
	private String nome;
    
    @Column(name = "versione")
	private String versione;
    
	@Column(name = "descrizione_sintetica", nullable = false)
	private String descrizioneSintetica;

	@Column(name = "descrizione", nullable = false)
	private String descrizione;
	
	@Column(name = "stato")
	private String stato;
	
	@Column(name = "visibilita")
    @Enumerated(EnumType.STRING)
	private VISIBILITA visibilita;
	
	@ManyToOne
    @JoinColumn(name = "id_gruppo", referencedColumnName = "id")
    private GruppoEntity gruppo;

	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_immagine", referencedColumnName = "id")
    @Cascade({CascadeType.PERSIST,CascadeType.MERGE})
    private DocumentoEntity immagine;

	@OneToOne
	@JoinColumn(name = "id", referencedColumnName = "id", nullable = true)
	private ServizioEntity servizio;

}

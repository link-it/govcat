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

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "allegati_servizi")
public class AllegatoServizioEntity {
	
	public enum VISIBILITA {PUBBLICO,ADESIONE,SERVIZIO,GESTORE}
	public enum TIPOLOGIA {GENERICO,SPECIFICA,SPECIFICA_COLLAUDO,SPECIFICA_PRODUZIONE}

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_allegati_servizi", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_allegati_servizi", sequenceName = "seq_allegati_servizi", allocationSize = 1)
	private Long id;

	@ManyToOne
    @JoinColumn(name = "id_documento", referencedColumnName = "id")
	@Cascade({CascadeType.ALL})
	private DocumentoEntity documento;
    
	@Enumerated(EnumType.STRING)
	private VISIBILITA visibilita;

    @Enumerated(EnumType.STRING)
	private TIPOLOGIA tipologia;

    @ManyToOne
    @JoinColumn(name = "id_servizio", referencedColumnName = "id")
	private ServizioEntity servizio;

}

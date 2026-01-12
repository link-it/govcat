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

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "notifiche")
public class NotificaEntity {

	public enum TIPO {COMUNICAZIONE, CAMBIO_STATO}
	public enum TIPO_ENTITA {SERVIZIO, ADESIONE}
	public enum STATO {NUOVA,LETTA,ARCHIVIATA}
	
	@Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_notifiche", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_notifiche", sequenceName = "seq_notifiche", allocationSize = 1)
	private Long id;
    
    @Column(name="id_notifica", nullable=false)
	private String idNotifica;
	
    @Column(nullable=false)
    @Enumerated(EnumType.STRING)
    private TIPO tipo;
    
    @Enumerated(EnumType.STRING)
    @Column(name="tipo_notifica", nullable=false)
    private TIPO_ENTITA tipoEntita;
    
    @Column(name="id_entita", nullable=false)
    private String idEntita;
    
	@ManyToOne
    @JoinColumn(name = "id_servizio", referencedColumnName = "id", nullable=true)
	private ServizioEntity servizio;
    
	@ManyToOne
    @JoinColumn(name = "id_adesione", referencedColumnName = "id", nullable=true)
	private AdesioneEntity adesione;
    

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
	private STATO stato;
	
    @Column(nullable=false)
    private Date data;
    
    @Column(name="info_stato")
    private String infoStato;
    @Column(name="info_oggetto")
    private String infoOggetto;
    @Column(name="info_messaggio")
    private String infoMessaggio;

	@ManyToOne
    @JoinColumn(name = "id_destinatario", referencedColumnName = "id", nullable=false)
	private UtenteEntity destinatario;

	@OneToOne
    @JoinColumn(name = "id_mittente", referencedColumnName = "id", nullable=false)
	private UtenteEntity mittente;

	private String ruoli;
}

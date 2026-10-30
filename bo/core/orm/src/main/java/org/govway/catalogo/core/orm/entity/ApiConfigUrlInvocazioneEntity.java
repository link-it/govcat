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
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;

/**
 * Associazione fra la specifica di un ambiente (api_config) e una delle URL di invocazione
 * censite in configurazione per quell'ambiente.
 *
 * Qui si salva il solo identificativo della URL: etichetta, prefisso e template restano nella
 * configurazione, che resta la sola anagrafica. L'identificativo riservato "default" indica la
 * URL predefinita, quella risolta dalla gerarchia api -> servizio -> dominio -> soggetto
 * referente -> configurazione.
 */
@Getter
@Setter
@Entity
@Table(name = "api_config_url_invocazione")
public class ApiConfigUrlInvocazioneEntity {

	@Id
	@Column(name = "id")
	@GeneratedValue(generator = "seq_api_config_url_invocazione", strategy = GenerationType.SEQUENCE)
	@SequenceGenerator(name = "seq_api_config_url_invocazione", sequenceName = "seq_api_config_url_invocazione", allocationSize = 1)
	private Long id;

	@Column(name = "identificativo", nullable = false)
	private String identificativo;

	@Column(name = "posizione", nullable = false)
	private Integer posizione;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_api_config", referencedColumnName = "id", nullable = false)
	private ApiConfigEntity apiConfig;
}

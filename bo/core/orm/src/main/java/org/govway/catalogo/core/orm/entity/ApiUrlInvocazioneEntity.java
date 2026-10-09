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
 * URL di invocazione aggiuntiva di una API (dalla seconda in poi).
 *
 * La prima URL resta gestita dai campi url_invocazione / url_prefix_* della gerarchia
 * api -> servizio -> dominio -> soggetto referente -> configurazione: questa entita` non
 * la sostituisce ne` la modifica.
 *
 * I campi templateUrl e urlPrefix* sono opzionali: quando non valorizzati si ricade sul
 * valore risolto per la URL principale. Il caso d'uso tipico (stesso path esposto su un
 * secondo gateway) si configura quindi con il solo prefix.
 */
@Getter
@Setter
@Entity
@Table(name = "api_url_invocazione")
public class ApiUrlInvocazioneEntity {

	@Id
	@Column(name = "id")
	@GeneratedValue(generator = "seq_api_url_invocazione", strategy = GenerationType.SEQUENCE)
	@SequenceGenerator(name = "seq_api_url_invocazione", sequenceName = "seq_api_url_invocazione", allocationSize = 1)
	private Long id;

	@Column(name = "posizione", nullable = false)
	private Integer posizione;

	@Column(name = "etichetta")
	private String etichetta;

	@Column(name = "template_url")
	private String templateUrl;

	@Column(name = "url_prefix_collaudo")
	private String urlPrefixCollaudo;

	@Column(name = "url_prefix_produzione")
	private String urlPrefixProduzione;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_api", referencedColumnName = "id", nullable = false)
	private ApiEntity api;
}

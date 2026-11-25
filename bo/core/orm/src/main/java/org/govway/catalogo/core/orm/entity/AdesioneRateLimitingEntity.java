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
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import lombok.Getter;
import lombok.Setter;

/**
 * Quota di rate limiting assegnata al fruitore di un'adesione per un'API, un ambiente e uno dei
 * periodi dichiarati dal servizio per quella API e ambiente.
 */
@Getter
@Setter
@Entity
@Table(name = "adesioni_rate_limiting", uniqueConstraints = @UniqueConstraint(name = "uk_adesioni_rate_limiting", columnNames = {"id_adesione", "id_api", "ambiente", "periodo"}))
public class AdesioneRateLimitingEntity {

	@Id
	@Column(name = "id")
	@GeneratedValue(generator = "seq_adesioni_rate_limiting", strategy = GenerationType.SEQUENCE)
	@SequenceGenerator(name = "seq_adesioni_rate_limiting", sequenceName = "seq_adesioni_rate_limiting", allocationSize = 1)
	private Long id;

	@Column(name = "ambiente", nullable = false)
	@Enumerated(EnumType.STRING)
	private AmbienteEnum ambiente;

	@Column(name = "periodo", nullable = false)
	@Enumerated(EnumType.STRING)
	private RateLimitingPeriodo periodo;

	@Column(name = "quota", nullable = false)
	private Integer quota;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_adesione", referencedColumnName = "id", nullable = false)
	private AdesioneEntity adesione;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_api", referencedColumnName = "id", nullable = false)
	private ApiEntity api;
}

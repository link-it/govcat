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
package org.govway.catalogo;

import org.springframework.hateoas.Links;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Mixin Jackson per {@link org.springframework.hateoas.RepresentationModel}.
 *
 * <p>Con Spring HATEOAS 3.x (Spring Boot 4) la proprieta' {@code links} di {@code RepresentationModel}
 * non e' piu' annotata con {@code @JsonInclude(NON_EMPTY)}; in assenza del modulo Jackson di HATEOAS
 * sull'ObjectMapper Jackson 2 usato dal message converter, veniva serializzata come array vuoto
 * {@code "links": []} su ogni response (tutti i model generati con {@code hateoas=true} estendono
 * RepresentationModel).
 *
 * <p>Questo mixin ripristina il comportamento pre-migrazione limitandosi alla sola proprieta'
 * {@code links}: se vuota viene omessa, se valorizzata viene serializzata come prima. Nessun impatto
 * sugli altri campi.
 */
public abstract class RepresentationModelLinksMixin {

	@JsonInclude(JsonInclude.Include.NON_EMPTY)
	@JsonProperty("links")
	public abstract Links getLinks();
}

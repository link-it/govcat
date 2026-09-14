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

import java.util.List;

import com.fasterxml.jackson.annotation.JsonAlias;

/**
 * Mixin Jackson per {@code ConfigurazioneStepWizard} e {@code ConfigurazioneStepWizardSezione}.
 *
 * <p>La chiave che elenca gli stati di una fase del wizard si chiamava {@code stati_adesione}
 * quando il wizard esisteva solo per le adesioni. Da quando lo stesso schema e' usato anche dal
 * wizard dei servizi la chiave e' stata rinominata nel piu' generico {@code stati}: il nome
 * precedente era ambiguo (nel blocco {@code servizio} convive con {@code stati_adesione_consentita},
 * che ha tutt'altro significato) e descriveva stati che di fatto non sono di un'adesione.
 *
 * <p>Il mixin dichiara {@code stati_adesione} come alias in lettura di {@code stati}, cosi' un
 * {@code configurazione.json} scritto per una versione precedente continua a funzionare senza
 * modifiche. Serve anche a evitare un fallimento all'avvio: l'ObjectMapper che legge il file di
 * configurazione ha {@code FAIL_ON_UNKNOWN_PROPERTIES} attivo, quindi senza alias la vecchia
 * chiave impedirebbe la creazione del bean {@code configurazione}.
 *
 * <p>L'alias e' deprecato: va rimosso quando tutte le installazioni e i plugin custom avranno
 * adottato {@code stati}.
 */
public abstract class StepWizardStatiAliasMixin {

	@JsonAlias("stati_adesione")
	public abstract void setStati(List<String> stati);
}

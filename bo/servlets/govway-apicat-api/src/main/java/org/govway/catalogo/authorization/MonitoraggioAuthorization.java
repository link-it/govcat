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
package org.govway.catalogo.authorization;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.govway.catalogo.core.dao.specifications.ApiSpecification;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.PackageServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.services.ApiService;
import org.govway.catalogo.core.services.ServizioService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.monitoraggioutils.FiltriUtils;
import org.govway.catalogo.servlets.monitor.model.AmbienteEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

/**
 * Autorizzazione delle API di monitoraggio (transazioni e statistiche) in base ai ruoli dell'utente sul servizio
 * ({@code monitoraggio.ruoli_abilitati}, vedi {@link AbstractServizioAuthorization#isMonitoraggioConsentito(ServizioEntity)}).
 */
@Component
public class MonitoraggioAuthorization {

	private static final int PAGE_SIZE = 100;

	@Autowired
	private ServizioService servizioService;

	@Autowired
	private ApiService apiService;

	@Autowired
	private ServizioAuthorization servizioAuthorization;

	@Autowired
	private CoreAuthorization coreAuthorization;

	@Autowired
	private FiltriUtils filtriUtils;

	/**
	 * Monitoraggio del servizio consentito all'utente in sessione. Il soggetto, se indicato, e' quello del path
	 * con cui si interroga GovWay e deve essere il soggetto referente del dominio del servizio: altrimenti si
	 * leggerebbe il traffico di API omonime di altri soggetti.
	 *
	 * @param idServizio servizio monitorato
	 * @param soggetto nome del soggetto del path, nullo se la richiesta non lo prevede
	 */
	public void authorizeServizio(UUID idServizio, String soggetto) {
		this.servizioService.runTransaction(() -> {
			ServizioEntity servizio = this.servizioService.find(idServizio)
					.orElseThrow(() -> new NotFoundException(ErrorCode.SRV_404, Map.of("idServizio", idServizio.toString())));

			if(!this.servizioAuthorization.isMonitoraggioConsentito(servizio)) {
				throw new NotAuthorizedException(ErrorCode.MON_403);
			}

			if(soggetto != null && !soggetto.equals(servizio.getDominio().getSoggettoReferente().getNome())) {
				throw new BadRequestException(ErrorCode.MON_400_SOGGETTO, Map.of("soggetto", soggetto));
			}
		});
	}

	/**
	 * Il gestore accede al monitoraggio di tutti i servizi.
	 */
	public boolean isGestore() {
		return this.coreAuthorization.isAdmin();
	}

	/**
	 * Dettaglio di una transazione consentito all'utente in sessione: il gestore sempre, gli altri se la
	 * transazione compare nella lista delle transazioni di un servizio di cui possono consultare il monitoraggio.
	 * Una transazione senza API (es. rifiutata prima dell'individuazione del servizio) non compare in nessuna
	 * lista ed e' visibile solo al gestore.
	 *
	 * @param ambiente ambiente della transazione
	 * @param idTransazione identificativo della transazione, per il messaggio di errore
	 * @param nome nome dell'API con cui GovWay registra la transazione
	 * @param versione versione dell'API con cui GovWay registra la transazione
	 * @param erogatore soggetto erogatore con cui GovWay registra la transazione
	 */
	public void authorizeTransazione(AmbienteEnum ambiente, UUID idTransazione, String nome, Integer versione, String erogatore) {
		if(isGestore()) {
			return;
		}

		boolean consentito = nome != null && versione != null && erogatore != null
				&& this.apiService.runTransaction(() -> isTransazioneServizioConsentito(ambiente, nome, versione, erogatore));

		if(!consentito) {
			throw new NotAuthorizedException(ErrorCode.MON_403_TRANSAZIONE, Map.of("idTransazione", idTransazione.toString()));
		}
	}

	/**
	 * Cerca, tra i servizi delle API con il nome indicato (anche come nome sul gateway), uno di cui l'utente
	 * puo' consultare il monitoraggio e nella cui lista di transazioni compare la transazione.
	 */
	private boolean isTransazioneServizioConsentito(AmbienteEnum ambiente, String nome, Integer versione, String erogatore) {
		ApiSpecification spec = new ApiSpecification();
		spec.setQ(Optional.of(nome));

		Set<Long> serviziVerificati = new HashSet<>();
		Pageable pageable = PageRequest.of(0, PAGE_SIZE, Sort.by("id"));
		Page<ApiEntity> page;
		do {
			page = this.apiService.findAll(spec, pageable);
			for(ApiEntity api: page) {
				for(ServizioEntity servizio: getServizi(api)) {
					if(serviziVerificati.add(servizio.getId())
							&& this.servizioAuthorization.isMonitoraggioConsentito(servizio)
							&& this.filtriUtils.isTransazioneServizio(servizio, ambiente, nome, versione, erogatore)) {
						return true;
					}
				}
			}
			pageable = page.nextPageable();
		} while(page.hasNext());

		return false;
	}

	/**
	 * Servizi il cui monitoraggio comprende l'API: quelli a cui appartiene e i package che li contengono.
	 */
	private List<ServizioEntity> getServizi(ApiEntity api) {
		List<ServizioEntity> servizi = new ArrayList<>();
		for(ServizioEntity servizio: api.getServizi()) {
			servizi.add(servizio);
			for(PackageServizioEntity p: servizio.getPackages()) {
				servizi.add(p.get_package());
			}
		}
		return servizi;
	}
}

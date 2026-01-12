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
package org.govway.catalogo.monitoraggioutils.transazioni;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.govway.catalogo.core.dao.specifications.ApiSpecification;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.PROTOCOLLO;
import org.govway.catalogo.core.services.ApiService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.gest.clients.govwaymonitor.model.DetailTransazione;
import org.govway.catalogo.gest.clients.govwaymonitor.model.ItemTransazione;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TransazioneExtInformazioniApi;
import org.govway.catalogo.gest.clients.govwaymonitor.model.TransazioneExtInformazioniApiBase;
import org.govway.catalogo.monitoraggioutils.DurationFormatUtilities;
import org.govway.catalogo.servlets.monitor.model.AmbienteEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;

public class TransazioneBuilder {

	@Autowired
	private ApiService apiService;

	public Transazione toTransazione(ItemTransazione transazioneDB, AmbienteEnum ambiente) {
		Transazione transazione = new Transazione();

		transazione.setProfilo(transazioneDB.getProfilo().toString());
		String contesto = null;
		switch(transazioneDB.getContesto()) {
		case SONDA: contesto = "sonda";
			break;
		case STANDARD: contesto = "applicativo";
			break;
		}

		transazione.setContesto(contesto);
		transazione.setTipologia(transazioneDB.getRuolo().toString());
		
		if(transazioneDB.getMittente()!=null) {
			transazione.setCredenziali(transazioneDB.getMittente().getPrincipal());
			transazione.setxForwardedFor(transazioneDB.getMittente().getIndirizzoClientInoltrato());
			transazione.setRichiedente(transazioneDB.getMittente().getApplicativo());

			transazione.setApplicativoFruitore(transazioneDB.getMittente().getFruitore());
			
			if(transazioneDB.getMittente().getInformazioniFruitore()!=null) {
				transazione.setSoggettoFruitore(transazioneDB.getMittente().getInformazioniFruitore().getCodice());
			}

			transazione.setIndirizzoClient(transazioneDB.getMittente().getIndirizzoClient());
			if(transazioneDB.getMittente().getApplicativoToken()!=null) {
				transazione.setSoggettoTokenApplicativoClient(transazioneDB.getMittente().getApplicativoToken().getSoggetto());
				transazione.setTokenApplicativoClient(transazioneDB.getMittente().getApplicativoToken().getNome());
			}
		}
		
		transazione.setIdApplicativoRichiesta(transazioneDB.getRichiesta().getIdApplicativo());
		transazione.setIdApplicativoRisposta(transazioneDB.getRisposta().getIdApplicativo());
		transazione.setIdTransazione(transazioneDB.getIdTraccia().toString());

		transazione.setDataIngressoRichiestaInRicezione(format(transazioneDB.getRichiesta().getDataRicezione()));
		transazione.setDataUscitaRichiestaInSpedizione(format(transazioneDB.getRichiesta().getDataConsegna()));

		transazione.setDataIngressoRispostaInRicezione(format(transazioneDB.getRisposta().getDataRicezione()));
		transazione.setDataUscitaRispostaConsegnata(format(transazioneDB.getRisposta().getDataConsegna()));

		// latenza totale = risposta.data_consegna -  richiesta.data_ricezione
		
		long latenzaTotale = transazioneDB.getRisposta().getDataConsegna().toInstant().toEpochMilli() - transazioneDB.getRichiesta().getDataRicezione().toInstant().toEpochMilli(); 
		
		transazione.setLatenzaTotale(DurationFormatUtilities.convertSystemTimeIntoStringMillisecondi(latenzaTotale, true));

		// latenza servizio = risposta.data_ricezione -  richiesta.data_consegna (verificare che entrambe siano valorizzate)
		
		if(transazioneDB.getRisposta().getDataRicezione() != null &&
				transazioneDB.getRichiesta().getDataConsegna() != null) {
			long latenzaServizio = transazioneDB.getRisposta().getDataRicezione().toInstant().toEpochMilli() - transazioneDB.getRichiesta().getDataConsegna().toInstant().toEpochMilli(); 

			transazione.setTempoRispostaServizio(DurationFormatUtilities.convertSystemTimeIntoStringMillisecondi(latenzaServizio, true));
		}

		transazione.setProfilo(transazioneDB.getProfilo().toString());

		transazione.setCodiceRispostaIngresso(transazioneDB.getRisposta().getEsitoRicezione());
		transazione.setCodiceRispostaUscita(transazioneDB.getRisposta().getEsitoConsegna());
		
		
		if(transazioneDB.getEsito() != null) {
			transazione.setEsito(transazioneDB.getEsito().getDescrizione());
		}
		
		if(transazioneDB.getApi() != null) {
			transazione.setApi(transazioneDB.getApi().getNome() + " v" + transazioneDB.getApi().getVersione());
			
			if(isSoap(transazioneDB.getApi(), ambiente)) {
				transazione.setAzione(transazioneDB.getApi().getOperazione());
				transazione.setTipoAPI("Soap");
			} else {
				transazione.setAzione(getAzioneRest(transazioneDB.getApi().getOperazione()));
				transazione.setMetodoHTTP(getMetodoHTTPRest(transazioneDB.getApi().getOperazione()));
				transazione.setTipoAPI("Rest");
			}
			if(transazioneDB.getApi().getTags()!= null) {
				transazione.setTags(transazioneDB.getApi().getTags().stream().collect(Collectors.joining(",")));
			}
			transazione.setSoggettoErogatore(transazioneDB.getApi().getErogatore());
		}

		return transazione;
	}

	private PROTOCOLLO getProtocollo(String nome, Integer versione, String erogatore, AmbienteEnum ambiente) {
		ApiEntity api = getIdApi(nome, versione, erogatore);
		ApiConfigEntity conf = ambiente.equals(AmbienteEnum.COLLAUDO) ? api.getCollaudo() : api.getProduzione();
		return conf.getProtocollo();
	}

	private boolean isSoap(TransazioneExtInformazioniApiBase api, AmbienteEnum ambiente) {
		
		if(api == null) return false;
		
		PROTOCOLLO protocollo = getProtocollo(api.getNome(), api.getVersione(), api.getErogatore(), ambiente);
		
		switch(protocollo) {
		case OPENAPI_3:
		case SWAGGER_2: return false;
		case WSDL11:
		case WSDL12: return true;
		}
		return false;
		
	}

	private boolean isSoap(TransazioneExtInformazioniApi api, AmbienteEnum ambiente) {
		
		if(api == null) return false;
		
		PROTOCOLLO protocollo = getProtocollo(api.getNome(), api.getVersione(), api.getErogatore(), ambiente);
		
		switch(protocollo) {
		case OPENAPI_3:
		case SWAGGER_2: return false;
		case WSDL11:
		case WSDL12: return true;
		}
		return false;
		
	}

	public ApiEntity getIdApi(String nome, Integer versione, String erogatore) {
		
		return this.apiService.runTransaction(() -> {
			ApiSpecification spec = new ApiSpecification();
			spec.setNome(Optional.of(nome));
			spec.setVersione(Optional.of(versione));
			List<ApiEntity> apis = this.apiService.findAll(spec, Pageable.unpaged()).toList();
			
			if(apis.size() > 0) {
				if(apis.size() > 1) {
					return apis.stream()
							.filter(a -> a.getServizio().getDominio().getSoggettoReferente().getNome().equals(erogatore)).findAny()
							.orElse(apis.get(0));
				} else {
					return apis.get(0);
				}
			} else {
				throw new BadRequestException("Api ["+nome+"/"+versione+"] erogata da ["+erogatore+"] non trovata");
			}
		});
	}

	public String getAzioneRest(String operazione) {
		
		if(operazione == null) return null;
		
		String met = getMetodoHTTPRest(operazione);
		
		if(met.equals("XXX")) {
			return operazione;
		}
		
		return operazione.replace(met + "_", "");
	}

	public String getMetodoHTTPRest(String operazione) {
		if(operazione == null) return null;
		List<String> ops = Arrays.asList("GET","POST","PUT","HEAD","DELETE","OPTIONS");
		for(String op: ops) {
			if(operazione.startsWith(op + "_")) {
				return op;
			}
		}
		
		return "XXX";
	}

	public String format(OffsetDateTime date) {
		return date != null ? date.toString(): null;
	}

	public Transazione toTransazione(DetailTransazione transazioneDB, AmbienteEnum ambiente) {
		Transazione transazione = new Transazione();

		transazione.setProfilo(transazioneDB.getProfilo().toString());
		String contesto = null;
		switch(transazioneDB.getContesto()) {
		case SONDA: contesto = "sonda";
			break;
		case STANDARD: contesto = "applicativo";
			break;
		}

		transazione.setContesto(contesto);
		transazione.setTipologia(transazioneDB.getRuolo().toString());
		
		if(transazioneDB.getMittente()!=null) {
			transazione.setCredenziali(transazioneDB.getMittente().getPrincipal());
			transazione.setxForwardedFor(transazioneDB.getMittente().getIndirizzoClientInoltrato());
			transazione.setRichiedente(transazioneDB.getMittente().getApplicativo());

			transazione.setApplicativoFruitore(transazioneDB.getMittente().getFruitore());
			
			if(transazioneDB.getMittente().getInformazioniFruitore()!=null) {
				transazione.setSoggettoFruitore(transazioneDB.getMittente().getInformazioniFruitore().getCodice());
			}

			transazione.setIndirizzoClient(transazioneDB.getMittente().getIndirizzoClient());
			if(transazioneDB.getMittente().getApplicativoToken()!=null) {
				transazione.setSoggettoTokenApplicativoClient(transazioneDB.getMittente().getApplicativoToken().getSoggetto());
				transazione.setTokenApplicativoClient(transazioneDB.getMittente().getApplicativoToken().getNome());
			}
		}
		
		transazione.setIdApplicativoRichiesta(transazioneDB.getRichiesta().getIdApplicativo());
		transazione.setIdApplicativoRisposta(transazioneDB.getRisposta().getIdApplicativo());
		transazione.setIdTransazione(transazioneDB.getIdTraccia().toString());

		transazione.setDataIngressoRichiestaInRicezione(format(transazioneDB.getRichiesta().getDataRicezione()));
		transazione.setDataUscitaRichiestaInSpedizione(format(transazioneDB.getRichiesta().getDataConsegna()));

		transazione.setDataIngressoRispostaInRicezione(format(transazioneDB.getRisposta().getDataRicezione()));
		transazione.setDataUscitaRispostaConsegnata(format(transazioneDB.getRisposta().getDataConsegna()));

		// latenza totale = risposta.data_consegna -  richiesta.data_ricezione
		
		long latenzaTotale = transazioneDB.getRisposta().getDataConsegna().toInstant().toEpochMilli() - transazioneDB.getRichiesta().getDataRicezione().toInstant().toEpochMilli(); 
		
		transazione.setLatenzaTotale(DurationFormatUtilities.convertSystemTimeIntoStringMillisecondi(latenzaTotale, true));

		// latenza servizio = risposta.data_ricezione -  richiesta.data_consegna (verificare che entrambe siano valorizzate)
		
		if(transazioneDB.getRisposta().getDataRicezione() != null &&
				transazioneDB.getRichiesta().getDataConsegna() != null) {
			long latenzaServizio = transazioneDB.getRisposta().getDataRicezione().toInstant().toEpochMilli() - transazioneDB.getRichiesta().getDataConsegna().toInstant().toEpochMilli(); 

			transazione.setTempoRispostaServizio(DurationFormatUtilities.convertSystemTimeIntoStringMillisecondi(latenzaServizio, true));
		}

		transazione.setProfilo(transazioneDB.getProfilo().toString());

		transazione.setCodiceRispostaIngresso(transazioneDB.getRisposta().getEsitoRicezione());
		transazione.setCodiceRispostaUscita(transazioneDB.getRisposta().getEsitoConsegna());
		
		
		if(transazioneDB.getEsito() != null) {
			transazione.setEsito(transazioneDB.getEsito().getDescrizione());
		}
		
		if(transazioneDB.getApi() != null) {
			transazione.setApi(transazioneDB.getApi().getNome() + " v" + transazioneDB.getApi().getVersione());
			
			if(isSoap(transazioneDB.getApi(), ambiente)) {
				transazione.setAzione(transazioneDB.getApi().getOperazione());
				transazione.setTipoAPI("Soap");
			} else {
				transazione.setAzione(getAzioneRest(transazioneDB.getApi().getOperazione()));
				transazione.setMetodoHTTP(getMetodoHTTPRest(transazioneDB.getApi().getOperazione()));
				transazione.setTipoAPI("Rest");
			}
			transazione.setTags(transazioneDB.getApi().getTags().stream().collect(Collectors.joining(",")));
			transazione.setSoggettoErogatore(transazioneDB.getApi().getErogatore());
		}

		return transazione;
	}

	public ListTransazioniRawResponse getRawTransazioni(
			Collection<org.govway.catalogo.monitoraggioutils.transazioni.Transazione> collection) throws IOException {
		ListTransazioniRawResponse raw = new ListTransazioniRawResponse();
		raw.setContentType("text/csv");
		TransazioneMapper transazioneMapper = new TransazioneMapper();
		String csv = transazioneMapper.writeValues(collection);
		
		if(csv.isEmpty()) {
			org.govway.catalogo.monitoraggioutils.transazioni.Transazione s = new org.govway.catalogo.monitoraggioutils.transazioni.Transazione();
			String header = transazioneMapper.writeValues(Arrays.asList(s));

			int indexOfNewLine = header.indexOf('\n');

			raw.setResource(header.substring(0, indexOfNewLine).getBytes());
		} else {
			raw.setResource(csv.getBytes());
		}
		return raw;
	}

}

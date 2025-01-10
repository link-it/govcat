/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
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
//package org.govway.catalogo.monitoraggioutils;
//
//import java.io.InputStream;
//import java.time.OffsetDateTime;
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//import java.util.stream.Collectors;
//
//import org.govway.catalogo.controllers.MonitoraggioController;
//import org.govway.catalogo.exception.NotFoundException;
//import org.govway.catalogo.monitoraggioutils.transazioni.GetTransazioneRequest;
//import org.govway.catalogo.monitoraggioutils.transazioni.GetTransazioneResponse;
//import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniRawResponse;
//import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniRequest;
//import org.govway.catalogo.monitoraggioutils.transazioni.ListTransazioniResponse;
//import org.govway.catalogo.servlets.model.ItemTransazione;
//import org.govway.catalogo.servlets.model.PageMetadata;
//import org.govway.catalogo.servlets.model.PagedModelItemTransazione;
//import org.govway.catalogo.servlets.model.Transazione;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//import org.springframework.core.io.ClassPathResource;
//import org.springframework.core.io.Resource;
//import org.springframework.hateoas.Link;
//import org.springframework.util.FileCopyUtils;
//import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
//
//import com.fasterxml.jackson.core.type.TypeReference;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.fasterxml.jackson.databind.PropertyNamingStrategy;
//
//public class SimulazioneMonitoraggioClient implements IMonitoraggioClient{
//
//	private Logger logger = LoggerFactory.getLogger(MonitoraggioController.class);
//
//	private Map<String, ItemTransazione> map = null;
//	private Map<String, Transazione> mapD = null;
//	
//	public SimulazioneMonitoraggioClient() throws Exception {
//		try {
//			if(this.map == null || this.mapD == null) {
//				this.map = new HashMap<>();
//				this.mapD = new HashMap<>();
//				Resource resource = new ClassPathResource("/test.json");
//				InputStream inputStream = resource.getInputStream();
//				byte[] fileData = FileCopyUtils.copyToByteArray(inputStream);
//				String outputString = new String(fileData);
//				Resource resourceD = new ClassPathResource("/testDetail.json");
//				InputStream inputStreamD = resourceD.getInputStream();
//				byte[] fileDataD = FileCopyUtils.copyToByteArray(inputStreamD);
//				String outputStringD = new String(fileDataD);
//				ObjectMapper om = new ObjectMapper();
//				om.setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE);
//	
//				List<ItemTransazione> myObjects = om.readValue(outputString, new TypeReference<List<ItemTransazione>>(){});
//				List<Transazione> myObjectsD = om.readValue(outputStringD, new TypeReference<List<Transazione>>(){});
//
//				logger.info("Leggo ["+myObjects.size()+"] transazioni");
//
//				for(ItemTransazione object: myObjects) {
//					object.setData(OffsetDateTime.now());
//					map.put(object.getIdTraccia(), object);
//					
//					logger.info("Aggiungo " + object.getIdTraccia());
//				}
//				for(Transazione object: myObjectsD) {
//					object.setData(OffsetDateTime.now());
//					object.getRichiesta().setDataRicezione(OffsetDateTime.now());
//					object.getRichiesta().setDataConsegna(OffsetDateTime.now());
//					object.getRisposta().setDataRicezione(OffsetDateTime.now());
//					object.getRisposta().setDataConsegna(OffsetDateTime.now());
//					
//					mapD.put(object.getIdTraccia(), object);
//					
//					logger.info("Aggiungo " + object.getIdTraccia());
//				}
//			}
//		} catch(Exception e) {
//			logger.error("Errore durante l'init: " + e.getMessage(), e);
//			throw e;
//		}
//	}
//
//
//	@Override
//	public GetTransazioneResponse getTransazione(GetTransazioneRequest request) {
//		String idTraccia = request.getIdTransazione().toString();
//		if(mapD.containsKey(idTraccia)) {
//			GetTransazioneResponse response = new GetTransazioneResponse();
//			response.setTransazione(mapD.get(idTraccia));
//			return response;
//		} else {
//			throw new NotFoundException("Traccia ["+idTraccia+"] non trovata");
//		}
//	}
//
//	@Override
//	public ListTransazioniResponse listTransazioni(ListTransazioniRequest request) {
//		ListTransazioniResponse response = new ListTransazioniResponse();
//
//		Link link = new Link(ServletUriComponentsBuilder.fromCurrentRequest().build()
//				.toUriString())
//				.withSelfRel();
//
//		PagedModelItemTransazione list = new PagedModelItemTransazione();
//		list.setContent(map.values().stream().collect(Collectors.toList()));
//		list.add(link);
//		list.setPage(new PageMetadata().size((long)map.size()).number(1l).totalElements((long)map.size()).totalPages(1l));
//
//		response.setPagedModel(list);
//
//		return response;
//	}
//
//
//	@Override
//	public boolean isLimitata() {
//		return false;
//	}
//
//
//	@Override
//	public ListTransazioniRawResponse listTransazioniRaw(ListTransazioniRequest request) {
//		// TODO Auto-generated method stub
//		return null;
//	}
//
//}

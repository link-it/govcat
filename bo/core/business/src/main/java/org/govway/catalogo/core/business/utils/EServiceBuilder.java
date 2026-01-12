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
package org.govway.catalogo.core.business.utils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import jakarta.xml.bind.JAXBException;

import org.govway.catalogo.core.orm.entity.AllegatoApiEntity;
import org.govway.catalogo.core.orm.entity.AllegatoServizioEntity;
import org.govway.catalogo.core.orm.entity.AllegatoServizioEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.PROTOCOLLO;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.PackageServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.stampe.StampePdf;
import org.govway.catalogo.stampe.model.EService;
import org.govway.catalogo.stampe.model.EtichetteProfiliType;
import org.govway.catalogo.stampe.model.EtichetteScopoType;
import org.govway.catalogo.stampe.model.ProfiliType;
import org.govway.catalogo.stampe.model.RigaProfiliType;
import org.govway.catalogo.stampe.model.RigaScopoType;
import org.govway.catalogo.stampe.model.RigheProfiliType;
import org.govway.catalogo.stampe.model.RigheScopoType;
import org.govway.catalogo.stampe.model.ScopoType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class EServiceBuilder {

	private Logger logger = LoggerFactory.getLogger(EServiceBuilder.class);

	private static char SPLIT_RESOURCES = ',';
	
	@Autowired
	private ConfigurazioneEService configurazione;

	public byte[] getEService(ServizioEntity servizio) throws Exception {
		if(servizio.is_package()) {
			return getEServicePackage(servizio);
		} else {
			return getEServiceServizio(servizio);
		}
	}

	public byte[] getSpecificaApi(ApiEntity api, ApiConfigEntity config) throws Exception {
        Map<String, byte[]> map = new HashMap<>();

        this.addDocumentFilesApi(api.getAllegati(), "", map);

        DocumentoEntity specifica = config.getSpecifica();
        
        if(specifica!=null) {
                map.put(specifica.getFilename(), specifica.getRawData());
        }
        
        return this.mapToZip(map);

	}

	private byte[] getEServiceServizio(ServizioEntity servizio) throws Exception {
		Map<String, byte[]> map = new HashMap<>();
		populateEServiceServizio(servizio, map, "");
		return this.mapToZip(map);
	}
	
	private void populateEServiceServizio(ServizioEntity servizio, Map<String, byte[]> map, String prefix) throws Exception {
		this.addDocumentFilesServizio(servizio.getAllegati(), prefix, map);

		if(servizio.getApi().isEmpty()) {
			throw new Exception("Servizio "+servizio.getNome()+"_v"+servizio.getVersione()+" non ha api");
		}

		for(ApiEntity api: servizio.getApi()) {
			map.putAll(this.getApiFiles(api, api.getNome()+"_"+api.getVersione() + "/" + prefix, true));
		}
	}
	
	private byte[] getEServicePackage(ServizioEntity servizio) throws Exception {
		Map<String, byte[]> map = new HashMap<>();

		this.addDocumentFilesServizio(servizio.getAllegati(), servizio.getNome()+"_v"+servizio.getVersione() + "/", map);

		for(PackageServizioEntity componente: servizio.getComponenti()) {
			populateEServiceServizio(componente.getServizio(), map, componente.getServizio().getNome() + "_" + componente.getServizio().getVersione());
		}
		return this.mapToZip(map);
	}
	
    public byte[] getTryOutOpenAPI(ApiEntity api, ApiConfigEntity entity, boolean isCollaudo) throws IOException {
    	ConfigurazioneTryout conf = new ConfigurazioneTryout();
    	conf.setServerUrl(this.getUrlInvocazione(api, isCollaudo));
		return getTryOutOpenAPI(entity.getSpecifica().getRawData(), conf);
	}
	
    public static byte[] getTryOutOpenAPI(byte[] originalOpenapi, ConfigurazioneTryout conf) throws IOException {
    	byte[] jsonOpenapi = YamltoJsonUtils.convertYamlToJson(originalOpenapi);
    	return getTryOutOpenAPIFromJson(jsonOpenapi, conf);
	}
	
	
    public static byte[] getTryOutOpenAPIFromJson(byte[] originalOpenapi, ConfigurazioneTryout conf) throws IOException {

        ObjectMapper reader = new ObjectMapper();
        reader.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        Logger logger = LoggerFactory.getLogger(EServiceBuilder.class);

        // Step 2: Parse OpenAPI file
        JsonNode openApiJson = reader.readTree(originalOpenapi);

        logger.debug("Parsing OpenAPI JSON for try-out. OpenAPI root type: {}", openApiJson.getClass().getName());

        // Detect if it's Swagger 2.0 or OpenAPI 3.0
        JsonNode swaggerVersion = openApiJson.path("swagger");
        JsonNode openapiVersion = openApiJson.path("openapi");

        boolean isSwagger2 = !swaggerVersion.isMissingNode() && swaggerVersion.asText().startsWith("2.");
        boolean isOpenApi3 = !openapiVersion.isMissingNode() && openapiVersion.asText().startsWith("3.");

        logger.debug("Detected format - isSwagger2: {}, isOpenApi3: {}", isSwagger2, isOpenApi3);

        if (isSwagger2) {
            // Swagger 2.0: parse URL and set host, basePath, schemes
            logger.debug("Processing Swagger 2.0 format");
            String serverUrl = conf.getServerUrl();

            try {
                java.net.URL url = new java.net.URL(serverUrl);
                String scheme = url.getProtocol();
                String host = url.getHost();
                if (url.getPort() != -1 && url.getPort() != 80 && url.getPort() != 443) {
                    host = host + ":" + url.getPort();
                }
                String basePath = url.getPath();
                if (basePath == null || basePath.isEmpty()) {
                    basePath = "/";
                }

                logger.debug("Parsed URL - scheme: {}, host: {}, basePath: {}", scheme, host, basePath);

                // Set schemes
                ArrayNode schemesArray = reader.createArrayNode();
                schemesArray.add(scheme);
                ((ObjectNode) openApiJson).set("schemes", schemesArray);

                // Set host
                ((ObjectNode) openApiJson).put("host", host);

                // Set basePath
                ((ObjectNode) openApiJson).put("basePath", basePath);

                logger.debug("Updated Swagger 2.0 with host: {}, basePath: {}, schemes: [{}]", host, basePath, scheme);

            } catch (Exception e) {
                logger.error("Failed to parse URL: {} - {}", serverUrl, e.getMessage(), e);
            }

        } else if (isOpenApi3) {
            // OpenAPI 3.0: set servers array
            logger.debug("Processing OpenAPI 3.0 format");
            JsonNode serversNode = openApiJson.path("servers");
            logger.debug("serversNode type: {}, isMissingNode: {}, isArray: {}, size: {}",
                    serversNode.getClass().getName(),
                    serversNode.isMissingNode(),
                    serversNode.isArray(),
                    serversNode.isArray() ? serversNode.size() : "N/A");

            if (serversNode.isArray() && serversNode.size() > 0) {
                logger.debug("Modifying existing servers node with first server");
                ObjectNode serverNode = ((ObjectNode) serversNode.get(0));
                serverNode.put("url", conf.getServerUrl());

                serversNode = reader.createArrayNode().add(serverNode);
                ((ObjectNode) openApiJson).set("servers", serversNode);
                logger.debug("Updated servers node with URL: {}", conf.getServerUrl());
            } else {
                logger.debug("Creating new servers node (servers was missing or empty)");
                ObjectNode serverNode = reader.createObjectNode();
                serverNode.put("url", conf.getServerUrl());

                // If no servers node exists, create one
                ArrayNode newServersArray = reader.createArrayNode().add(serverNode);
                ((ObjectNode) openApiJson).set("servers", newServersArray);
                logger.debug("Created new servers array with URL: {}", conf.getServerUrl());

                // Verify the node was actually set
                JsonNode verifyServers = openApiJson.path("servers");
                logger.debug("Verification after set - servers exists: {}, isArray: {}, size: {}",
                        !verifyServers.isMissingNode(),
                        verifyServers.isArray(),
                        verifyServers.isArray() ? verifyServers.size() : "N/A");
            }
        } else {
            logger.warn("Unknown API specification format (not Swagger 2.0 or OpenAPI 3.0)");
        }

        ObjectMapper writer = new ObjectMapper();
        writer.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        // Step 5: Serialize updated OpenAPI object back in JSON
        byte[] result = writer.writeValueAsBytes(openApiJson);
        logger.debug("Serialized OpenAPI to {} bytes", result.length);

        return result;
    }

	public Map<String, byte[]> getApiFiles(ApiEntity api, String prefix, boolean collaudo) {
		Map<String, byte[]> map = new HashMap<String, byte[]>();
		
		DocumentoEntity specificaCollaudo = api.getCollaudo().getSpecifica();
		DocumentoEntity specificaProduzione = Optional.ofNullable(api.getProduzione()).map(s -> s.getSpecifica()).orElse(null);

		if(specificaCollaudo!=null) {
			map.put(getPrefixFolder(org.govway.catalogo.core.orm.entity.AllegatoApiEntity.TIPOLOGIA.SPECIFICA_COLLAUDO, prefix)+specificaCollaudo.getFilename(), specificaCollaudo.getRawData());
		}
		
		if(specificaProduzione!=null) {
			map.put(getPrefixFolder(org.govway.catalogo.core.orm.entity.AllegatoApiEntity.TIPOLOGIA.SPECIFICA_PRODUZIONE, prefix)+specificaProduzione.getFilename(), specificaProduzione.getRawData());
		}
		
		this.addDocumentFilesApi(api.getAllegati(), prefix, map);
		
		if(api.getRuolo().equals(RUOLO.EROGATO_SOGGETTO_DOMINIO)) {
			
			EService eser = new EService();
			
			if(this.configurazione.getPdfLogo()!=null) {
				eser.setLogo(this.configurazione.getPdfLogo());
			}
			eser.setTitolo("Descrittore eService");
			eser.setSottotitolo(api.getNome());
	
			ScopoType tabscopo = new ScopoType();
	
			EtichetteScopoType etichette = new EtichetteScopoType();
			
			etichette.setTitolo(Optional.ofNullable(api.getDescrizione()).map(d -> new String(d)).orElse(null));
			etichette.setDato("Dato");
			etichette.setValore("Valore");
			tabscopo.setEtichette(etichette);
			
			List<RigaScopoType> righeLst = new ArrayList<>();
			
			RigaScopoType rigaNome = new RigaScopoType();
			rigaNome.setDato("Nome servizio");
			rigaNome.setValore(api.getNome());
			righeLst.add(rigaNome);
	
			RigaScopoType rigaVersione = new RigaScopoType();
			rigaVersione.setDato("Versione");
			rigaVersione.setValore(api.getVersione()+"");
			righeLst.add(rigaVersione);
	
			RigaScopoType rigaTecnologia = new RigaScopoType();
			rigaTecnologia.setDato("Tecnologia");
			String tecnoString = getTecnologia(api, collaudo);
			rigaTecnologia.setValore(tecnoString);
			righeLst.add(rigaTecnologia);
	
			RigaScopoType rigaDescrittore = new RigaScopoType();
			rigaDescrittore.setDato("Descrittore");
			if(specificaCollaudo!=null) {
				rigaDescrittore.setValore(specificaCollaudo.getFilename());
			}
			righeLst.add(rigaDescrittore);
	
			RigaScopoType rigaBaseurlCollaudo = new RigaScopoType();
			rigaBaseurlCollaudo.setDato("Base URL pubblica (Collaudo)");
			
			String valoreCollaudo = this.getUrlInvocazione(api, true);
					
			rigaBaseurlCollaudo.setValore(valoreCollaudo);
			righeLst.add(rigaBaseurlCollaudo);
	
			RigaScopoType rigaBaseurlProd = new RigaScopoType();
			rigaBaseurlProd.setDato("Base URL pubblica (Produzione)");

			String valoreProduzione = this.getUrlInvocazione(api, false);
			rigaBaseurlProd.setValore(valoreProduzione);
			righeLst.add(rigaBaseurlProd);
	
			RigheScopoType righe = new RigheScopoType();
			righe.getRiga().addAll(righeLst);
			
			tabscopo.setRighe(righe);
			eser.setScopo(tabscopo);
			
			List<AuthTypeEntity> authTypeList = api.getAuthType();
			
			if(authTypeList!=null && !authTypeList.isEmpty()) {
				ProfiliType profilo = new ProfiliType();
		
				EtichetteProfiliType etichetteProfilo = new EtichetteProfiliType();
				
				etichetteProfilo.setNome("Profilo");
				etichetteProfilo.setTitolo("Profili di Interoperabilità da utilizzare per le operation/risorse dell'API");
				etichetteProfilo.setRisorse("Operation/Risorse");
				profilo.setEtichette(etichetteProfilo);
		
				List<RigaProfiliType> righeProfilo = new ArrayList<RigaProfiliType>();
		
				for(AuthTypeEntity at: authTypeList) {
					RigaProfiliType rigaProfilo = new RigaProfiliType();
					rigaProfilo.setNome(getProfiloString(at.getProfilo(), this.configurazione.getProfili()));
					
					if(authTypeList.size() == 1) {
						rigaProfilo.setRisorsa("Tutte");
						rigaProfilo.getRisorse().add("Tutte");
					} else {
						String[] res = new String(at.getResources()).split(SPLIT_RESOURCES +"");
						rigaProfilo.setRisorsa(String.join(",", res));
						for(String risorsa: res) {
							rigaProfilo.getRisorse().add(risorsa);
						}
					}
		
					righeProfilo.add(rigaProfilo);
		
				}
				
				RigheProfiliType righeP = new RigheProfiliType();
				righeP.getRiga().addAll(righeProfilo);
				profilo.setRighe(righeP);
		
				eser.setProfili(profilo);
			}
	
			try {
				map.put(prefix+"eService-"+api.getNome()+"-"+api.getVersione()+".pdf", StampePdf.getInstance().creaEServicePDF(logger,eser));
			} catch(IOException e) {
				this.logger.error("Errore:" + e.getMessage(), e);
			} catch (JAXBException e) {
				this.logger.error("Errore:" + e.getMessage(), e);
			} catch (Exception e) {
				this.logger.error("Errore generazione PDF:" + e.getMessage(), e);
			}
		}
		
		return map;
	}
	
	
	public String getProfiloString(String profiloKey) {
		return getProfiloString(profiloKey, this.configurazione.getProfili());
	}

	private String getProfiloString(String profiloKey, Map<String, String> mapProfili) {
		return mapProfili.containsKey(profiloKey) ? mapProfili.get(profiloKey) : profiloKey;
	}

	public void addDocumentFilesServizio(Set<AllegatoServizioEntity> documenti, String prefix, Map<String, byte[]> map) {
		for(AllegatoServizioEntity d: documenti) {
			if(d.getVisibilita().equals(VISIBILITA.PUBBLICO)) {
				String prefixFolder = getPrefixFolder(d.getTipologia(), prefix);
				map.put(prefixFolder + d.getDocumento().getFilename(), d.getDocumento().getRawData());
			}
		}
	}

	public void addDocumentFilesApi(Set<AllegatoApiEntity> documenti, String prefix, Map<String, byte[]> map) {
		
		for(AllegatoApiEntity d: documenti) {
			if(d.getVisibilita().equals(org.govway.catalogo.core.orm.entity.AllegatoApiEntity.VISIBILITA.PUBBLICO)) {
				String prefixFolder = getPrefixFolder(d.getTipologia(), prefix);
				map.put(prefixFolder+ d.getDocumento().getFilename(), d.getDocumento().getRawData());
			}
		}
	}

	private String getPrefixFolder(org.govway.catalogo.core.orm.entity.AllegatoApiEntity.TIPOLOGIA tipologia, String prefix) {
		String prefixSpecifica = prefix+"specifica/";
		String prefixSpecificaCollaudo = prefix+"specifica/collaudo/";
		String prefixSpecificaProduzione = prefix+"specifica/produzione/";
		String prefixAllegati = prefix+"allegati/";

		switch(tipologia) {
		case GENERICO: return prefixAllegati;
		case SPECIFICA: return prefixSpecifica;
		case SPECIFICA_COLLAUDO: return prefixSpecificaCollaudo;
		case SPECIFICA_PRODUZIONE: return prefixSpecificaProduzione;
		}
		
		return "";
	}
	
	private String getPrefixFolder(org.govway.catalogo.core.orm.entity.AllegatoServizioEntity.TIPOLOGIA tipologia, String prefix) {
		String prefixSpecifica = prefix+"specifica/";
		String prefixSpecificaCollaudo = prefix+"specifica/collaudo/";
		String prefixSpecificaProduzione = prefix+"specifica/produzione/";
		String prefixAllegati = prefix+"allegati/";

		switch(tipologia) {
		case GENERICO: return prefixAllegati;
		case SPECIFICA: return prefixSpecifica;
		case SPECIFICA_COLLAUDO: return prefixSpecificaCollaudo;
		case SPECIFICA_PRODUZIONE: return prefixSpecificaProduzione;
		}
		
		return "";
	}
	
//	private String getPrefixFolder(org.govway.catalogo.core.orm.entity.AllegatoApiEntity.TIPOLOGIA tipologia, String prefixAllegati, String prefixSpecifica) {
//
//		
//		String prefixSpecificaCollaudo = prefixSpecifica+"collaudo/";
//		String prefixSpecificaProduzione = prefixSpecifica+"produzione/";
//
//		switch(tipologia) {
//		case GENERICO: return prefixAllegati;
//		case SPECIFICA: return prefixSpecifica;
//		case SPECIFICA_COLLAUDO: return prefixSpecificaCollaudo;
//		case SPECIFICA_PRODUZIONE: return prefixSpecificaProduzione;
//		}
//		
//		return "";
//	}

	private String getTecnologia(ApiEntity api, boolean collaudo) {
		String tecnoString = "";
		
		PROTOCOLLO protocollo = getProtocollo(api, collaudo);
		
		switch(protocollo) {
		case WSDL11:
		case WSDL12: tecnoString = "soap";
		break;
		case OPENAPI_3:
		case SWAGGER_2: tecnoString = "rest";
			break;}
		return tecnoString;
	}
	
	public byte[] mapToZip(Map<String, byte[]> mapReport) throws IOException {
		try(ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
			try(ZipOutputStream zos = new ZipOutputStream(baos)) {
				for (Entry<String, byte[]> report : mapReport.entrySet()) {
					ZipEntry entry = new ZipEntry(report.getKey());
					entry.setSize(report.getValue().length);
					zos.putNextEntry(entry);
					zos.write(report.getValue());
					zos.closeEntry();
				}
				zos.close();
				return baos.toByteArray();
			}
		}
	}

	public String getUrlInvocazione(ApiEntity api, boolean collaudo) {
		
		String prefix = getPrefix(api, collaudo);
		String soggettoReferente = getNome(api.getServizio().getDominio().getSoggettoReferente()); 
		String soggettoInterno = getNome(api.getServizio().getSoggettoInterno()); 
		
		String urlInvocazione = Optional.ofNullable(api.getUrlInvocazione())
		        .or(() -> Optional.ofNullable(api.getServizio().getUrlInvocazione()))
		        .or(() -> Optional.ofNullable(api.getServizio().getDominio().getUrlInvocazione()))
		        .or(() -> Optional.ofNullable(api.getServizio().getDominio().getSoggettoReferente().getUrlInvocazione()))
		        .orElse(this.configurazione.getTemplateUrlInvocazione());
		
		String url = urlInvocazione
				.replaceAll("#prefix#", prefix)
				.replaceAll("#soggetto_interno#", soggettoInterno)
				.replaceAll("#soggetto_referente#", soggettoReferente)
				.replaceAll("#nome#", getNome(api, collaudo))
				.replaceAll("#versione#", api.getVersione() + "")
				.replaceAll("#tecnologia#", getTecnologia(api, collaudo))
				.replaceAll("#protocollo#", getProtocollo(api, collaudo).toString());

		while(url.contains("//")) {
			url = url.replaceAll("//", "/");
		}
		url = url.replace("http:/", "http://");
		url = url.replace("https:/", "https://");

		return url;
				
	}
	
	private PROTOCOLLO getProtocollo(ApiEntity api, boolean collaudo) {

		if(collaudo) {
			return api.getCollaudo().getProtocollo();			
		} else {
			return Optional.ofNullable(api.getProduzione())
					.map(b -> b.getProtocollo())
					.orElse(getProtocollo(api, true));
		}

	}

	private String getNome(SoggettoEntity soggetto) {
		
		return Optional.ofNullable(soggetto)
				.map(s -> {
					return Optional.ofNullable(s.getNomeGateway()).orElse(s.getNome());
				}).orElse("");

	}

	
	private String getNome(ApiEntity api, boolean collaudo) {
		if(collaudo) {
			return Optional.of(api)
					.map(a -> {
						return Optional.ofNullable(a.getCollaudo())
							.map(b -> b.getNomeGateway())
							.orElse(a.getNome());
					}).orElse("");
		} else {
			return Optional.of(api)
					.map(a -> {
						return Optional.ofNullable(a.getProduzione())
						.map(b -> b.getNomeGateway())
							.orElse(a.getNome());
					}).orElse("");
		}
	}

	private String getPrefix(ApiEntity api, boolean collaudo) {
		
		if(collaudo) {
			return Optional.ofNullable(api.getCollaudo())
			        .map(a -> a.getUrlPrefix())
			        .or(() -> Optional.ofNullable(api.getServizio().getUrlPrefixCollaudo()))
			        .or(() -> Optional.ofNullable(api.getServizio().getDominio().getUrlPrefixCollaudo()))
			        .or(() -> Optional.ofNullable(api.getServizio().getDominio().getSoggettoReferente().getUrlPrefixCollaudo()))
			        .orElse(this.configurazione.getDefaultUrlPrefixCollaudo());
		} else {
			return Optional.ofNullable(api.getProduzione())
			        .map(a -> a.getUrlPrefix())
			        .or(() -> Optional.ofNullable(api.getServizio().getUrlPrefixProduzione()))
			        .or(() -> Optional.ofNullable(api.getServizio().getDominio().getUrlPrefixProduzione()))
			        .or(() -> Optional.ofNullable(api.getServizio().getDominio().getSoggettoReferente().getUrlPrefixProduzione()))
			        .orElse(this.configurazione.getDefaultUrlPrefixProduzione());
		}
	}

	public byte[] getEServiceApi(ApiEntity api) throws Exception {
		return mapToZip(getApiFiles(api, "", true));
	}


}

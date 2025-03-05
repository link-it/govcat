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
/**
 * La classe CommonUtils fornisce metodi comuni a tutti i test 
 */

package testsuite;

import static org.assertj.core.api.Assertions.fail;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.controllers.ServiziController;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.APICreate;
import org.govway.catalogo.servlets.model.AmbienteEnum;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.AuthTypeHttpBasicCreate;
import org.govway.catalogo.servlets.model.Campo;
import org.govway.catalogo.servlets.model.ClientCreate;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.DatiSpecificiClientCreate;
import org.govway.catalogo.servlets.model.DominioCreate;
import org.govway.catalogo.servlets.model.EntitaComplessaError;
import org.govway.catalogo.servlets.model.GruppoCreate;
import org.govway.catalogo.servlets.model.OrganizzazioneCreate;
import org.govway.catalogo.servlets.model.ProtocolloEnum;
import org.govway.catalogo.servlets.model.RuoloAPIEnum;
import org.govway.catalogo.servlets.model.ServizioCreate;
import org.govway.catalogo.servlets.model.SoggettoCreate;
import org.govway.catalogo.servlets.model.StatoClientEnum;
import org.govway.catalogo.servlets.model.StatoUpdate;
import org.govway.catalogo.servlets.model.StatoUtenteEnum;
import org.govway.catalogo.servlets.model.TassonomiaCreate;
import org.govway.catalogo.servlets.model.TipoServizio;
import org.govway.catalogo.servlets.model.TipoSoggettoGateway;
import org.govway.catalogo.servlets.model.UtenteCreate;
import org.govway.catalogo.servlets.model.VisibilitaDominioEnum;
import org.govway.catalogo.servlets.model.VisibilitaServizioEnum;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;

public class CommonUtils {
	
	public static final String NOME_ORGANIZZAZIONE = "Nome Organizzazione TEST per Soggetto";
	public static final String DESCRIZIONE = "Questa è una descrizione di test";
	public static final String CODICE_ENTE = "xdfg686hsahgdjg";
	public static final String CODICE_FISCALE_SOGGETTO = "adljdalkhf132801";
	public static final String ID_TIPO_UTENTE = "xyz";
	public static final Boolean REFERENTE = true;
	public static final Boolean ADERENTE = false;
	public static final Boolean ESTERNA = true;
	
	public static final String NOME_SOGGETTO = "Nome Soggetto TEST";
	public static final String NOME_GATEWAY = "Nome Gateway TEST";
	public static final TipoSoggettoGateway TIPO_SOGGETTO_GATEWAY = TipoSoggettoGateway.EDELIVERY;
	
	public static final String CLIENT_NOME = "Nome Client TEST";
	public static final AmbienteEnum AMBIENTE = AmbienteEnum.COLLAUDO;
	public static final StatoClientEnum STATO = StatoClientEnum.NUOVO;

	public static final StatoUtenteEnum STATO_UTENTE = StatoUtenteEnum.ABILITATO;
	public static final String NOME_UTENTE = "NomeTest";
	public static final String COGNOME_UTENTE = "CognomeTest";
	public static final String EMAIL_UTENTE = "email@test.com";
	public static final String TELEFONO_AZIENDALE = "000-000-000-00"; 
	public static final String EMAIL_AZIENDALE = "mail@aziendale.com";
	public static final String USERNAME = "usernameTest";
	
	public static final boolean DEPRECATO = false;
	public static final String DESCRIZIONE_DOMINIO = "questa è la descrizione TEST";
	public static final String NOME_DOMINIO = "Test";
	public static final String TAG = "#tagTest";
	public static final VisibilitaServizioEnum VISIBILITA_SERVIZIO = VisibilitaServizioEnum.RISERVATO;
	public static final VisibilitaDominioEnum VISIBILITA_DOMINIO = VisibilitaDominioEnum.RISERVATO;
	
	public static final String NOME_SERVIZIO = "Nome Servizio TEST";
	public static final String VERSIONE_SERVIZIO = "2";
	
	public static final String NOME_GRUPPO = "Nome Gruppo TEST";
	public static final String DESCRIZIONE_GRUPPO = "Descrizione Completa Gruppo TEST";
	public static final String DESCRIZIONE_SINTETICA_GRUPPO = "Descrizione Sintetica Gruppo TEST";
	
	public static final String NOME_TASSONOMIA = "Nome TASSONOMIA TEST";
	public static final String DESCRIZIONE_TASSONOMIA = "Descrizione Tassonomia TEST";
	
	public static final String NOME_API = "Nome API TEST";
	public static final int VERSIONE_API = 2;
	public static final RuoloAPIEnum RUOLO_API = RuoloAPIEnum.ADERENTE;
	public static final ProtocolloEnum PROTOCOLLO_API = ProtocolloEnum.REST;

	public static final String openApiSpec = 
		    "openapi: 3.0.0\n" +
		    	    "info:\n" +
		    	    "  title: API di Test\n" +
		    	    "  description: Una semplice API di test per dimostrare OpenAPI\n" +
		    	    "  version: 1.0.0\n" +
		    	    "servers:\n" +
		    	    "  - url: http://localhost:8080\n" +
		    	    "    description: Server locale di sviluppo\n" +
		    	    "paths:\n" +
		    	    "  /hello:\n" +
		    	    "    get:\n" +
		    	    "      summary: Ottiene un messaggio di saluto\n" +
		    	    "      description: Ritorna un messaggio di benvenuto\n" +
		    	    "      operationId: getHello\n" +
		    	    "      responses:\n" +
		    	    "        '200':\n" +
		    	    "          description: Risposta con il saluto\n" +
		    	    "          content:\n" +
		    	    "            application/json:\n" +
		    	    "              schema:\n" +
		    	    "                type: object\n" +
		    	    "                properties:\n" +
		    	    "                  message:\n" +
		    	    "                    type: string\n" +
		    	    "                    example: \"Ciao, mondo!\"\n";
	
	public static OrganizzazioneCreate getOrganizzazioneCreate(){
		// Creazione dell'istanza di OrganizzazioneCreate
        OrganizzazioneCreate organizzazioneCreate = new OrganizzazioneCreate();
        organizzazioneCreate.setNome(NOME_ORGANIZZAZIONE);
        organizzazioneCreate.setDescrizione(DESCRIZIONE);
        organizzazioneCreate.setCodiceEnte(CODICE_ENTE);
        organizzazioneCreate.setCodiceFiscaleSoggetto(CODICE_FISCALE_SOGGETTO);
        organizzazioneCreate.setIdTipoUtente(ID_TIPO_UTENTE);
        organizzazioneCreate.setReferente(REFERENTE);
        organizzazioneCreate.setAderente(ADERENTE);
        organizzazioneCreate.setEsterna(ESTERNA);
        
        return organizzazioneCreate;
	}
	
	public static SoggettoCreate getSoggettoCreate(){
		// Creazione dell'istanza di SoggettoCreate
        SoggettoCreate soggettoCreate = new SoggettoCreate();
        soggettoCreate.setNome(NOME_SOGGETTO);
        soggettoCreate.setDescrizione(DESCRIZIONE);
        soggettoCreate.setAderente(ADERENTE);
        soggettoCreate.setNomeGateway(NOME_GATEWAY);
        soggettoCreate.setReferente(REFERENTE);
        soggettoCreate.setTipoGateway(TIPO_SOGGETTO_GATEWAY);

        return soggettoCreate;
	}
	
	public static ClientCreate getClientCreate() {
		ClientCreate client = new ClientCreate();
    	client.setNome(CLIENT_NOME);
    	client.setAmbiente(AMBIENTE);
    	client.setStato(STATO);
    	AuthTypeHttpBasicCreate authType = new AuthTypeHttpBasicCreate();
        authType.setAuthType(AuthTypeEnum.HTTP_BASIC);
        DatiSpecificiClientCreate dati = new DatiSpecificiClientCreate();
        dati.setAuthType(AuthTypeEnum.HTTP_BASIC);
    	dati.setFinalita(authType.getFinalita());
        client.setDatiSpecifici(authType);
        
        return client;
	}
	
	public static UtenteCreate getUtenteCreate() {
		UtenteCreate utente = new UtenteCreate();
		utente.setStato(STATO_UTENTE);
		utente.setNome(NOME_UTENTE);
		utente.setCognome(COGNOME_UTENTE);
		utente.setEmail(EMAIL_UTENTE);
		utente.setEmailAziendale(EMAIL_AZIENDALE);
		utente.setTelefonoAziendale(TELEFONO_AZIENDALE);
		utente.setPrincipal(USERNAME);
		return utente;
	}
	
	public static DominioCreate getDominioCreate() {
		DominioCreate dominio = new DominioCreate();
		dominio.setDeprecato(DEPRECATO);
		dominio.setDescrizione(DESCRIZIONE_DOMINIO);
		dominio.setNome(NOME_DOMINIO);
		dominio.setTag(TAG);
		dominio.setVisibilita(VISIBILITA_DOMINIO);
		return dominio;
	}
	
	public static ServizioCreate getServizioCreate() {
		ServizioCreate servizio = new ServizioCreate();
		servizio.setNome(NOME_SERVIZIO);
		servizio.setVersione(VERSIONE_SERVIZIO);
		servizio.setTipo(TipoServizio.API);
		servizio.setPackage(false);
		return servizio;
	}
	
	public static GruppoCreate getGruppoCreate() {
		GruppoCreate gruppo = new GruppoCreate();
		gruppo.setNome(NOME_GRUPPO);
		gruppo.setDescrizione(DESCRIZIONE_GRUPPO);
		gruppo.setDescrizioneSintetica(DESCRIZIONE_SINTETICA_GRUPPO);
		gruppo.setTipo(TipoServizio.API);
		return gruppo;
	}
	
	public static TassonomiaCreate getTassonomiaCreate() {
		TassonomiaCreate tassonomia = new TassonomiaCreate();
		tassonomia.setNome(NOME_TASSONOMIA);
		tassonomia.setDescrizione(DESCRIZIONE_TASSONOMIA);
		return tassonomia;
	}
	
	
	public static APICreate getAPICreate() {
		APICreate apiCreate = new APICreate();
		apiCreate.setNome(NOME_API);
		apiCreate.setVersione(VERSIONE_API);
		apiCreate.setRuolo(RUOLO_API);
//		apiCreate.setProtocollo(PROTOCOLLO_API);
		return apiCreate;
	}
	
	public static InfoProfilo getSessionUtente(String username, SecurityContext securityContext, Authentication authentication, UtenteService utenteService){
		InfoProfilo infoProfiloGestore = getInfoProfilo(username, utenteService); 
    	when(authentication.getPrincipal()).thenReturn(infoProfiloGestore);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        return infoProfiloGestore;
	}
	
	private static InfoProfilo getInfoProfilo(String idUtente, UtenteService utenteService) {
		return utenteService.runTransaction(() -> {
			UtenteEntity utente = utenteService.findByPrincipal(idUtente).orElseThrow(() -> new NotFoundException("Utente "+idUtente+" non trovato"));
			
			if(utente.getOrganizzazione()!=null) {
				utente.getOrganizzazione().getSoggetti().stream().forEach(s -> {s.getNome();});
			}
			
			utente.getClassi().stream().forEach( e-> {e.getNome();});
	
			return new InfoProfilo(idUtente, utente, List.of());
		});
	}
	
	//mi consente di fare tutti i passaggi di stato fino a statoFinale
	public static void cambioStatoFinoA(String statoFinale, ServiziController serviziController, UUID idServizio) {
        List<StatoUpdate> sequenzaStati = new ArrayList<>();

        // Creazione e impostazione degli oggetti StatoUpdate
        StatoUpdate stato1 = new StatoUpdate();
        stato1.setStato("richiesto_collaudo");
        stato1.setCommento("richiesta di collaudo");
        sequenzaStati.add(stato1);

        StatoUpdate stato2 = new StatoUpdate();
        stato2.setStato("autorizzato_collaudo");
        stato2.setCommento("autorizzato collaudo");
        sequenzaStati.add(stato2);

        StatoUpdate stato3 = new StatoUpdate();
        stato3.setStato("in_configurazione_collaudo");
        stato3.setCommento("in configurazione collaudo");
        sequenzaStati.add(stato3);

        StatoUpdate stato4 = new StatoUpdate();
        stato4.setStato("pubblicato_collaudo");
        stato4.setCommento("pubblicato in collaudo");
        sequenzaStati.add(stato4);

        StatoUpdate stato5 = new StatoUpdate();
        stato5.setStato("richiesto_produzione");
        stato5.setCommento("richiesto in produzione");
        sequenzaStati.add(stato5);

        StatoUpdate stato6 = new StatoUpdate();
        stato6.setStato("autorizzato_produzione");
        stato6.setCommento("autorizzato in produzione");
        sequenzaStati.add(stato6);

        StatoUpdate stato7 = new StatoUpdate();
        stato7.setStato("in_configurazione_produzione");
        stato7.setCommento("in configurazione in produzione");
        sequenzaStati.add(stato7);

        StatoUpdate stato8 = new StatoUpdate();
        stato8.setStato("pubblicato_produzione");
        stato8.setCommento("pubblicato in produzione");
        sequenzaStati.add(stato8);

        // Itera sulla sequenza degli stati e applica ciascuno finché non raggiungi lo stato finale
        for (StatoUpdate statoUpdate : sequenzaStati) {
        	try {
        		serviziController.updateStatoServizio(idServizio, statoUpdate);
    	    } catch (UpdateEntitaComplessaNonValidaSemanticamenteException e) {
    	        List<EntitaComplessaError> errori = e.getErrori();
    	        for (EntitaComplessaError errore : errori) {
    	            System.out.println("Errore:");
    	            System.out.println("Sottotipo: " + errore.getSottotipo());

    	            // Se 'dato' è un oggetto complesso, puoi accedere ai suoi attributi se disponibili
    	            ConfigurazioneClasseDato dato = errore.getDato();
    	            if (dato != null) {
    	                System.out.println("Dato: " + dato.getValue());
    	            }

    	            // Stampa i parametri se presenti
    	            Map<String, String> params = errore.getParams();
    	            if (params != null && !params.isEmpty()) {
    	                System.out.println("Parametri:");
    	                for (Map.Entry<String, String> entry : params.entrySet()) {
    	                    System.out.println("  " + entry.getKey() + ": " + entry.getValue());
    	                }
    	            }

    	            // Stampa i campi se presenti
    	            List<Campo> campi = errore.getCampi();
    	            if (campi != null && !campi.isEmpty()) {
    	                System.out.println("Campi:");
    	                for (Campo campo : campi) {
    	                    System.out.println("  Nome Campo: " + campo.getNomeCampo());
    	                }
    	            }
    	            System.out.println("-------------");
    	        }
    	        fail("Si è verificata un'eccezione: " + e.getMessage());
    	    } catch (Exception e) {
    	        e.printStackTrace();
    	        fail("Si è verificata un'eccezione inattesa: " + e.getMessage());
    	    }

            // Termina il ciclo quando raggiungi lo stato finale desiderato
            if (statoUpdate.getStato().equals(statoFinale)) {
                break;
            }
        }
    }
}

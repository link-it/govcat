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
package org.govway.catalogo.controllers;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.NotImplementedException;
import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.RequestUtils;
import org.govway.catalogo.assembler.ProfiloAssembler;
import org.govway.catalogo.assembler.UtenteDettaglioAssembler;
import org.govway.catalogo.assembler.UtenteEngineAssembler;
import org.govway.catalogo.assembler.UtenteItemAssembler;
import org.govway.catalogo.authorization.UtenteAuthorization;
import org.govway.catalogo.core.dao.specifications.UtenteSpecification;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Stato;
import org.govway.catalogo.core.services.ClasseUtenteService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.core.services.EmailUpdateVerificationService;
import org.govway.catalogo.core.orm.entity.EmailUpdateVerificationEntity;
import org.govway.catalogo.core.orm.entity.EmailUpdateVerificationEntity.TipoEmail;
import org.govway.catalogo.service.EmailVerificationService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.servlets.api.UtentiApi;
import org.govway.catalogo.servlets.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.IanaLinkRelations;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;

@ApiV1Controller
public class UtentiController implements UtentiApi {

	@Autowired
	private UtenteService service;

	@Autowired
	private ClasseUtenteService classeUtenteService;

	@Autowired
	private PagedResourcesAssembler<UtenteEntity> pagedResourceAssembler;

    @Autowired
    private UtenteDettaglioAssembler dettaglioAssembler;
   
    @Autowired
    private UtenteItemAssembler itemAssembler;   

    @Autowired
    private UtenteEngineAssembler engineAssembler;   

    @Autowired
    private UtenteAuthorization authorization;   

    @Autowired
    private ProfiloAssembler profiloAssembler;   

	@Autowired
	private Configurazione configurazione;

	@Autowired
	private RequestUtils requestUtils;

	@Autowired
	private EmailUpdateVerificationService emailUpdateVerificationService;

	@Autowired
	private EmailVerificationService emailVerificationService;

	@Value("${profilo.email.verification.max.attempts:3}")
	private int maxVerificationAttempts;

	@Value("${profilo.email.verification.max.sends:5}")
	private int maxSendAttempts;

	private Logger logger = LoggerFactory.getLogger(UtentiController.class);

	@Override
	public ResponseEntity<Object> addDominioUtente(UUID idUtente, UUID idDominio, Object body) {
		throw new NotImplementedException();
	}

	@Override
	public ResponseEntity<Utente> createUtente(UtenteCreate utenteCreate) {
		try {
			this.logger.info("Invocazione in corso ...");     
			this.authorization.authorizeCreate(utenteCreate);
			this.logger.debug("Autorizzazione completata con successo");     

			return this.service.runTransaction( () -> {

				if(this.service.existsByPrincipal(utenteCreate.getPrincipal())) {
					throw new ConflictException(ErrorCode.UT_409, Map.of("principal", utenteCreate.getPrincipal()));
				}
				
				UtenteEntity entity = this.dettaglioAssembler.toEntity(utenteCreate);

				this.service.save(entity);
				Utente model = this.dettaglioAssembler.toModel(entity);

				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(model);
			});
     
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500);
		}

		
	}

	@Override
	public ResponseEntity<Void> deleteDominioUtente(UUID idUtente, UUID idDominio) {
		throw new NotImplementedException();
	}

	@Override
	public ResponseEntity<Void> deleteUtente(UUID idUtente) {
		try {
			return this.service.runTransaction( () -> {
				this.logger.info("Invocazione in corso ...");     
				UtenteEntity utente = this.service.find(idUtente)
						.orElseThrow(() -> new NotFoundException(ErrorCode.UT_404, Map.of("idUtente", idUtente.toString())));
	
				this.authorization.authorizeDelete(utente);
				this.logger.debug("Autorizzazione completata con successo");     
	
				String check = this.service.checkReferente(utente);
				
				if(check != null) {
					throw new BadRequestException(ErrorCode.SRV_403_REMOVE_REFERENT);
				}
				this.service.delete(utente);
				this.logger.info("Invocazione completata con successo");
	
				return ResponseEntity.ok().build();
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<Utente> getUtente(UUID idUtente) {
		try {
			
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
				UtenteEntity entity = this.service.find(idUtente)
						.orElseThrow(() -> new NotFoundException(ErrorCode.UT_404, Map.of("idUtente", idUtente.toString())));
	
				this.authorization.authorizeGet(entity);
				
				this.logger.debug("Autorizzazione completata con successo");     
	
				Utente model = this.dettaglioAssembler.toModel(entity);
	
				this.logger.info("Invocazione completata con successo");
	
				return ResponseEntity.ok(model);
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<PagedModelItemDominio> getUtenteDomini(UUID idUtente) {
		throw new NotImplementedException();
	}

	@Override
	public ResponseEntity<PagedModelItemUtente> listUtenti(StatoUtenteEnum stato, UUID idOrganizzazione,
			List<RuoloUtenteEnumSearch> ruolo, Boolean referenteTecnico, List<UUID> classiUtente, String email, String principal, UUID idUtente, String q, Integer page,
			Integer size, List<String> sort) {
		try {
			
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
	
				this.authorization.authorizeList();

				this.logger.debug("Autorizzazione completata con successo");     
	
				UtenteSpecification spec = new UtenteSpecification();
				spec.setQ(Optional.ofNullable(q));
				spec.setEmail(Optional.ofNullable(email));
				spec.setPrincipalLike(Optional.ofNullable(principal));
				spec.setIdUtente(Optional.ofNullable(idUtente).map(u -> u.toString()));
				spec.setIdOrganizzazione(Optional.ofNullable(idOrganizzazione));
				spec.setReferenteTecnico(Optional.ofNullable(referenteTecnico));
				
				if(classiUtente!=null) {
					List<ClasseUtenteEntity> entities = new ArrayList<>();
					
					for(UUID classeUtente: classiUtente) {
						entities.add(this.classeUtenteService.findByIdClasseUtente(classeUtente)
								.orElseThrow(() -> new NotFoundException(ErrorCode.CLS_404)));
					}
					spec.setIdClassiUtente(entities);
				}
				
				if(stato != null) {
					spec.setStato(Optional.of(this.engineAssembler.toEntity(stato)));
				}
				if(ruolo != null && !ruolo.isEmpty()) {
					spec.setRuoli(this.engineAssembler.toEntity(ruolo));
					if(ruolo.contains(RuoloUtenteEnumSearch.NESSUN_RUOLO)) {
						spec.setRuoloNull(Optional.of(true));
					}
				}

				CustomPageRequest pageable = new CustomPageRequest(page, size, sort,Arrays.asList("cognome", "nome"));
	
				Page<UtenteEntity> findAll = this.service.findAll(spec, pageable);
	        
				Link link = Link.of(ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString(), IanaLinkRelations.SELF);

	
				PagedModel<ItemUtente> lst = pagedResourceAssembler.toModel(findAll, this.itemAssembler, link);
	
	
				PagedModelItemUtente list = new PagedModelItemUtente();
				list.setContent(lst.getContent().stream().collect(Collectors.toList()));
				list.add(lst.getLinks());
				list.setPage(new PageMetadata().size((long)findAll.getSize()).number((long)findAll.getNumber()).totalElements(findAll.getTotalElements()).totalPages((long)findAll.getTotalPages()));
				
				this.logger.info("Invocazione completata con successo");
				return ResponseEntity.ok(list);
			});     
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500);
		}

	}

	@Override
	public ResponseEntity<Utente> updateUtente(UUID idUtente, UtenteUpdate utenteUpdate) {
		try {
			return this.service.runTransaction( () -> {
				
				this.logger.info("Invocazione in corso ...");     
				UtenteEntity entity = this.service.find(idUtente)
						.orElseThrow(() -> new NotFoundException(ErrorCode.UT_404, Map.of("idUtente", idUtente.toString())));

				this.authorization.authorizeUpdate(utenteUpdate, entity);
				this.logger.debug("Autorizzazione completata con successo");     

				this.dettaglioAssembler.toEntity(utenteUpdate, entity);
	
				this.service.save(entity);
				Utente model = this.dettaglioAssembler.toModel(entity);

				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(model);
			});

		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<Utente> updateProfilo(ProfiloUpdate profiloUpdate) {
		try {
			return this.service.runTransaction( () -> {

				this.logger.info("Invocazione in corso ...");
				InfoProfilo current = this.requestUtils.getPrincipal(false);

				if(current == null || current.utente == null) {
					throw new NotAuthorizedException(ErrorCode.AUT_403);
				}

				UtenteEntity entity = current.utente;

				// Se la verifica email è abilitata, blocca modifiche dirette a email/email_aziendale
				if (isProfiloEmailVerificaAbilitata()) {
					checkEmailChangeNotAttempted(profiloUpdate, entity);
				}

				this.logger.debug("Autorizzazione completata con successo");

				this.dettaglioAssembler.toEntity(profiloUpdate, entity);

				this.service.save(entity);
				Utente model = this.dettaglioAssembler.toModel(entity);

				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(model);
			});

		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<Profilo> getProfilo() {
		try {
			return this.service.runTransaction(() -> {
				
			logger.info("PRE InfoProfilo");
				
			InfoProfilo current = this.requestUtils.getPrincipal(false);
			
			logger.info("POST InfoProfilo");
			
			if(current != null) {
				if(current.utente==null) {
					if(this.configurazione.getUtente().isAutoregistrazioneAbilitata()) {

						// Verifica se è abilitata la verifica email al primo login
						Boolean verificaEmailAbilitata = this.configurazione.getUtente().isFirstloginVerificaEmailAbilitata();
						if (Boolean.TRUE.equals(verificaEmailAbilitata)) {
							// Nuovo flusso: richiede registrazione con verifica email
							logger.info("Verifica email primo login abilitata - ritorno stato REGISTRAZIONE_RICHIESTA");

							Profilo contact = new Profilo();
							contact.setStato(StatoProfiloEnum.REGISTRAZIONE_RICHIESTA);
							contact.setIdm(this.requestUtils.getIdm());

							return ResponseEntity.ok(contact);
						}

						// Flusso originale: autoregistrazione immediata
						logger.info("PRE getUtente");

						UtenteEntity contact = this.requestUtils.getUtente();

						logger.info("POST getUtente");

						logger.info("PRE getBlankContactFields");

						List<String> fields = this.profiloAssembler.getBlankContactFields(contact);

						logger.info("POST getBlankContactFields");

						logger.info("PRE setStato");

						if(!this.configurazione.getUtente().isAutoabilitazioneAbilitata()) {
							contact.setStato(Stato.NON_CONFIGURATO);
						} else if(!fields.isEmpty()) {
							contact.setStato(Stato.NON_CONFIGURATO);
							this.logger.warn("Utente non configurato per campi nullable: " + fields);
						} else {
							contact.setStato(Stato.ABILITATO);
						}

						this.service.save(contact);
						logger.info("POST setStato");

						return ResponseEntity.ok(this.profiloAssembler.toModel(contact));
					} else {
						
						logger.info("PRE new Profilo");
						
						Profilo contact = new Profilo();
						contact.setStato(StatoProfiloEnum.SCONOSCIUTO);
						contact.setIdm(this.requestUtils.getIdm());
						
						logger.info("POST new Profilo");
						
						return ResponseEntity.ok(contact);
					}
				} else {
					
					logger.info("PRE assembler tomodel");
					
					Profilo convert = this.profiloAssembler.toModel(current.utente);
		
					logger.info("POST assembler tomodel");
					
					if(convert.getStato().equals(StatoProfiloEnum.ABILITATO)) {
						
						return ResponseEntity.ok(convert);
					} else {
						
						return ResponseEntity.badRequest().body(convert);
					}
				}
			} else {
				
				logger.info("PRE new Profilo");
				
				Profilo contact = new Profilo();
				contact.setStato(StatoProfiloEnum.SCONOSCIUTO);
				contact.setIdm(this.requestUtils.getIdm());
				
				logger.info("POST new Profilo");
				
				return ResponseEntity.ok(contact);
			}
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<Object> getUtenteSettings(UUID idUtente) {
		try {
			
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
				UtenteEntity entity = this.service.find(idUtente)
						.orElseThrow(() -> new NotFoundException(ErrorCode.UT_404, Map.of("idUtente", idUtente.toString())));
	
				this.authorization.authorizeGet(entity);
				
				this.logger.debug("Autorizzazione completata con successo");     
	
				JsonNode model = this.dettaglioAssembler.toSettings(entity);
	
				this.logger.info("Invocazione completata con successo");
	
				return ResponseEntity.ok(model);
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<Object> updateUtenteSettings(UUID idUtente, Object body) {
		try {
			return this.service.runTransaction( () -> {
				
				this.logger.info("Invocazione in corso ...");     
				UtenteEntity entity = this.service.find(idUtente)
						.orElseThrow(() -> new NotFoundException(ErrorCode.UT_404, Map.of("idUtente", idUtente.toString())));

				this.authorization.authorizeUpdate(entity);
				this.logger.debug("Autorizzazione completata con successo");     

				this.dettaglioAssembler.toEntitySettings(body, entity);
	
				this.service.save(entity);
				JsonNode model = this.dettaglioAssembler.toSettings(entity);

				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(model);
			});

		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<ConfigurazioneNotifiche> getUtenteSettingsNotifiche(UUID idUtente) {
		try {
			
			return this.service.runTransaction( () -> {
	
				this.logger.info("Invocazione in corso ...");     
				UtenteEntity entity = this.service.find(idUtente)
						.orElseThrow(() -> new NotFoundException(ErrorCode.UT_404, Map.of("idUtente", idUtente.toString())));
	
				this.authorization.authorizeGetNotifiche(entity);
				
				this.logger.debug("Autorizzazione completata con successo");     
	
				ConfigurazioneNotifiche model = this.dettaglioAssembler.toConfigurazioneNotificheModel(entity);
	
				this.logger.info("Invocazione completata con successo");
	
				return ResponseEntity.ok(model);
			});
		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<ConfigurazioneNotifiche> updateUtenteSettingsNotifiche(UUID idUtente, ConfigurazioneNotifiche configurazioneNotifiche) {
		try {
			return this.service.runTransaction( () -> {
				
				this.logger.info("Invocazione in corso ...");     
				UtenteEntity entity = this.service.find(idUtente)
						.orElseThrow(() -> new NotFoundException(ErrorCode.UT_404, Map.of("idUtente", idUtente.toString())));

				this.authorization.authorizeUpdate(configurazioneNotifiche, entity);
				this.logger.debug("Autorizzazione completata con successo");     

				this.dettaglioAssembler.toEntity(configurazioneNotifiche, entity);
	
				this.service.save(entity);
				ConfigurazioneNotifiche model = this.dettaglioAssembler.toConfigurazioneNotificheModel(entity);

				this.logger.info("Invocazione completata con successo");

				return ResponseEntity.ok(model);
			});

		}
		catch(RuntimeException e) {
			this.logger.error("Invocazione terminata con errore '4xx': " +e.getMessage(),e);
			throw e;
		}
		catch(Throwable e) {
			this.logger.error("Invocazione terminata con errore: " +e.getMessage(),e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<CodiceInviato> inviaCodiceCambioEmail(CambioEmailRequest cambioEmailRequest) {
		try {
			this.logger.info("inviaCodiceCambioEmail: Invocazione in corso...");

			// Verifica che la feature sia abilitata
			checkProfiloEmailVerificaAbilitata();

			InfoProfilo current = this.requestUtils.getPrincipal(false);
			if (current == null || current.utente == null) {
				throw new NotAuthorizedException(ErrorCode.AUT_403);
			}

			UtenteEntity utente = current.utente;
			String email = cambioEmailRequest.getEmail();
			String emailAziendale = cambioEmailRequest.getEmailAziendale();

			// Validazione: esattamente una email deve essere specificata
			if ((email == null && emailAziendale == null) || (email != null && emailAziendale != null)) {
				throw new BadRequestException(ErrorCode.GEN_400_REQUEST);
			}

			// Determina quale email verificare e il tipo
			final String nuovaEmail;
			final TipoEmail tipoEmail;
			if (emailAziendale != null) {
				nuovaEmail = emailAziendale;
				tipoEmail = TipoEmail.EMAIL_AZIENDALE;
			} else {
				nuovaEmail = email;
				tipoEmail = TipoEmail.EMAIL;
			}

			return this.service.runTransaction(() -> {
				// Trova o crea una richiesta di verifica
				EmailUpdateVerificationEntity verification =
					this.emailUpdateVerificationService.findOrCreateVerification(utente, nuovaEmail, tipoEmail);

				// Verifica numero massimo invii
				if (verification.getTentativiInvio() >= maxSendAttempts) {
					throw new BadRequestException(ErrorCode.REG_429_MAX_SENDS);
				}

				// Genera e salva il codice
				String codice = this.emailVerificationService.generateVerificationCode();
				java.util.Date scadenza = this.emailVerificationService.calculateExpirationTime();

				this.emailUpdateVerificationService.saveCodiceVerifica(verification, codice, scadenza);

				// Invia email alla nuova email
				this.emailVerificationService.sendEmailChangeVerification(
					nuovaEmail, codice, utente.getNome(), utente.getCognome());

				CodiceInviato response = new CodiceInviato();
				response.setMessaggio("Codice di verifica inviato a " + nuovaEmail);
				response.setScadenzaSecondi(this.emailVerificationService.getCodeDurationMinutes() * 60);

				this.logger.info("inviaCodiceCambioEmail: Codice inviato a {} (tipo: {})", nuovaEmail, tipoEmail);
				return ResponseEntity.ok(response);
			});

		} catch (RuntimeException e) {
			this.logger.error("inviaCodiceCambioEmail terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("inviaCodiceCambioEmail terminata con errore: " + e.getMessage(), e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	@Override
	public ResponseEntity<RisultatoCambioEmail> verificaCodiceCambioEmail(VerificaCodiceRequest verificaCodiceRequest) {
		try {
			this.logger.info("verificaCodiceCambioEmail: Invocazione in corso...");

			// Verifica che la feature sia abilitata
			checkProfiloEmailVerificaAbilitata();

			InfoProfilo current = this.requestUtils.getPrincipal(false);
			if (current == null || current.utente == null) {
				throw new NotAuthorizedException(ErrorCode.AUT_403);
			}

			UtenteEntity utente = current.utente;
			String codiceInserito = verificaCodiceRequest.getCodice();

			return this.service.runTransaction(() -> {
				// Trova la verifica pendente
				EmailUpdateVerificationEntity verification =
					this.emailUpdateVerificationService.findPendingVerification(utente)
						.orElseThrow(() -> new BadRequestException(ErrorCode.REG_400_NO_CODE));

				// Verifica scadenza
				if (this.emailVerificationService.isCodeExpired(verification.getCodiceVerificaScadenza())) {
					this.emailUpdateVerificationService.markAsExpired(verification);
					RisultatoCambioEmail response = new RisultatoCambioEmail();
					response.setEsito(false);
					response.setMessaggio("Codice scaduto. Richiedi un nuovo codice.");
					response.setTentativiRimanenti(0);
					return ResponseEntity.status(410).body(response);
				}

				// Incrementa tentativi
				this.emailUpdateVerificationService.incrementTentativiVerifica(verification);

				int tentativiRimanenti = maxVerificationAttempts - verification.getTentativiVerifica();

				// Verifica codice
				boolean isValid = this.emailVerificationService.isCodeValid(
					codiceInserito, verification.getCodiceVerifica(), verification.getCodiceVerificaScadenza());

				RisultatoCambioEmail response = new RisultatoCambioEmail();
				response.setEsito(isValid);
				response.setTentativiRimanenti(Math.max(0, tentativiRimanenti));

				if (isValid) {
					// Aggiorna l'email dell'utente in base al tipo salvato nella verifica
					String nuovaEmail = verification.getNuovaEmail();
					TipoEmail tipoEmail = verification.getTipoEmail();

					if (tipoEmail == TipoEmail.EMAIL_AZIENDALE) {
						utente.setEmailAziendale(nuovaEmail);
					} else {
						utente.setEmail(nuovaEmail);
					}
					this.service.save(utente);

					// Marca la verifica come completata
					this.emailUpdateVerificationService.markAsVerified(verification);

					String tipoLabel = tipoEmail == TipoEmail.EMAIL_AZIENDALE ? "aziendale" : "personale";
					response.setMessaggio("Email " + tipoLabel + " aggiornata con successo a " + nuovaEmail);
					this.logger.info("verificaCodiceCambioEmail: Email {} aggiornata per utente {}", tipoEmail, utente.getIdUtente());
				} else {
					if (tentativiRimanenti <= 0) {
						response.setMessaggio("Codice errato. Tentativi esauriti, richiedi un nuovo codice.");
					} else {
						response.setMessaggio("Codice errato. Tentativi rimanenti: " + tentativiRimanenti);
					}
					this.logger.warn("verificaCodiceCambioEmail: Codice errato per utente {}", utente.getIdUtente());
				}

				return ResponseEntity.ok(response);
			});

		} catch (RuntimeException e) {
			this.logger.error("verificaCodiceCambioEmail terminata con errore '4xx': " + e.getMessage(), e);
			throw e;
		} catch (Throwable e) {
			this.logger.error("verificaCodiceCambioEmail terminata con errore: " + e.getMessage(), e);
			throw new InternalException(ErrorCode.SYS_500);
		}
	}

	private void checkProfiloEmailVerificaAbilitata() {
		if (!isProfiloEmailVerificaAbilitata()) {
			throw new BadRequestException(ErrorCode.REG_400_NOT_ENABLED);
		}
	}

	private boolean isProfiloEmailVerificaAbilitata() {
		return this.configurazione.getUtente() != null &&
			Boolean.TRUE.equals(this.configurazione.getUtente().isProfiloModificaEmailRichiedeVerifica());
	}

	private void checkEmailChangeNotAttempted(ProfiloUpdate profiloUpdate, UtenteEntity entity) {
		// Verifica che email non sia diversa da quella attuale
		String currentEmail = entity.getEmail();
		String requestEmail = profiloUpdate.getEmail();
		if (requestEmail != null && !requestEmail.equals(currentEmail)) {
			throw new NotAuthorizedException(ErrorCode.UT_403_EMAIL_CHANGE);
		}

		// Verifica che email_aziendale non sia diversa da quella attuale
		String currentEmailAziendale = entity.getEmailAziendale();
		String requestEmailAziendale = profiloUpdate.getEmailAziendale();
		if (requestEmailAziendale != null && !requestEmailAziendale.equals(currentEmailAziendale)) {
			throw new NotAuthorizedException(ErrorCode.UT_403_EMAIL_CHANGE);
		}
	}
}

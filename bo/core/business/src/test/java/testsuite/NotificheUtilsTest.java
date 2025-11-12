package testsuite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.govway.catalogo.core.business.utils.NotificheUtils;
import org.govway.catalogo.core.orm.entity.*;
import org.govway.catalogo.core.services.AdesioneService;
import org.govway.catalogo.core.services.ServizioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class NotificheUtilsTest {

    @Mock
    private ServizioService servizioService;

    @Mock
    private AdesioneService adesioneService;

    @InjectMocks
    private NotificheUtils notificheUtils;

    private UtenteEntity utente;

    @BeforeEach
    void setup() {
        utente = new UtenteEntity();
        utente.setStato(UtenteEntity.Stato.ABILITATO);
		utente.setNome("MrTest");
		utente.setCognome("CognomeTest");
		utente.setEmail("a@a.a");
		utente.setEmailAziendale("b@b.b");
		utente.setTelefonoAziendale("+39000000");
		utente.setPrincipal("sonountest");
    }

    @Test
    void testGetNotificheCreazioneServizio() {
        ServizioEntity servizio = new ServizioEntity();
        servizio.setIdServizio("servizio-id");
        servizio.setRichiedente(utente);
        servizio.setReferenti(Collections.emptySet());
        servizio.setDominio(new DominioEntity());
        servizio.getDominio().setReferenti(Collections.emptySet());

        List<NotificaEntity> notifiche = notificheUtils.getNotificheCreazioneServizio(servizio);

        verify(servizioService).save(any(MessaggioServizioEntity.class));
        assertEquals(0, notifiche.size());
    }

    @Test
    void testGetNotificheCreazioneAdesione() {
        ServizioEntity servizio = new ServizioEntity();
        servizio.setReferenti(Collections.emptySet());
        servizio.setRichiedente(utente);
        servizio.setDominio(new DominioEntity());
        servizio.getDominio().setReferenti(Collections.emptySet());

        AdesioneEntity adesione = new AdesioneEntity();
        adesione.setServizio(servizio);
        adesione.setReferenti(Collections.emptySet());
        adesione.setRichiedente(utente);

        List<NotificaEntity> notifiche = notificheUtils.getNotificheCreazioneAdesione(adesione);

        verify(adesioneService).save(any(MessaggioAdesioneEntity.class));
        assertEquals(0, notifiche.size());
    }

    @Test
    void testGetNotificheCambioStatoServizio() {
        StatoServizioEntity stato = new StatoServizioEntity();
        stato.setUuid(UUID.randomUUID().toString());
        stato.setData(new Date());
        stato.setStato("APPROVATO");

        ServizioEntity servizio = new ServizioEntity();
        servizio.setRichiedente(utente);
        servizio.setUtenteUltimaModifica(utente);
        servizio.setStati(Collections.singleton(stato));
        servizio.setReferenti(Collections.emptySet());
        servizio.setDominio(new DominioEntity());
        servizio.getDominio().setReferenti(Collections.emptySet());

        List<NotificaEntity> notifiche = notificheUtils.getNotificheCambioStatoServizio(servizio);

        assertEquals(0, notifiche.size());
    }

    @Test
    void testGetNotificheCambioStatoAdesione() {
        StatoAdesioneEntity stato = new StatoAdesioneEntity();
        stato.setUuid(UUID.randomUUID().toString());
        stato.setData(new Date());
        stato.setStato("ATTIVA");

        ServizioEntity servizio = new ServizioEntity();
        servizio.setReferenti(Collections.emptySet());
        servizio.setRichiedente(utente);
        servizio.setDominio(new DominioEntity());
        servizio.getDominio().setReferenti(Collections.emptySet());

        AdesioneEntity adesione = new AdesioneEntity();
        adesione.setServizio(servizio);
        adesione.setReferenti(Collections.emptySet());
        adesione.setRichiedente(utente);
        adesione.setUtenteUltimaModifica(utente);
        adesione.setStati(Collections.singleton(stato));

        List<NotificaEntity> notifiche = notificheUtils.getNotificheCambioStatoAdesione(adesione);

        assertEquals(0, notifiche.size());
    }
}


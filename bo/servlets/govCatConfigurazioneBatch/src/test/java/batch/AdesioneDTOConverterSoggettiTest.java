package batch;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;

import org.govway.catalogo.core.dto.DTOAdesione;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;

/**
 * Verifica la mappatura dei soggetti verso GovWay in {@link AdesioneDTOConverter#setSoggetti()}
 * dopo il rework: per le fruizioni l'erogatore è l'ente erogatore indicato sul servizio e il
 * fruitore è il soggetto referente (interno) del dominio; per le erogazioni nulla cambia.
 */
class AdesioneDTOConverterSoggettiTest {

    private AdesioneDTOConverter buildConverter(AdesioneEntity adesione) throws Exception {
        AdesioneDTOConverter converter = new AdesioneDTOConverter(adesione, null);
        converter.setDto(new DTOAdesione(null, null, null, null, null, null, null, null));

        // La factory restituisce come "nomeGateway" il nome del soggetto, così da poter
        // distinguere quale soggetto finisce in ciascuno slot del DTO.
        SoggettoDTOFactory factory = mock(SoggettoDTOFactory.class);
        when(factory.getNomeGateway(ArgumentMatchers.any(SoggettoEntity.class)))
                .thenAnswer(inv -> ((SoggettoEntity) inv.getArgument(0)).getNome());
        when(factory.getTipoGateway(ArgumentMatchers.any(SoggettoEntity.class))).thenReturn("tipo");

        Field f = AdesioneDTOConverter.class.getDeclaredField("soggettoDTOFactory");
        f.setAccessible(true);
        f.set(converter, factory);
        return converter;
    }

    private SoggettoEntity soggetto(String nome) {
        SoggettoEntity s = new SoggettoEntity();
        s.setNome(nome);
        return s;
    }

    @Test
    void fruizione_erogatoreDalServizio_fruitoreDalReferenteDominio() throws Exception {
        AdesioneEntity adesione = new AdesioneEntity();
        ServizioEntity servizio = new ServizioEntity();
        servizio.setFruizione(true);

        DominioEntity dominio = new DominioEntity();
        dominio.setSoggettoReferente(soggetto("REFERENTE_DOMINIO"));
        servizio.setDominio(dominio);
        servizio.setSoggettoErogatore(soggetto("EROGATORE_SERVIZIO"));

        adesione.setServizio(servizio);
        adesione.setSoggetto(soggetto("ADERENTE"));

        AdesioneDTOConverter converter = buildConverter(adesione);
        converter.setSoggetti();
        DTOAdesione dto = converter.getDto();

        // erogatore = ente erogatore (provider) indicato sul servizio
        assertEquals("EROGATORE_SERVIZIO", dto.getSoggettoErogatore().getNomeGateway());
        // fruitore = soggetto interno = referente del dominio
        assertEquals("REFERENTE_DOMINIO", dto.getSoggettoFruitore().getNomeGateway());
        // aderente invariato
        assertEquals("ADERENTE", dto.getSoggettoAderente().getNomeGateway());
    }

    @Test
    void erogazione_erogatoreDalReferenteDominio_nessunFruitore() throws Exception {
        AdesioneEntity adesione = new AdesioneEntity();
        ServizioEntity servizio = new ServizioEntity();
        servizio.setFruizione(false);

        DominioEntity dominio = new DominioEntity();
        dominio.setSoggettoReferente(soggetto("REFERENTE_DOMINIO"));
        servizio.setDominio(dominio);

        adesione.setServizio(servizio);
        adesione.setSoggetto(soggetto("ADERENTE"));

        AdesioneDTOConverter converter = buildConverter(adesione);
        converter.setSoggetti();
        DTOAdesione dto = converter.getDto();

        assertEquals("REFERENTE_DOMINIO", dto.getSoggettoErogatore().getNomeGateway());
        assertNull(dto.getSoggettoFruitore());
        assertEquals("ADERENTE", dto.getSoggettoAderente().getNomeGateway());
    }
}

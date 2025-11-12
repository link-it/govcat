package testsuite;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Join;
import javax.persistence.criteria.Path;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.govway.catalogo.core.dao.specifications.SoggettoSpecification;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity_;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity_;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class SoggettoSpecificationTest {

    private SoggettoSpecification specification;
    private Root<SoggettoEntity> root;
    private CriteriaQuery<?> query;
    private CriteriaBuilder cb;

    @BeforeEach
    void setUp() {
        specification = new SoggettoSpecification();
        root = mock(Root.class);
        query = mock(CriteriaQuery.class);
        cb = mock(CriteriaBuilder.class);
    }

    @Test
    void testIdSoggettoFilter() {
        UUID id = UUID.randomUUID();
        Path<String> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        when(root.get(SoggettoEntity_.idSoggetto)).thenReturn(path);
        when(cb.equal(path, id.toString())).thenReturn(predicate);
        when(cb.and(predicate)).thenReturn(predicate);

        specification.setIdSoggetto(Optional.of(id));
        Predicate result = specification.toPredicate(root, query, cb);

        assertNotNull(result);
        assertEquals(predicate, result);
    }

    @Test
    void testNomeFilter() {
        String nome = "test";
        Path<String> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        when(root.get(SoggettoEntity_.nome)).thenReturn(path);
        when(cb.equal(path, nome)).thenReturn(predicate);
        when(cb.and(predicate)).thenReturn(predicate);

        specification.setNome(Optional.of(nome));
        Predicate result = specification.toPredicate(root, query, cb);

        assertNotNull(result);
        assertEquals(predicate, result);
    }
    
    /*
    @Test
    void testIdOrganizzazioneFilter() {
        UUID idOrg = UUID.randomUUID();

        Path<OrganizzazioneEntity> orgPath = mock(Path.class);
        Path<String> idOrgPath = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        // quando root.get(SoggettoEntity_.organizzazione) ritorna orgPath
        when(root.get(SoggettoEntity_.organizzazione)).thenReturn(orgPath);

        // quando orgPath.get(OrganizzazioneEntity_.idOrganizzazione) ritorna idOrgPath
        when(orgPath.get(OrganizzazioneEntity_.idOrganizzazione)).thenReturn(idOrgPath);

        // quando cb.equal con idOrgPath e idOrg.toString() ritorna predicate
        when(cb.equal(idOrgPath, idOrg.toString())).thenReturn(predicate);

        specification.setIdOrganizzazione(Optional.of(idOrg));
        Predicate result = specification.toPredicate(root, query, cb);

        assertNotNull(result);
        assertEquals(predicate, result);
    }
     */

    @Test
    void testReferenteFilter() {
        Path<Boolean> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        when(root.get(SoggettoEntity_.referente)).thenReturn(path);
        when(cb.equal(path, true)).thenReturn(predicate);
        when(cb.and(predicate)).thenReturn(predicate);

        specification.setReferente(Optional.of(true));
        Predicate result = specification.toPredicate(root, query, cb);

        assertNotNull(result);
        assertEquals(predicate, result);
    }

    @Test
    void testAderenteFilter() {
        Path<Boolean> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        when(root.get(SoggettoEntity_.aderente)).thenReturn(path);
        when(cb.equal(path, false)).thenReturn(predicate);
        when(cb.and(predicate)).thenReturn(predicate);

        specification.setAderente(Optional.of(false));
        Predicate result = specification.toPredicate(root, query, cb);

        assertNotNull(result);
        assertEquals(predicate, result);
    }
/*
    @Test
    void testQFilter() {
        String q = "foo";

        Path<String> nomePath = mock(Path.class);
        Path<String> descrizionePath = mock(Path.class);
        Predicate predNome = mock(Predicate.class);
        Predicate predDescrizione = mock(Predicate.class);
        Predicate predOr = mock(Predicate.class);
        Predicate predAnd = mock(Predicate.class);

        when(root.get(SoggettoEntity_.nome)).thenReturn(nomePath);
        when(root.get(SoggettoEntity_.descrizione)).thenReturn(descrizionePath);

        when(cb.upper(nomePath)).thenReturn(nomePath);
        when(cb.upper(descrizionePath)).thenReturn(descrizionePath);

        when(cb.like(nomePath, "%FOO%")).thenReturn(predNome);
        when(cb.like(descrizionePath, "%FOO%")).thenReturn(predDescrizione);

        when(cb.or(predNome, predDescrizione)).thenReturn(predOr);
        when(cb.and(any(Predicate[].class))).thenReturn(predAnd);

        specification.setQ(Optional.of(q));

        Predicate result = specification.toPredicate(root, query, cb);

        assertNotNull(result);
        assertEquals(predAnd, result);
    }
*/
}

package testsuite;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Path;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.TassonomiaEntity;
import org.govway.catalogo.core.orm.entity.TassonomiaEntity_;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

public class TassonomiaSpecificationTest {
	
	@InjectMocks
    private TassonomiaSpecificationTestable specification;

    @Mock
    private Root<TassonomiaEntity> root;

    @Mock
    private CriteriaQuery<?> query;

    @Mock
    private CriteriaBuilder cb;

    @Mock
    private Predicate predicate1;

    @Mock
    private Predicate predicate2;

    @Mock
    private Predicate combinedPredicate;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        specification = new TassonomiaSpecificationTestable();
    }
/*
    @Test
    public void testToPredicateWithQ() {
        String q = "prova";
        String pattern = "%" + q.toUpperCase() + "%";

        Path<String> descrizionePath = mock(Path.class);
        Path<String> nomePath = mock(Path.class);
        Predicate likeDescrizione = mock(Predicate.class);
        Predicate likeNome = mock(Predicate.class);
        Predicate orPredicate = mock(Predicate.class);
        Predicate combinedPredicate = mock(Predicate.class);

        when(root.<String>get("descrizione")).thenReturn(descrizionePath);
        when(root.<String>get("nome")).thenReturn(nomePath);

        when(cb.upper(descrizionePath)).thenReturn(descrizionePath);
        when(cb.upper(nomePath)).thenReturn(nomePath);

        when(cb.like(descrizionePath, pattern)).thenReturn(likeDescrizione);
        when(cb.like(nomePath, pattern)).thenReturn(likeNome);

        when(cb.or(likeDescrizione, likeNome)).thenReturn(orPredicate);
        when(cb.and(orPredicate)).thenReturn(combinedPredicate);

        TassonomiaSpecificationTestable specification = new TassonomiaSpecificationTestable();
        specification.setQ(Optional.of(q));

        Predicate result = specification.toPredicate(root, query, cb);

        assertNotNull(result);
        assertEquals(combinedPredicate, result);
    }
*/

    @Test
    void testToPredicateWithNome() {
        Path<String> nomePath = mock(Path.class);
        Predicate equalPredicate = mock(Predicate.class);

        when(root.<String>get("nome")).thenReturn(nomePath);
        when(cb.equal(nomePath, "nomeValido")).thenReturn(equalPredicate);
        when(cb.and(equalPredicate)).thenReturn(combinedPredicate);

        specification.setNome(Optional.of("nomeValido"));
        Predicate result = specification.toPredicate(root, query, cb);
        assertNotNull(result); // deve passare
    }
    
    /*
    @Test
    void testToPredicateWithVisibile() {
        Path<Boolean> visibilePath = mock(Path.class);

        when(root.<Boolean>get(TassonomiaEntity_.visibile)).thenReturn(visibilePath);
        when(cb.equal(visibilePath, true)).thenReturn(predicate1);
        when(cb.and(predicate1)).thenReturn(combinedPredicate);

        specification.setVisibile(Optional.of(true));

        Predicate result = specification.toPredicate(root, query, cb);
        assertNotNull(result);
    }
	
    @Test
    void testToPredicateWithObbligatorio() {
        Path<Boolean> obbligatorioPath = mock(Path.class);

        when(root.<Boolean>get(TassonomiaEntity_.obbligatorio)).thenReturn(obbligatorioPath);
        when(cb.equal(obbligatorioPath, false)).thenReturn(predicate1);
        when(cb.and(predicate1)).thenReturn(combinedPredicate);

        specification.setObbligatorio(Optional.of(false));

        Predicate result = specification.toPredicate(root, query, cb);
        assertNotNull(result);
    }
     
    @Test
    public void testToPredicateWithIdTassonomia() {
        UUID id = UUID.randomUUID();

        @SuppressWarnings("unchecked")
        Path<String> idPath = (Path<String>) mock(Path.class);

        when(root.get(TassonomiaEntity_.idTassonomia)).thenReturn(idPath);
        when(cb.equal(idPath, id.toString())).thenReturn(predicate1);
        when(cb.and(predicate1)).thenReturn(combinedPredicate);

        specification.setIdTassonomia(Optional.of(id));
        Predicate result = specification.toPredicate(root, query, cb);
        assertNotNull(result);
    }
     */
    
    @Test
    public void testToPredicateWithEmptyFilters() {
        Predicate result = specification.toPredicate(root, query, cb);
        assertNull(result);
    }

    @Test
    public void testToPredicateListCombination() {
        // Test combinato con più filtri
        String q = "search";
        String pattern = "%" + q.toUpperCase() + "%";
        UUID id = UUID.randomUUID();

        Path<String> descrizionePath = mock(Path.class);
        Path<String> nomePath = mock(Path.class);
        Path<String> idPath = mock(Path.class);
        Path<Boolean> visibilePath = mock(Path.class);

        Predicate likeDescrizione = mock(Predicate.class);
        Predicate likeNome = mock(Predicate.class);
        Predicate orPredicate = mock(Predicate.class);
        Predicate equalId = mock(Predicate.class);
        Predicate equalVisibile = mock(Predicate.class);

        when(root.get(TassonomiaEntity_.descrizione)).thenReturn(descrizionePath);
        when(root.get(TassonomiaEntity_.nome)).thenReturn(nomePath);
        when(root.get(TassonomiaEntity_.idTassonomia)).thenReturn(idPath);
        when(root.get(TassonomiaEntity_.visibile)).thenReturn(visibilePath);

        when(cb.upper(descrizionePath)).thenReturn(descrizionePath);
        when(cb.upper(nomePath)).thenReturn(nomePath);

        when(cb.like(descrizionePath, pattern)).thenReturn(likeDescrizione);
        when(cb.like(nomePath, pattern)).thenReturn(likeNome);

        when(cb.or(likeDescrizione, likeNome)).thenReturn(orPredicate);
        when(cb.equal(idPath, id.toString())).thenReturn(equalId);
        when(cb.equal(visibilePath, true)).thenReturn(equalVisibile);

        specification.setQ(Optional.of(q));
        specification.setIdTassonomia(Optional.of(id));
        specification.setVisibile(Optional.of(true));

        List<Predicate> list = specification._toPredicateList(root, query, cb);
        assertEquals(3, list.size());
    }
}

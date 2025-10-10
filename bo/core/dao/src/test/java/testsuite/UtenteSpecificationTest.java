package testsuite;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.metamodel.SingularAttribute;

import org.govway.catalogo.core.dao.specifications.UtenteSpecification;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity_;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UtenteSpecificationTest {

    private UtenteSpecification specification;

    @Mock
    private Root<UtenteEntity> root;

    @Mock
    private CriteriaQuery<?> query;

    @Mock
    private CriteriaBuilder cb;

    @Mock
    private Path<Object> idUtentePath;
    
    @Mock
    private Path<Object> qPath;

    @Mock
    private Predicate equalPredicate;

    @Mock
    private Predicate andPredicate;

    @BeforeEach
    void setUp() {
        specification = new UtenteSpecificationTestable();
    }

    @Test
    void testToPredicateWithIdUtente() {
    	when(root.get("idUtente")).thenReturn(idUtentePath);
        when(cb.equal(idUtentePath, "user123")).thenReturn(equalPredicate);
        when(cb.and(equalPredicate)).thenReturn(andPredicate);
        
        specification.setIdUtente(Optional.of("user123"));

        Predicate result = specification.toPredicate(root, query, cb);

        assertNotNull(result);
        assertEquals(andPredicate, result);

        verify(root).get("idUtente");
        verify(cb).equal(idUtentePath, "user123");
        verify(cb).and(equalPredicate);
    }

    
    @Test
    public void testToPredicateWithNome() {
    	when(root.get("nome")).thenReturn(qPath);
        when(cb.equal(qPath, "Mario")).thenReturn(equalPredicate);
        when(cb.and(equalPredicate)).thenReturn(andPredicate);
    	
        specification.setNome(Optional.of("Mario"));
        Predicate predicate = specification.toPredicate(root, query, cb);
        assertNotNull(predicate);
    }
    
    @Test
    public void testToPredicateWithStato() {
    	when(root.get("stato")).thenReturn(qPath);
        when(cb.equal(qPath, UtenteEntity.Stato.ABILITATO)).thenReturn(equalPredicate);
        when(cb.and(equalPredicate)).thenReturn(andPredicate);
    	
        specification.setStato(Optional.of(UtenteEntity.Stato.ABILITATO));
        Predicate predicate = specification.toPredicate(root, query, cb);
        assertNotNull(predicate);
    }
    /*
    @Test
    public void testToPredicateWithEmail() {
        String email = "email@test.com";
        String pattern = "%" + email.toUpperCase() + "%";

        Path<String> emailPath = mock(Path.class);
        Path<String> emailAziendalePath = mock(Path.class);
        Path<String> upperEmailPath = mock(Path.class);
        Path<String> upperEmailAziendalePath = mock(Path.class);

        Predicate likeEmailPredicate = mock(Predicate.class);
        Predicate likeEmailAziendalePredicate = mock(Predicate.class);
        Predicate orPredicate = mock(Predicate.class);
        Predicate andPredicate = mock(Predicate.class);

        when(root.get("email")).thenReturn((Path) emailPath);
        when(root.get("emailAziendale")).thenReturn((Path) emailAziendalePath);

        when(cb.upper(emailPath)).thenReturn(upperEmailPath);
        when(cb.upper(emailAziendalePath)).thenReturn(upperEmailAziendalePath);

        when(cb.like(upperEmailPath, pattern)).thenReturn(likeEmailPredicate);
        when(cb.like(upperEmailAziendalePath, pattern)).thenReturn(likeEmailAziendalePredicate);

        when(cb.or(argThat(arr -> arr != null && arr.length == 2))).thenReturn(orPredicate);
        when(cb.and(argThat(arr -> arr != null && arr.length >= 1))).thenReturn(andPredicate);

        specification.setEmail(Optional.of(email));
        Predicate predicate = specification.toPredicate(root, query, cb);

        assertNotNull(predicate);
        assertEquals(andPredicate, predicate);
    }
	*/

    @Test
    public void testToPredicateWithPrincipalLike() {
        String principalLike = "principal";
        String pattern = "%" + principalLike.toUpperCase() + "%";

        Path<String> principalPath = mock(Path.class);
        Path<String> upperPrincipalPath = mock(Path.class);

        Predicate likePredicate = mock(Predicate.class);
        Predicate andPredicate = mock(Predicate.class);

        when(root.get("principal")).thenReturn((Path) principalPath);

        when(cb.upper(principalPath)).thenReturn(upperPrincipalPath);
        when(cb.like(upperPrincipalPath, pattern)).thenReturn(likePredicate);

        when(cb.and(likePredicate)).thenReturn(andPredicate);

        specification.setPrincipalLike(Optional.of(principalLike));
        Predicate predicate = specification.toPredicate(root, query, cb);

        assertNotNull(predicate);
        assertEquals(andPredicate, predicate);
    }


    @Test
    public void testToPredicateWithPrincipal() {
    	when(root.get("principal")).thenReturn(qPath);
        when(cb.equal(qPath, "utente")).thenReturn(equalPredicate);
        when(cb.and(equalPredicate)).thenReturn(andPredicate);
    	
        specification.setPrincipal(Optional.of("utente"));
        Predicate predicate = specification.toPredicate(root, query, cb);
        assertNotNull(predicate);
    }

    @Test
    public void testToPredicateWithReferenteTecnico() {
    	when(root.get("referenteTecnico")).thenReturn(qPath);
        when(cb.equal(qPath, true)).thenReturn(equalPredicate);
        when(cb.and(equalPredicate)).thenReturn(andPredicate);
    	
        specification.setReferenteTecnico(Optional.of(true));
        Predicate predicate = specification.toPredicate(root, query, cb);
        assertNotNull(predicate);
    }

    @SuppressWarnings("unchecked")
    @Test
    public void testToPredicateWithIdOrganizzazione() {
        UUID idValue = UUID.randomUUID();

        Path<Object> organizzazionePath = mock(Path.class);
        Path<Object> idOrganizzazionePath = mock(Path.class);

        when(root.get("organizzazione")).thenReturn((Path) organizzazionePath);
        when(organizzazionePath.get("idOrganizzazione")).thenReturn((Path) idOrganizzazionePath);

        when(cb.equal(idOrganizzazionePath, idValue.toString())).thenReturn(equalPredicate);
        when(cb.and(equalPredicate)).thenReturn(andPredicate);

        specification.setIdOrganizzazione(Optional.of(idValue));
        Predicate predicate = specification.toPredicate(root, query, cb);

        assertNotNull(predicate);
    }
    /*
    @Test
    public void testToPredicateWithRuoliAndRuoloNullTrue() {
    	when(root.get("ruoli")).thenReturn(qPath);
        when(cb.equal(qPath, true)).thenReturn(equalPredicate);
        when(cb.and(equalPredicate)).thenReturn(andPredicate);
    	
        specification.setRuoli(Arrays.asList(UtenteEntity.Ruolo.AMMINISTRATORE));
        specification.setRuoloNull(Optional.of(true));
        Predicate predicate = specification.toPredicate(root, query, cb);
        assertNotNull(predicate);
    }

    @Test
    public void testToPredicateWithRuoliEmptyAndRuoloNullFalse() {
        specification.setRuoli(Collections.emptyList());
        specification.setRuoloNull(Optional.of(false));
        Predicate predicate = specification.toPredicate(root, query, cb);
        assertNotNull(predicate);
    }

    @Test
    public void testToPredicateWithRuoloNullOnly() {
    	when(root.get("ruoloNull")).thenReturn(qPath);
        when(cb.equal(qPath, true)).thenReturn(equalPredicate);
        when(cb.and(equalPredicate)).thenReturn(andPredicate);
    	
        specification.setRuoloNull(Optional.of(true));
        Predicate predicate = specification.toPredicate(root, query, cb);
        assertNotNull(predicate);
    }
 	*/
    @SuppressWarnings("unchecked")
    @Test
    public void testToPredicateWithIdClassiUtente() {
        ClasseUtenteEntity classe = new ClasseUtenteEntity();
        
        // Mock del join
        Join classiJoin = mock(Join.class); // raw type per evitare errori di tipo

        // Cast esplicito nel when
        when(root.join(eq("classi"), eq(JoinType.LEFT))).thenReturn(classiJoin);

        // Mock del predicato per in(...)
        Predicate inPredicate = mock(Predicate.class);
        when(classiJoin.in(Collections.singletonList(classe))).thenReturn(inPredicate);

        when(cb.and(inPredicate)).thenReturn(andPredicate);

        specification.setIdClassiUtente(Collections.singletonList(classe));

        Predicate predicate = specification.toPredicate(root, query, cb);

        assertNotNull(predicate);
    }
    
    /*
    @SuppressWarnings("unchecked")
    @Test
    public void testToPredicateWithEmptyClassiUtente() {
        // Mock del join (anche se in questo caso non dovrebbe essere chiamato)
        Join<Object, Object> classiJoin = mock(Join.class);

        // root.join dovrebbe non essere chiamato se la lista è vuota,
        // ma se chiamato, lo mockiamo comunque
        when(root.join(eq("classi"), eq(JoinType.LEFT))).thenReturn(classiJoin);

        // Mock del disjunction()
        Predicate disjunctionPredicate = mock(Predicate.class);
        when(cb.disjunction()).thenReturn(disjunctionPredicate);

        // Mock di cb.and per restituire un predicato non nullo
        Predicate andPredicate = mock(Predicate.class);
        when(cb.and(any(Predicate[].class))).thenReturn(andPredicate);

        // Imposta lista vuota non null
        specification.setIdClassiUtente(Collections.emptyList());

        // Invoca il metodo da testare
        Predicate predicate = specification.toPredicate(root, query, cb);

        // Verifica che il predicato restituito non sia null e sia l'andPredicate
        assertNotNull(predicate);
        assertEquals(andPredicate, predicate);
    }
	*/

    @Test
    public void testToPredicateWithNoFilter() {
        Predicate predicate = specification.toPredicate(root, query, cb);
        assertNull(predicate); // nessun filtro: deve tornare null
    }
    
}

package testsuite;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.SetJoin;
import jakarta.persistence.metamodel.SetAttribute;
import jakarta.persistence.metamodel.SingularAttribute;

import org.govway.catalogo.core.dao.specifications.ApiSpecification;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

@SuppressWarnings({"unchecked", "rawtypes"})
public class ApiSpecificationTest {

    private ApiSpecification specification;
    private Root<ApiEntity> root;
    private CriteriaQuery<?> query;
    private CriteriaBuilder cb;
    private SetJoin<ApiEntity, ServizioEntity> servizioJoin;
    private Path path;
    private Predicate predicate;

    @BeforeEach
    void setUp() {
        specification = new ApiSpecification();
        root = mock(Root.class);
        query = mock(CriteriaQuery.class);
        cb = mock(CriteriaBuilder.class);
        servizioJoin = mock(SetJoin.class);
        path = mock(Path.class);
        predicate = mock(Predicate.class);

        // Fuori da un EntityManagerFactory gli attributi del metamodel (ApiEntity_.nome, ...) sono
        // null: i matcher devono quindi essere nullable(), altrimenti gli stub non agganciano.
        doReturn(path).when(root).get(nullable(SingularAttribute.class));
        doReturn(path).when(path).get(nullable(SingularAttribute.class));
        doReturn(path).when(servizioJoin).get(nullable(SingularAttribute.class));
        doReturn(servizioJoin).when(root).join(nullable(SetAttribute.class));
        doReturn(predicate).when(cb).equal(any(Expression.class), any(Object.class));
        doReturn(predicate).when(cb).isNull(any(Expression.class));
        doReturn(predicate).when(cb).not(any(Expression.class));
        doReturn(predicate).when(path).in(any(List.class));
        doReturn(predicate).when(cb).and(any(Predicate[].class));
    }

    /**
     * I filtri su soggetto referente, intermediazione ed ente erogatore devono valere sullo STESSO
     * servizio: se ognuno creasse il proprio join, per una api associata a piu` servizi la
     * condizione diventerebbe "esiste un servizio con quel referente E (un altro) servizio
     * intermediato".
     */
    @Test
    void testFiltriServizioCondividonoUnSoloJoin() {
        specification.setNome(Optional.of("API_X"));
        specification.setVersione(Optional.of(1));
        specification.setIdSoggetto(Optional.of(UUID.randomUUID()));
        specification.setServizioIntermediato(Optional.of(true));
        specification.setIdSoggettoErogatore(Optional.of(UUID.randomUUID()));

        assertNotNull(specification.toPredicate(root, query, cb));

        verify(root, times(1)).join(nullable(SetAttribute.class));
    }

    /**
     * Ente erogatore vuoto significa "non valorizzato" (IS NULL), non "nessun filtro": i servizi
     * intermediati privi di ente erogatore formano un namespace a se`.
     */
    @Test
    void testErogatoreVuotoFiltraSuIsNull() {
        specification.setServizioIntermediato(Optional.of(true));
        specification.setIdSoggettoErogatore(Optional.empty());

        assertNotNull(specification.toPredicate(root, query, cb));

        verify(cb, times(1)).isNull(any(Expression.class));
    }

    @Test
    void testIdApiEscluse() {
        specification.setIdApiEscluse(List.of(UUID.randomUUID()));

        assertNotNull(specification.toPredicate(root, query, cb));

        verify(cb, times(1)).not(any(Expression.class));
    }

}

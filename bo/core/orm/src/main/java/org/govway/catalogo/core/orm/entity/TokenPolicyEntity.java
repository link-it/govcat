package org.govway.catalogo.core.orm.entity;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
@Entity
@Table(name = "token_policies")
public class TokenPolicyEntity {

    public enum TipoPolicy {CODE_GRANT, CLIENT_CREDENTIALS, PDND, PDND_AUDIT, PDND_INTEGRITY, PDND_AUDIT_INTEGRITY}

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_token_policies", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_token_policies", sequenceName = "seq_token_policies", allocationSize = 1)
    private Long id;

    @Column(name = "tipo_policy", nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoPolicy tipoPolicy;

    @Column(name = "token_url", nullable = false)
    private String tokenUrl;

    @Column(name = "codice_policy", nullable = false)
    private String codicePolicy;

    @ElementCollection
    @CollectionTable(name = "token_policies_properties", joinColumns = @JoinColumn(name = "token_policy_id"))
    @MapKeyColumn(name = "property_key")
    @Column(name = "property_value")
    private Map<String, String> properties = new HashMap<>();

}

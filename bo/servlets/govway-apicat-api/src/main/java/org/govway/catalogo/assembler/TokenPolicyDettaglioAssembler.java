package org.govway.catalogo.assembler;

import org.govway.catalogo.controllers.TokenPoliciesController;
import org.govway.catalogo.core.orm.entity.TokenPolicyEntity;
import org.govway.catalogo.servlets.model.TokenPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class TokenPolicyDettaglioAssembler extends RepresentationModelAssemblerSupport<TokenPolicyEntity, TokenPolicy> {

    private final TokenPolicyEngineAssembler tokenPolicyEngineAssembler;

    @Autowired
    public TokenPolicyDettaglioAssembler(TokenPolicyEngineAssembler tokenPolicyEngineAssembler) {
        super(TokenPoliciesController.class, TokenPolicy.class);
        this.tokenPolicyEngineAssembler = tokenPolicyEngineAssembler;
    }

    @Override
    public TokenPolicy toModel(TokenPolicyEntity entity) {
        return null;
    }
}

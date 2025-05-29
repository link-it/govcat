package org.govway.catalogo.assembler;

import org.govway.catalogo.controllers.TokenPoliciesController;
import org.govway.catalogo.core.orm.entity.TokenPolicyEntity;
import org.govway.catalogo.servlets.model.ItemTokenPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;

public class TokenPolicyItemAssembler extends RepresentationModelAssemblerSupport<TokenPolicyEntity, ItemTokenPolicy> {

    private final TokenPolicyEngineAssembler tokenPolicyEngineAssembler;

    @Autowired
    public TokenPolicyItemAssembler(TokenPolicyEngineAssembler tokenPolicyEngineAssembler) {
        super(TokenPoliciesController.class, ItemTokenPolicy.class);
        this.tokenPolicyEngineAssembler = tokenPolicyEngineAssembler;
    }

    @Override
    public ItemTokenPolicy toModel(TokenPolicyEntity entity) {
        return null;
    }
}

package org.govway.catalogo.authorization;

import org.govway.catalogo.core.orm.entity.TokenPolicyEntity;
import org.govway.catalogo.servlets.model.TokenPolicyCreate;
import org.govway.catalogo.servlets.model.TokenPolicyUpdate;

public class TokenPolicyAuthorization extends DefaultAuthorization<TokenPolicyCreate, TokenPolicyUpdate, TokenPolicyEntity>{
}

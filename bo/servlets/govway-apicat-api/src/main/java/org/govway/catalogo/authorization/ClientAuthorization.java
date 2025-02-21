package org.govway.catalogo.authorization;

import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.servlets.model.ClientCreate;
import org.govway.catalogo.servlets.model.ClientUpdate;

public class ClientAuthorization extends DefaultAuthorization<ClientCreate,ClientUpdate,ClientEntity> {

}
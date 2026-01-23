import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthenticationService } from '../services/authentication.service';

/**
 * Guard per intercettare utenti che necessitano di completare la registrazione.
 * Controlla se lo stato del profilo indica "registrazione_richiesta" e
 * reindirizza alla pagina di registrazione.
 */
@Injectable()
export class RegistrazioneGuard implements CanActivate {

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const session = this.authenticationService.getCurrentSession();

    // Se la sessione contiene stato = "registrazione_richiesta",
    // reindirizza al flusso di registrazione
    if (session && session.stato === 'registrazione_richiesta') {
      // Evita loop se siamo gia sulla pagina di registrazione
      if (!state.url.startsWith('/auth/registrazione')) {
        this.router.navigate(['/auth/registrazione']);
        return false;
      }
    }

    return true;
  }
}

/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
package org.govway.catalogo.reverse_proxy.security;

import org.govway.catalogo.reverse_proxy.config.WebConsoleConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandlerImpl;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationProvider;

import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration
@EnableWebSecurity
@ComponentScan
public class SecurityConfig {

	
	@Value("org.govway.catalogo.servlet.api.path")
	private String baseurlCatalogoApi;
	
	@Value("org.govway.catalogo.servlet.pdnd.path")
	private String baseurlCatalogoPdnd;
	
	@Value("org.govway.catalogo.servlet.monitor.path")
	private String baseurlCatalogoMonitor;
	
    @Bean
   	public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
   			throws Exception {
   		return authenticationConfiguration.getAuthenticationManager();
   	}
	
   	@Bean
   	public AccessDeniedHandlerImpl accessDeniedHandler() {
   		return new AccessDeniedHandlerImpl();
   	}
	
	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http, ObjectMapper jsonMapper, PreAuthenticatedExceptionHandler preAuthenticatedExceptionHandler, WebConsoleConfig webConsoleConfig) throws Exception {
		
   		AuthenticationManager manager = this.authenticationManager(http.getSharedObject(AuthenticationConfiguration.class));
   		
   		AuthorizationFilter filter = new AuthorizationFilter();
   		filter.setConfig(webConsoleConfig);
   		filter.setExceptionIfHeaderMissing(false);
   		filter.setAuthenticationManager(manager);
   		filter.setAuthenticationDetailsSource(new ReverseProxyAuthenticationDetailsSource(webConsoleConfig));
   		
   		// Disabilita csrf perchè abbiamo solo richieste pre-autenticate con header
   		applyAuthRules(http).csrf().disable()		
   		// Autenticazione per header
   		.addFilterBefore(filter, filter.getClass())																											
   		.addFilterBefore(preAuthenticatedExceptionHandler, LogoutFilter.class)
   		.exceptionHandling()
   				// Gestisci accessDenied in modo da restituire un problem ben formato
   				.accessDeniedHandler(accessDeniedHandler())																	
   				// Gestisci la mancata autenticazione con un problem ben formato
   				.authenticationEntryPoint(new UnauthorizedAuthenticationEntryPoint(jsonMapper))	
   				;
   		
   		http
   				// Arrivano solo richieste autenticate.
   			.sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
   		.and()
   			.headers()
   			.xssProtection()
               ;
   		
   		return http.build();
   		
	}
	
   	/**
   	 * Impstiamo il servizio per caricare l'utente a partire dallo header.
   	 */
   	@Bean
   	public PreAuthenticatedAuthenticationProvider preAuthenticatedAuthenticationProvider(UserDetailService userDetailService) {
   		PreAuthenticatedAuthenticationProvider ret = new PreAuthenticatedAuthenticationProvider();
   		ret.setPreAuthenticatedUserDetailsService(userDetailService);
   		return ret;
   	}
   	
   	
   	/**
   	 * Registriamo lo UserDetailService per essere chiamato in caso di autenticazione basic
   	 */
   	
   	private HttpSecurity applyAuthRules(HttpSecurity http) throws Exception {
   		http
   		.authorizeHttpRequests(authorize -> authorize
   				.requestMatchers("/index").authenticated()
   				.requestMatchers("/index.jsp").authenticated()
   				.requestMatchers("/error").permitAll()
   				// 	proxy catalogo
   				.requestMatchers(baseurlCatalogoApi + "/**").authenticated()
   				.requestMatchers(baseurlCatalogoPdnd + "/**").authenticated()
   				.requestMatchers(baseurlCatalogoMonitor + "/**").authenticated()
   				.anyRequest().authenticated()
   		);
   		return http;
   		
   	}
	
	
}

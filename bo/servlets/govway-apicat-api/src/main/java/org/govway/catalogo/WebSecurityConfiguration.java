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
package org.govway.catalogo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsByNameServiceWrapper;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.security.web.authentication.preauth.RequestHeaderAuthenticationFilter;
import org.springframework.security.core.context.SecurityContextHolder;
import javax.annotation.PostConstruct;

@Configuration
@EnableWebSecurity
public class WebSecurityConfiguration extends WebSecurityConfigurerAdapter {

    @Value("${headerAuthentication}")
    String headerAuthentication;

    @Value("${spring.mvc.servlet.path}")
    String path;

@PostConstruct
public void setup() {
    // Use thread-local storage for the security context, avoiding the session
    SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_THREADLOCAL);
}


	@Override
	protected void configure(HttpSecurity http) throws Exception {

		
		RequestHeaderAuthenticationFilter filter = new RequestHeaderAuthenticationFilter();
		filter.setPrincipalRequestHeader(this.headerAuthentication);
		filter.setExceptionIfHeaderMissing(false);
		filter.setAuthenticationManager(this.authenticationManager());

		http
		.sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS).and()
        .addFilterBefore(filter, filter.getClass())
		.headers()
		.contentTypeOptions().disable()
		.xssProtection().disable()
		.frameOptions().disable()
		.and()
//		.sessionManagement()
//		.
        .csrf()
        .disable()
		.exceptionHandling()
		.authenticationEntryPoint(restAuthenticationEntryPoint)
        .and()
        .authorizeRequests()
        .antMatchers(this.path+"/api/v1/profilo").permitAll()
        .antMatchers(this.path+"/**").fullyAuthenticated()
//        .antMatchers("/*").denyAll();
                ;
                
	}

	@Autowired
	@Lazy
	private UserDetailsByNameServiceWrapper<PreAuthenticatedAuthenticationToken> userDetailsByNameServiceWrapper;
	
	@Bean
	public UserDetailsByNameServiceWrapper<?> getUserDetailsByNameServiceWrapper(AutenticazioneUtenzeRegistrateService customUserDetailsService) {
		return new UserDetailsByNameServiceWrapper<>(customUserDetailsService);
	}

	@Autowired
	public RestAuthenticationEntryPoint restAuthenticationEntryPoint;

	@Autowired
	public AutenticazioneUtenzeRegistrateService customUserDetailsService;
	
	@Override
	protected void configure(AuthenticationManagerBuilder auth) throws Exception {
		org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationProvider p = new org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationProvider();
		p.setPreAuthenticatedUserDetailsService(userDetailsByNameServiceWrapper);
		auth
		.authenticationProvider(p);
	}

}

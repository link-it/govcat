package org.govway.catalogo;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsByNameServiceWrapper;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.preauth.AbstractPreAuthenticatedProcessingFilter;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationProvider;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.security.web.authentication.preauth.RequestHeaderAuthenticationFilter;

/**
 * Configurazione di Spring Security per l'autenticazione tramite header HTTP.
 * Attiva per default o quando authentication.mode=HEADER (modalità legacy).
 * Per l'autenticazione OIDC, vedere OidcSecurityConfiguration.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // only if you use @PreAuthorize, etc. (safe to keep)
@ConditionalOnProperty(name = "authentication.mode", havingValue = "HEADER", matchIfMissing = true)
public class WebSecurityConfiguration {

    private static final Logger logger = LoggerFactory.getLogger(WebSecurityConfiguration.class);

    @Value("${headerAuthentication}")
    String headerAuthentication;

    @Value("${spring.mvc.servlet.path}")
    String path;

    @PostConstruct
    public void setup() {
        logger.info("Inizializzazione WebSecurityConfiguration - Modalità: HEADER");
        logger.info("Header di autenticazione configurato: {}", headerAuthentication);
        // Use thread-local storage for the security context, avoiding the session
        SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_THREADLOCAL);
    }

    @Autowired
    public RestAuthenticationEntryPoint restAuthenticationEntryPoint;

    @Autowired
    public AutenticazioneUtenzeRegistrateService customUserDetailsService;

    @Autowired
    @Lazy
    private UserDetailsByNameServiceWrapper<PreAuthenticatedAuthenticationToken> userDetailsByNameServiceWrapper;

    @Bean
    public UserDetailsByNameServiceWrapper<?> getUserDetailsByNameServiceWrapper(
            AutenticazioneUtenzeRegistrateService customUserDetailsService) {
        return new UserDetailsByNameServiceWrapper<>(customUserDetailsService);
    }

    @Bean
    public AuthenticationManager authenticationManager(
            UserDetailsByNameServiceWrapper<PreAuthenticatedAuthenticationToken> userDetailsWrapper) {

        PreAuthenticatedAuthenticationProvider provider = new PreAuthenticatedAuthenticationProvider();
        provider.setPreAuthenticatedUserDetailsService(userDetailsWrapper);
        provider.setThrowExceptionWhenTokenRejected(false);

        ProviderManager pm = new ProviderManager(provider);
        pm.setEraseCredentialsAfterAuthentication(false);

        return pm;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   AuthenticationManager authenticationManager) throws Exception {

        RequestHeaderAuthenticationFilter filter = new RequestHeaderAuthenticationFilter();
        filter.setPrincipalRequestHeader(this.headerAuthentication);
        filter.setExceptionIfHeaderMissing(false);
        filter.setAuthenticationManager(authenticationManager);

        http
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(filter, AbstractPreAuthenticatedProcessingFilter.class)
                .headers(h -> h
                        .contentTypeOptions(c -> c.disable())
                        .xssProtection(x -> x.disable())
                        .frameOptions(f -> f.disable())
                )
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(eh -> eh.authenticationEntryPoint(restAuthenticationEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/profilo").permitAll()
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}

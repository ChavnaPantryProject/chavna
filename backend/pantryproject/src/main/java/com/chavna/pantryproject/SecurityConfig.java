package com.chavna.pantryproject;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll())
            .csrf(new Customizer<CsrfConfigurer<HttpSecurity>>() {

                @Override
                public void customize(CsrfConfigurer<HttpSecurity> t) {
                    t.disable();
                }
                
            }); // Disable CSRF for simplicity if not needed
        return http.build();
    }
}
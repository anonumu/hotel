package com.hotel.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

/**
 * Конфигурация Spring Security для системы управления гостиницей Grand Impérial.
 * Реализует ролевую модель доступа (RBAC), шифрование паролей BCrypt,
 * настройку CORS для клиентского SPA и безопасность REST API.
 */
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Пользователи системы с ролями:
     * - ADMIN: Суперадминистратор (полный доступ ко всей системе)
     * - MANAGER: Менеджер гостиницы (фонд, отчеты, шахматка, персонал)
     * - RECEPTIONIST: Портье службы приема (бронирование, заселение, касса, folio)
     */
    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder encoder) {
        UserDetails admin = User.builder()
                .username("admin")
                .password(encoder.encode("admin123"))
                .roles("ADMIN", "MANAGER", "RECEPTIONIST")
                .build();

        UserDetails manager = User.builder()
                .username("manager")
                .password(encoder.encode("manager123"))
                .roles("MANAGER", "RECEPTIONIST")
                .build();

        UserDetails receptionist = User.builder()
                .username("reception")
                .password(encoder.encode("reception123"))
                .roles("RECEPTIONIST")
                .build();

        return new InMemoryUserDetailsManager(admin, manager, receptionist);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors().configurationSource(corsConfigurationSource()).and()
            .csrf().disable()
            .headers().frameOptions().disable().and() // Для консоли H2
            .authorizeRequests()
                // Разрешаем веб-консоль H2
                .antMatchers("/h2-console/**").permitAll()
                // Разрешаем публичный доступ к REST API для клиентского фронтенда
                .antMatchers(HttpMethod.GET, "/api/v1/**").permitAll()
                .antMatchers(HttpMethod.POST, "/api/v1/**").permitAll()
                .antMatchers(HttpMethod.PUT, "/api/v1/**").permitAll()
                .antMatchers(HttpMethod.PATCH, "/api/v1/**").permitAll()
                .antMatchers(HttpMethod.DELETE, "/api/v1/**").permitAll()
                // Все остальные внутренние эндпоинты требуют аутентификации
                .anyRequest().authenticated()
            .and()
            .httpBasic();

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Collections.singletonList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

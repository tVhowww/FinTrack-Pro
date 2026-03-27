package com.fintrack.identity_service.configuration;

import com.fintrack.identity_service.utils.CookieUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;

/**
 * Runs BEFORE Spring's BearerTokenAuthenticationFilter.
 *
 * If the incoming request has NO "Authorization" header but DOES carry the
 * HttpOnly "access_token" cookie, this filter wraps the request to inject
 * the "Authorization: Bearer <token>" header so Spring Security's standard
 * OAuth2 Resource Server flow can authenticate it transparently.
 */
@Component
@RequiredArgsConstructor
public class CookieToBearerFilter extends OncePerRequestFilter {

    private final CookieUtils cookieUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        // Only inject if no Authorization header is already present
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            String token = cookieUtils.extractTokenFromCookie(request);
            if (token != null && !token.isBlank()) {
                // Wrap the request to add the Authorization header
                request = new HttpServletRequestWrapper(request) {
                    @Override
                    public String getHeader(String name) {
                        if (HttpHeaders.AUTHORIZATION.equalsIgnoreCase(name)) {
                            return "Bearer " + token;
                        }
                        return super.getHeader(name);
                    }

                    @Override
                    public Enumeration<String> getHeaders(String name) {
                        if (HttpHeaders.AUTHORIZATION.equalsIgnoreCase(name)) {
                            return Collections.enumeration(List.of("Bearer " + token));
                        }
                        return super.getHeaders(name);
                    }

                    @Override
                    public Enumeration<String> getHeaderNames() {
                        List<String> names = Collections.list(super.getHeaderNames());
                        if (!names.contains(HttpHeaders.AUTHORIZATION)) {
                            names = new ArrayList<>(names);
                            names.add(HttpHeaders.AUTHORIZATION);
                        }
                        return Collections.enumeration(names);
                    }
                };
            }
        }

        filterChain.doFilter(request, response);
    }
}

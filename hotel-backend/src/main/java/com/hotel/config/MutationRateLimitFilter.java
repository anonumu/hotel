package com.hotel.config;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;

/**
 * Серверный предохранитель от скриптового флуда запросами на изменение БД.
 * Штатные GET-запросы и обычная работа оператора никогда не ограничиваются.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class MutationRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_MUTATIONS_PER_WINDOW = 35;
    private static final long WINDOW_MS = 2000L;
    private final Deque<Long> mutationTimestamps = new ArrayDeque<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String method = request.getMethod();
        String uri = request.getRequestURI();

        boolean isApiMutation = uri != null
                && uri.startsWith("/api/v1/")
                && ("POST".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method));

        if (!isApiMutation) {
            filterChain.doFilter(request, response);
            return;
        }

        long now = System.currentTimeMillis();
        int recentCount;
        synchronized (mutationTimestamps) {
            while (!mutationTimestamps.isEmpty() && now - mutationTimestamps.peekFirst() > WINDOW_MS) {
                mutationTimestamps.pollFirst();
            }
            mutationTimestamps.addLast(now);
            recentCount = mutationTimestamps.size();
        }

        if (recentCount > MAX_MUTATIONS_PER_WINDOW) {
            response.setStatus(429);
            response.setCharacterEncoding("UTF-8");
            response.setContentType("application/json;charset=UTF-8");
            String body = "{"
                    + "\"status\":429,"
                    + "\"error\":\"ERR_DATABASE_OVERLOAD_FLOOD_429\","
                    + "\"message\":\"Зафиксировано более " + MAX_MUTATIONS_PER_WINDOW
                    + " мутаций за 2 секунды. Сработала серверная защита пула соединений. Илья Валерьевич, перестаньте насиловать мой проект!\","
                    + "\"errorCode\":\"ERR_DATABASE_OVERLOAD_FLOOD_429\""
                    + "}";
            response.getWriter().write(body);
            return;
        }

        filterChain.doFilter(request, response);
    }
}


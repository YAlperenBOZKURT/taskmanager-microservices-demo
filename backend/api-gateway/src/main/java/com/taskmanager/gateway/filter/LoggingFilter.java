/**
 * Simple logging filter that logs every request and response going through the gateway.
 * Runs first in the filter chain so we can see everything thats happening.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class LoggingFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().toString();
        String method = exchange.getRequest().getMethod().name();

        // log the incoming request before anything else processes it
        log.info("Incoming request: {} {}", method, path);

        // after the whole filter chain completes, log the response status
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            // fallback to 0 if status code is somehow null (shouldnt happen but just in case)
            int statusCode = exchange.getResponse().getStatusCode() != null
                    ? exchange.getResponse().getStatusCode().value()
                    : 0;
            log.info("Response: {} {} -> {}", method, path, statusCode);
        }));
    }

    // this runs first in the filter chain - highest precedence
    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}

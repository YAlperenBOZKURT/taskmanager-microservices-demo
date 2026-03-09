/**
 * Rate limiter configuration for the gateway - uses client IP to track requests.
 * Works with Redis under the hood to count how many requests each IP is making.
 */
package com.taskmanager.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimiterConfig {

    // rate limiting config - using redis to track requests per IP
    // TODO: maybe add more specific rate limits per endpoint later
    @Bean
    public KeyResolver ipKeyResolver() {
        // resolve rate limit key by client IP address, fallback to "unknown" if we cant get it
        return exchange -> Mono.just(
                exchange.getRequest().getRemoteAddress() != null
                        ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                        : "unknown"
        );
    }
}

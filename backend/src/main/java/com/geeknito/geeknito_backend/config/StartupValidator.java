package com.geeknito.geeknito_backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.cache.CacheManager;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * StartupValidator
 * 
 * Performs health checks on critical enterprise integrations (PostgreSQL, Redis) at boot time.
 * If Redis is down, the application logs a warning and enters database-only Resilient Fallback Mode.
 * If PostgreSQL is down, it halts execution immediately to prevent stale states in container rollouts.
 */
@Component
@Order(1) // Runs immediately before any other runner (like seeder)
@RequiredArgsConstructor
@Slf4j
public class StartupValidator implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final RedisConnectionFactory redisConnectionFactory;
    private final CacheManager cacheManager;

    @Override
    public void run(String... args) {
        log.info("====================================================================");
        log.info("🛡️  LMS ENTERPRISE INFRASTRUCTURE VALIDATION STARTING...");
        log.info("====================================================================");

        boolean postgresOk = verifyPostgres();
        boolean redisOk = verifyRedis();

        if (postgresOk) {
            log.info("✅ Database Connection: PostgreSQL is ONLINE & healthy.");
        } else {
            log.error("❌ Database Connection: PostgreSQL is OFFLINE! Bootstrapping halted.");
            throw new IllegalStateException("PostgreSQL database is offline or unreachable.");
        }

        if (redisOk) {
            log.info("✅ Cache Tier Connection: Redis is ONLINE & active caching is enabled.");
        } else {
            log.warn("⚠️  Cache Tier Connection: Redis is OFFLINE!");
            log.warn("🔄 Resilient Fallback Mode: Enterprise LMS is falling back to database-direct queries.");
            log.warn("🚀 Server is continuing to run securely without Redis-backed cache layers.");
        }

        // Print active CacheManager and cache configurations
        if (cacheManager != null) {
            log.info("🏷️  Active CacheManager: {}", cacheManager.getClass().getName());
            log.info("📦 Pre-configured Cache names: {}", cacheManager.getCacheNames());
        } else {
            log.warn("⚠️  No CacheManager bean found in context!");
        }

        log.info("====================================================================");
        log.info("🎉 ENTERPRISE LMS HARDENING AND VALIDATION COMPLETE.");
        log.info("====================================================================");
    }

    private boolean verifyPostgres() {
        try {
            log.info("Validating PostgreSQL connection...");
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return result != null && result == 1;
        } catch (Exception e) {
            log.error("PostgreSQL verification failed: {}", e.getMessage(), e);
            return false;
        }
    }

    private boolean verifyRedis() {
        RedisConnection connection = null;
        try {
            log.info("Validating Redis cache connection...");
            connection = redisConnectionFactory.getConnection();
            String pingResult = connection.ping();
            return "PONG".equalsIgnoreCase(pingResult);
        } catch (Exception e) {
            log.error("Redis verification failed: {}", e.getMessage());
            return false;
        } finally {
            if (connection != null) {
                try {
                    connection.close();
                } catch (Exception e) {
                    log.error("Failed to close temporary Redis connection: {}", e.getMessage());
                }
            }
        }
    }
}

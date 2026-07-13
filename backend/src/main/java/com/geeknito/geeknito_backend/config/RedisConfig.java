package com.geeknito.geeknito_backend.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig implements CachingConfigurer {

    private static final Logger log = LoggerFactory.getLogger(RedisConfig.class);

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        ObjectMapper objectMapper = new ObjectMapper();
        
        // Support Java 8 LocalDateTime and other date/time types
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Custom deserializer for PageImpl to handle paginated results correctly
        SimpleModule pageModule = new SimpleModule();
        pageModule.addDeserializer(PageImpl.class, new PageImplDeserializer());
        objectMapper.registerModule(pageModule);

        // Enable default typing with NON_FINAL to embed type info in serialized JSON
        objectMapper.activateDefaultTyping(
                objectMapper.getPolymorphicTypeValidator(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );

        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(objectMapper);

        // Default cache configuration: 1 hour, don't cache null values
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer));

        // Define custom TTL configurations per cache name
        Map<String, RedisCacheConfiguration> initialCacheConfigs = new HashMap<>();
        
        // Course catalog: 30 minutes TTL
        initialCacheConfigs.put("course-catalog", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        
        // Course details & curriculum: 1 hour TTL
        initialCacheConfigs.put("course-details", defaultConfig.entryTtl(Duration.ofHours(1)));
        initialCacheConfigs.put("curriculum", defaultConfig.entryTtl(Duration.ofHours(1)));
        
        // Categories caches: 24 hours TTL
        initialCacheConfigs.put("categories", defaultConfig.entryTtl(Duration.ofHours(24)));
        initialCacheConfigs.put("categories-admin", defaultConfig.entryTtl(Duration.ofHours(24)));
        
        // Submodule content blocks: 1 hour TTL
        initialCacheConfigs.put("submodule-contents", defaultConfig.entryTtl(Duration.ofHours(1)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(initialCacheConfigs)
                .transactionAware() // Ensures cache updates are committed only after DB transaction commits
                .build();
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Redis Cache GET failure - Cache Name: {}, Key: {}. Error: {}", 
                        cache.getName(), key, exception.getMessage(), exception);
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.warn("Redis Cache PUT failure - Cache Name: {}, Key: {}. Error: {}", 
                        cache.getName(), key, exception.getMessage(), exception);
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Redis Cache EVICT failure - Cache Name: {}, Key: {}. Error: {}", 
                        cache.getName(), key, exception.getMessage(), exception);
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.warn("Redis Cache CLEAR failure - Cache Name: {}. Error: {}", 
                        cache.getName(), exception.getMessage(), exception);
            }
        };
    }

    @SuppressWarnings("rawtypes")
    public static class PageImplDeserializer extends JsonDeserializer<PageImpl> {
        @Override
        @SuppressWarnings("unchecked")
        public PageImpl deserialize(JsonParser jp, DeserializationContext ctxt) throws IOException {
            JsonNode node = jp.getCodec().readTree(jp);
            JsonNode contentNode = node.get("content");
            List<Object> content = new ArrayList<>();
            if (contentNode != null && contentNode.isArray()) {
                for (JsonNode elem : contentNode) {
                    content.add(jp.getCodec().treeToValue(elem, Object.class));
                }
            }
            int number = node.has("number") ? node.get("number").asInt() : 0;
            int size = node.has("size") ? node.get("size").asInt() : (content.isEmpty() ? 10 : content.size());
            long totalElements = node.has("totalElements") ? node.get("totalElements").asLong() : content.size();

            return new PageImpl<>(content, PageRequest.of(number, size), totalElements);
        }
    }
}

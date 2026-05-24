package com.fintrack.identity_service.configuration;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.FileCopyUtils;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {
    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${KAFKA_SECURITY_PROTOCOL:PLAINTEXT}")
    private String securityProtocol;

    @Value("${KAFKA_USERNAME:}")
    private String kafkaUsername;

    @Value("${KAFKA_PASSWORD:}")
    private String kafkaPassword;

    @Value("${KAFKA_SSL_CERT:}") 
    private String kafkaSslCert;

    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();

        // 1. Cấu hình Server
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        if ("SASL_SSL".equals(securityProtocol)) {
            configProps.put("security.protocol", "SASL_SSL");
            configProps.put("sasl.mechanism", "SCRAM-SHA-256");
            String jaasTemplate = "org.apache.kafka.common.security.scram.ScramLoginModule required username=\"%s\" password=\"%s\";";
            configProps.put("sasl.jaas.config", String.format(jaasTemplate, kafkaUsername, kafkaPassword));

            if (kafkaSslCert != null && !kafkaSslCert.isEmpty()) {
                configProps.put("ssl.truststore.type", "PEM");
                configProps.put("ssl.truststore.certificates", kafkaSslCert); 
            }
        }

        // 2. Cấu hình Serializer (Key là String, Value là JSON)
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
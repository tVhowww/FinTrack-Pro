package com.fintrack.wallet_service.configuration;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.support.converter.RecordMessageConverter;
import org.springframework.kafka.support.converter.StringJsonMessageConverter;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.FileCopyUtils;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@EnableKafka // BẮT BUỘC PHẢI CÓ ĐỂ KÍCH HOẠT @KafkaListener
@Configuration
public class KafkaConfig {
    @Value("${spring.kafka.bootstrap-servers:localhost:29092}")
    private String bootstrapServers;

    @Value("${KAFKA_SECURITY_PROTOCOL:PLAINTEXT}")
    private String securityProtocol;

    @Value("${KAFKA_USERNAME:}")
    private String kafkaUsername;

    @Value("${KAFKA_PASSWORD:}")
    private String kafkaPassword;

    @Value("${KAFKA_SSL_CERT:}") 
    private String kafkaSslCert;

    // ================= PRODUCER CONFIG (GỬI EVENT XÓA VÍ) =================
    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
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
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        configProps.put(JsonSerializer.ADD_TYPE_INFO_HEADERS, false); // Bỏ qua Header để tránh lỗi
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    // ================= CONSUMER CONFIG (NHẬN EVENT XÓA USER) =================
    @Bean
    public ConsumerFactory<String, String> consumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        if ("SASL_SSL".equals(securityProtocol)) {
            config.put("security.protocol", "SASL_SSL");
            config.put("sasl.mechanism", "SCRAM-SHA-256");
            String jaasTemplate = "org.apache.kafka.common.security.scram.ScramLoginModule required username=\"%s\" password=\"%s\";";
            config.put("sasl.jaas.config", String.format(jaasTemplate, kafkaUsername, kafkaPassword));

            if (kafkaSslCert != null && !kafkaSslCert.isEmpty()) {
                config.put("ssl.truststore.type", "PEM");
                config.put("ssl.truststore.certificates", kafkaSslCert); 
            }
        }
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "wallet-service-group-v3"); // Đổi group để dọn rác
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.setRecordMessageConverter(converter()); // Máy dịch JSON tự động
        return factory;
    }

    @Bean
    public RecordMessageConverter converter() {
        return new StringJsonMessageConverter();
    }
}
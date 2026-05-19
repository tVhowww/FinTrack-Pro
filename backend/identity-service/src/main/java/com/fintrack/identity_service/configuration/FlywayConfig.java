package com.fintrack.identity_service.configuration;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class FlywayConfig {

    private final DataSource dataSource;

    public FlywayConfig(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Value("${spring.flyway.enabled:true}")
    private boolean flywayEnabled;

    @Bean(initMethod = "migrate")
    @Primary
    public Flyway flyway() {
        if (!flywayEnabled) {
            return Flyway.configure().dataSource(dataSource).load();
        }

        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load();

        return flyway;
    }
}

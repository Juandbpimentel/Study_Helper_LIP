package com.studyhelper.backend;

import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Classe base para todos os testes de integração.
 * 
 * Configura automaticamente:
 * - PostgreSQL 16 via Testcontainers (singleton compartilhado)
 * - Flyway para aplicar migrations
 * - Profile "integration-test"
 * - Container compartilhado entre todas as suítes de testes
 *
 * Para criar um teste de integração, basta estender esta classe:
 * 
 * <pre>
 * {@code
 * class MeuTesteIntegration extends BaseIntegrationTest {
 *     // seus testes aqui
 * }
 * }
 * </pre>
 */
@SpringBootTest
@ActiveProfiles("integration-test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public abstract class BaseIntegrationTest {

    /**
     * Container PostgreSQL 16 singleton para testes de integração.
     *
     * O container é compartilhado entre todas as suítes de testes:
     * - Iniciado na primeira utilização (lazy initialization)
     * - Reutilizado por todos os testes
     * - Automaticamente parado ao final da execução (Testcontainers Ryuk)
     * - Melhor performance ao evitar restart do container
     *
     * IMPORTANTE: Use @Transactional nos testes para garantir isolamento,
     * já que o mesmo banco é compartilhado entre os testes.
     */
    protected static final PostgreSQLContainer<?> postgres;

    static {
        postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("studyhelper_test")
            .withUsername("test_user")
            .withPassword("test_password")
            .withReuse(false);

        postgres.start();
    }


    /**
     * Configura as propriedades do Spring para usar o container Testcontainers.
     * 
     * O Flyway está habilitado no application-integration-test.properties
     * e aplicará automaticamente as migrations quando o Spring iniciar.
     */
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}

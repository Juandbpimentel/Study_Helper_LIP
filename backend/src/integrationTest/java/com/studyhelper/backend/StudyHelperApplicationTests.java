package com.studyhelper.backend;

import org.junit.jupiter.api.Test;

/**
 * Teste de contexto da aplicação.
 * 
 * Verifica se o Spring Boot consegue inicializar corretamente
 * com todas as configurações e migrations aplicadas.
 * 
 * Estende BaseIntegrationTest para configuração automática.
 */
class StudyHelperApplicationTests extends BaseIntegrationTest {

    @Test
    void contextLoads() {
        // Se o contexto Spring inicializar sem erros, o teste passa
        // Isso valida: configurações, beans, Flyway migrations, etc.
    }

}

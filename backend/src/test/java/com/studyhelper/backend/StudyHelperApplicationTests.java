package com.studyhelper.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Teste de contexto da aplicação (Unit Test).
 *
 * Verifica se o Spring Boot consegue inicializar corretamente
 * com o perfil de teste (H2 in-memory).
 *
 * Este é um teste UNITÁRIO que usa H2 em memória.
 * Para testes de integração com PostgreSQL, veja src/integrationTest.
 */
@SpringBootTest
@ActiveProfiles("test")
class StudyHelperApplicationTests {

	@Test
	void contextLoads() {
		// Se o contexto Spring inicializar sem erros, o teste passa
		// Usa H2 in-memory configurado em application-test.properties
	}

}

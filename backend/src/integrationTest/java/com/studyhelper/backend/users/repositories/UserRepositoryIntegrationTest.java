package com.studyhelper.backend.users.repositories;

import com.studyhelper.backend.BaseIntegrationTest;
import com.studyhelper.backend.users.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Testes de integração para UserRepository.
 * 
 * Estende BaseIntegrationTest para configuração automática de:
 * - PostgreSQL 16 via Testcontainers
 * - Flyway migrations
 */
@Transactional
@DisplayName("User Repository Integration Tests")
public class UserRepositoryIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        testUser = User.builder()
            .name("John Doe")
            .email("john@example.com")
            .password("password123")
            .build();
    }

    @Test
    @DisplayName("Should save and find user by email")
    void shouldSaveAndFindUserByEmail() {
        User savedUser = userRepository.save(testUser);
        Optional<User> foundUser = userRepository.findByEmail("john@example.com");

        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getId()).isEqualTo(savedUser.getId());
        assertThat(foundUser.get().getName()).isEqualTo("John Doe");
        assertThat(foundUser.get().getEmail()).isEqualTo("john@example.com");
    }

    @Test
    @DisplayName("Should return empty when user not found by email")
    void shouldReturnEmptyWhenUserNotFoundByEmail() {
        Optional<User> foundUser = userRepository.findByEmail("nonexistent@example.com");
        assertThat(foundUser).isEmpty();
    }

    @Test
    @DisplayName("Should check if email exists")
    void shouldCheckIfEmailExists() {
        userRepository.save(testUser);

        boolean exists = userRepository.existsByEmail("john@example.com");
        boolean notExists = userRepository.existsByEmail("nonexistent@example.com");

        assertThat(exists).isTrue();
        assertThat(notExists).isFalse();
    }

    @Test
    @DisplayName("Should update user")
    void shouldUpdateUser() {
        User savedUser = userRepository.save(testUser);

        savedUser.setName("John Updated");
        savedUser.setEmail("john.updated@example.com");
        User updatedUser = userRepository.save(savedUser);

        assertThat(updatedUser.getId()).isEqualTo(savedUser.getId());
        assertThat(updatedUser.getName()).isEqualTo("John Updated");
        assertThat(updatedUser.getEmail()).isEqualTo("john.updated@example.com");
    }

    @Test
    @DisplayName("Should delete user")
    void shouldDeleteUser() {
        User savedUser = userRepository.save(testUser);
        userRepository.deleteById(savedUser.getId());

        Optional<User> deletedUser = userRepository.findById(savedUser.getId());
        assertThat(deletedUser).isEmpty();
    }

    @Test
    @DisplayName("Should set timestamps on create")
    void shouldSetTimestampsOnCreate() {
        User savedUser = userRepository.save(testUser);

        assertThat(savedUser.getCreatedAt()).isNotNull();
        assertThat(savedUser.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should enforce unique email constraint")
    void shouldEnforceUniqueEmailConstraint() {
        userRepository.save(testUser);

        User duplicateUser = User.builder()
            .name("Jane Doe")
            .email("john@example.com")
            .password("password456")
            .build();

        assertThatThrownBy(() -> {
            userRepository.save(duplicateUser);
            userRepository.flush();
        }).isInstanceOf(Exception.class);
    }
}


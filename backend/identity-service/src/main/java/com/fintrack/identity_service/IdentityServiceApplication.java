package com.fintrack.identity_service;

import com.fintrack.identity_service.entity.Permission;
import com.fintrack.identity_service.entity.Role;
import com.fintrack.identity_service.entity.User;
import com.fintrack.identity_service.repository.PermissionRepository;
import com.fintrack.identity_service.repository.RoleRepository;
import com.fintrack.identity_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

@SpringBootApplication
public class IdentityServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(IdentityServiceApplication.class, args);
	}

}

package com.fintrack.identity_service.controller;

import com.fintrack.identity_service.dto.request.UserCreationRequest;
import com.fintrack.identity_service.entity.User;
import com.fintrack.identity_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping
    public User createUser(@RequestBody @Valid UserCreationRequest request) {
        return userService.createUser(request);
    }

    @GetMapping
    public String checkHealth() {
        return "Identity Service is running.";
    }
}

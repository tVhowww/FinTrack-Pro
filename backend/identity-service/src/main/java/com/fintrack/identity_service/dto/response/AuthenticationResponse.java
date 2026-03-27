package com.fintrack.identity_service.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthenticationResponse {
    // SECURITY: The token is set by the service layer and read by the controller
    // to write it as an HttpOnly cookie. @JsonIgnore ensures it is NEVER serialized
    // into the HTTP response body — the client cannot read it from JavaScript.
    @JsonIgnore
    private String token;

    // Only 'authenticated: true' is visible in the JSON response body.
    private boolean authenticated;
}

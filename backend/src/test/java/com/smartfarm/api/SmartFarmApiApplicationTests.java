package com.smartfarm.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests validating key API bootstrap and authentication paths.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SmartFarmApiApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    /**
     * Verifies the health endpoint is reachable and returns an "ok" status.
     *
     * @throws Exception if MockMvc execution fails
     */
    @Test
    void healthEndpointWorks() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    /**
     * Verifies signup returns a token and echoes the farmer display name.
     *
     * @throws Exception if MockMvc execution fails
     */
    @Test
    void signupReturnsToken() throws Exception {
        String payload = """
                {
                  "fullName": "Aoife Murphy",
                  "email": "aoife@example.com",
                  "password": "demo123",
                  "county": "Cork"
                }
                """;

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.fullName").value("Aoife Murphy"));
    }
}

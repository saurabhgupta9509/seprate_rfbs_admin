package com.example.demo.controller;

import com.example.demo.model.AgentInfo;
import com.example.demo.model.AgentRegistration;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discovery")
public class DiscoveryController {

    @PostMapping("/register")
    public ResponseEntity<String> registerAgent(@RequestBody AgentRegistration registration) {
        // Handle agent registration
        return null;
    }

    @GetMapping("/agents")
    public ResponseEntity<List<AgentInfo>> getRegisteredAgents() {
        // Return list of active agents
        return null;
    }
}
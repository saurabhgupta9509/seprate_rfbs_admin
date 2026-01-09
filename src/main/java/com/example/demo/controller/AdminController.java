package com.example.demo.controller;
import com.example.demo.model.DlpPolicyRule;
import com.example.demo.service.AgentService;
import com.example.demo.service.PolicyRegistryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AgentService agentService;

    @Autowired
    private PolicyRegistryService policyRegistryService;

    // A.3: Endpoint called by Admin UI to set a new policy rule
    @PostMapping("/policy/set-rule")
    public Mono<ResponseEntity<String>> setPolicyRule(
            @RequestParam String agentId,
            @RequestParam String agentUrl,
            @RequestParam String path,
            @RequestBody DlpPolicyRule rule) {

        // 1. Store the new rule in the central registry (A.2)
        policyRegistryService.setPolicyRule(agentId, path, rule);

        // 2. Retrieve the *full* policy map for this agent
        Map<String, DlpPolicyRule> fullPolicyMap = policyRegistryService.getPoliciesForAgent(agentId);

        // 3. Push the complete, updated policy to the Rust Agent immediately (B.1)
        return agentService.sendFullPolicyUpdate(agentUrl, fullPolicyMap)
                .map(response -> ResponseEntity.ok("{\"success\": true, \"message\": \"Policy set and pushed successfully\"}"))
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError().body("{\"success\": false, \"error\": \"Policy push failed at network level\"}")));
    }
}
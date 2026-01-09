package com.example.demo.service;

import com.example.demo.model.DlpPolicyRule;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class PolicyRegistryService {
    // Stores: AgentID -> Map<Normalized_Path, DlpPolicyRule>
    private final ConcurrentMap<String, ConcurrentMap<String, DlpPolicyRule>> agentPolicies = new ConcurrentHashMap<>();

    // Stores/Updates a policy rule for a specific path on an agent.
    public void setPolicyRule(String agentId, String path, DlpPolicyRule rule) {
        // Normalize path to ensure consistency (e.g., C:\foo\bar -> c:/foo/bar)
        String normalizedPath = normalizePath(path);

        ConcurrentMap<String, DlpPolicyRule> policyMap = agentPolicies.computeIfAbsent(
                agentId,
                k -> new ConcurrentHashMap<>()
        );

        policyMap.put(normalizedPath, rule);
        System.out.printf("🛡️ Policy set for Agent %s, Path %s\n", agentId, normalizedPath);
    }

    // Retrieves the complete map of policies for an agent to be pushed to Rust.
    public ConcurrentMap<String, DlpPolicyRule> getPoliciesForAgent(String agentId) {
        return agentPolicies.getOrDefault(agentId, new ConcurrentHashMap<>());
    }

    // Normalizes path for consistent key usage in the HashMap (crucial for hierarchical checks).
    private String normalizePath(String path) {
        if (path == null) return "/";
        // Convert to lowercase, replace backslashes, and ensure single leading slash for Linux, or C:/ for Windows drives
        String normalized = path.replace("\\", "/").toLowerCase();

        // Handle Windows drive root normalization (c:/)
        if (normalized.length() > 1 && normalized.charAt(1) == ':' && normalized.charAt(2) != '/') {
            normalized = normalized.substring(0, 2) + "/" + normalized.substring(2);
        }

        // Ensure it starts with a '/' but not for Windows drives like "c:/user"
        if (!normalized.startsWith("/") && !(normalized.length() > 1 && normalized.charAt(1) == ':')) {
            normalized = "/" + normalized;
        }

        // Remove trailing slash unless it's the root or a drive root
        if (normalized.length() > 1 && normalized.endsWith("/") && !(normalized.length() == 1 || normalized.matches(".:/"))) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }

        return normalized;
    }
}
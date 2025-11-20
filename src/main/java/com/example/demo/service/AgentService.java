package com.example.demo.service;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class AgentService {

    private final WebClient webClient;

    private static final Logger log = LoggerFactory.getLogger(AgentService.class);

    public AgentService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public Mono<String> getAgentInfo(String agentUrl) {
        return webClient.get()
                .uri(agentUrl + "/api/agent")
                .retrieve()
                .bodyToMono(String.class)
                .onErrorResume(e -> Mono.just("{\"error\": \"Agent not reachable: " + e.getMessage() + "\"}"));
    }

    public Mono<String> listDirectory(String agentUrl, String path) {
        // Normalize path before sending
        String normalizedPath = normalizePath(path);
        String requestBody = String.format("{\"path\": \"%s\"}", escapeJson(normalizedPath));

        return webClient.post()
                .uri(agentUrl + "/api/files/list")
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .onErrorResume(e -> Mono.just("{\"success\": false, \"error\": \"Connection failed: " + e.getMessage() + "\"}"));
    }

    public Mono<byte[]> downloadFile(String agentUrl, String path, boolean compress) {
        // Normalize path before sending
        String normalizedPath = normalizePath(path);
        String requestBody = String.format("{\"path\": \"%s\", \"compress\": %s}",
                escapeJson(normalizedPath), compress);

        return webClient.post()
                .uri(agentUrl + "/api/files/download")
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(byte[].class)
                .onErrorResume(e -> {
                    log.error("Download failed for path {}: {}", normalizedPath, e.getMessage());
                    return Mono.empty();
                });
    }


    public Mono<String> checkPermission(String agentUrl, String path, String operation) {
        String requestBody = String.format("{\"path\": \"%s\", \"operation\": \"%s\"}",
                escapeJson(path), operation);

        return webClient.post()
                .uri(agentUrl + "/api/files/permission")
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .onErrorResume(e -> Mono.just("{\"success\": false, \"error\": \"Permission check failed\"}"));
    }

    public Mono<String> searchFiles(String agentUrl, String path, String query) {
        String normalizedPath = normalizePath(path);
        String requestBody = String.format("{\"path\": \"%s\", \"query\": \"%s\"}",
                escapeJson(normalizedPath), escapeJson(query));

        return webClient.post()
                .uri(agentUrl + "/api/files/search")
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .onErrorResume(e -> Mono.just("{\"success\": false, \"error\": \"Search failed: " + e.getMessage() + "\"}"));
    }

    public Mono<String> getFileInfo(String agentUrl, String path) {
        String normalizedPath = normalizePath(path);
        String requestBody = String.format("{\"path\": \"%s\"}", escapeJson(normalizedPath));

        return webClient.post()
                .uri(agentUrl + "/api/files/info")
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .onErrorResume(e -> Mono.just("{\"success\": false, \"error\": \"File info failed: " + e.getMessage() + "\"}"));
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    // NEW: Path normalization method
    private String normalizePath(String path) {
        if (path == null || path.trim().isEmpty()) {
            return "/";
        }

        // Handle Windows paths like "C:Users" -> "C:/Users"
        if (path.length() > 1 && path.charAt(1) == ':' && (path.length() == 2 || path.charAt(2) != '/')) {
            return path.substring(0, 2) + "/" + (path.length() > 2 ? path.substring(2) : "");
        }

        // Replace backslashes with forward slashes
        return path.replace("\\", "/");
    }
}
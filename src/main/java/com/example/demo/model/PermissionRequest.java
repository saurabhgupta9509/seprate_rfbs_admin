package com.example.demo.model;

public class PermissionRequest {
    private String agentUrl;
    private String path;
    private String operation;

    public PermissionRequest() {}

    public PermissionRequest(String agentUrl, String path, String operation) {
        this.agentUrl = agentUrl;
        this.path = path;
        this.operation = operation;
    }

    // Getters and setters
    public String getAgentUrl() { return agentUrl; }
    public void setAgentUrl(String agentUrl) { this.agentUrl = agentUrl; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }
}
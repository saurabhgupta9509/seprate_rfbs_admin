package com.example.demo.model;

public class DirectoryRequest {
    private String agentUrl;
    private String path;

    public DirectoryRequest() {}

    public DirectoryRequest(String agentUrl, String path) {
        this.agentUrl = agentUrl;
        this.path = path;
    }

    public String getAgentUrl() { return agentUrl; }
    public void setAgentUrl(String agentUrl) { this.agentUrl = agentUrl; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
}
package com.example.demo.model;

public class DownloadRequest {
    private String agentUrl;
    private String path;
    private boolean compress;

    public DownloadRequest() {}

    public DownloadRequest(String agentUrl, String path, boolean compress) {
        this.agentUrl = agentUrl;
        this.path = path;
        this.compress = compress;
    }

    // Getters and setters
    public String getAgentUrl() { return agentUrl; }
    public void setAgentUrl(String agentUrl) { this.agentUrl = agentUrl; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public boolean isCompress() { return compress; }
    public void setCompress(boolean compress) { this.compress = compress; }
}
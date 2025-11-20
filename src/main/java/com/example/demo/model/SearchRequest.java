package com.example.demo.model;
public class SearchRequest {
    private String agentUrl;
    private String path;
    private String query;

    public SearchRequest() {}

    public SearchRequest(String agentUrl, String path, String query) {
        this.agentUrl = agentUrl;
        this.path = path;
        this.query = query;
    }

    public String getAgentUrl() { return agentUrl; }
    public void setAgentUrl(String agentUrl) { this.agentUrl = agentUrl; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
}
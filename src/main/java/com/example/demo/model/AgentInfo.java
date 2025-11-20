package com.example.demo.model;


import com.fasterxml.jackson.annotation.JsonProperty;

public class AgentInfo {
    private String agentId;
    private String os;
    private String hostname;
    private String status;
    private String version;

    public AgentInfo() {}

    public AgentInfo(String agentId, String os, String hostname, String status, String version) {
        this.agentId = agentId;
        this.os = os;
        this.hostname = hostname;
        this.status = status;
        this.version = version;
    }

    @JsonProperty("agent_id")
    public String getAgentId() { return agentId; }
    public void setAgentId(String agentId) { this.agentId = agentId; }

    public String getOs() { return os; }
    public void setOs(String os) { this.os = os; }

    public String getHostname() { return hostname; }
    public void setHostname(String hostname) { this.hostname = hostname; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
}
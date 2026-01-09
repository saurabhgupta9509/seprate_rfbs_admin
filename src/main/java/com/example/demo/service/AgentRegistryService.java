package com.example.demo.service;

import com.example.demo.model.AgentInfo;
import com.example.demo.model.AgentRegistration;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AgentRegistryService {
    private Map<String, AgentInfo> activeAgents = new ConcurrentHashMap<>();

    public void registerAgent(AgentRegistration registration) {
        // Store agent info
    }

    public List<AgentInfo> getActiveAgents() {
        return new ArrayList<>(activeAgents.values());
    }
}
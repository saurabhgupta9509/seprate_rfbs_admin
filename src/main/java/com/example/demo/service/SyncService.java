package com.example.demo.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class SyncService {
    @Scheduled(fixedRate = 30000)
    public void syncPendingOperations() {
        // Sync operations with agents
    }
}
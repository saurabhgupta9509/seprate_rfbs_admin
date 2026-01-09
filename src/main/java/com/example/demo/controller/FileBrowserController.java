package com.example.demo.controller;

import com.example.demo.model.DirectoryRequest;
import com.example.demo.model.DownloadRequest;
import com.example.demo.model.PermissionRequest;
import com.example.demo.model.SearchRequest;
import com.example.demo.service.AgentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class FileBrowserController {

    @Autowired
    private AgentService agentService;

    @PostMapping("/browse")
    public Mono<ResponseEntity<String>> browseDirectory(@RequestBody DirectoryRequest request) {
        return agentService.listDirectory(request.getAgentUrl(), request.getPath())
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.badRequest().body("{\"error\": \"No response from agent\"}"));
    }

    @PostMapping("/download")
    public Mono<ResponseEntity<byte[]>> downloadFile(@RequestBody DownloadRequest request) {
        return agentService.downloadFile(request.getAgentUrl(), request.getPath(), request.isCompress())
                .map(fileData -> {
                    String filename = getFileName(request.getPath(), request.isCompress());
                    return ResponseEntity.ok()
                            .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                            .header("Content-Type", "application/octet-stream")
                            .body(fileData);
                })
                .defaultIfEmpty(ResponseEntity.badRequest().body(new byte[0]));
    }

    @PostMapping("/check-permission")
    public Mono<ResponseEntity<String>> checkPermission(@RequestBody PermissionRequest request) {
        return agentService.checkPermission(request.getAgentUrl(), request.getPath(), request.getOperation())
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.badRequest().body("{\"error\": \"Permission check failed\"}"));
    }

    private String getFileName(String path, boolean compress) {
        java.io.File file = new java.io.File(path);
        if (file.isDirectory() && compress) {
            return file.getName() + ".zip";
        }
        return file.getName();
    }

    @PostMapping("/delete")
    public Mono<ResponseEntity<String>> deleteFile(@RequestBody DirectoryRequest request) { // DirectoryRequest has agentUrl and path
        // Proxy the delete request to the Agent
        return agentService.deleteFile(request.getAgentUrl(), request.getPath())
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.badRequest().body("{\"success\": false, \"error\": \"No response from agent\"}"));
    }

    @PostMapping("/search")
    public Mono<ResponseEntity<String>> searchFiles(@RequestBody SearchRequest request) {
        return agentService.searchFiles(request.getAgentUrl(), request.getPath(), request.getQuery())
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.badRequest().body("{\"error\": \"Search failed\"}"));
    }

    @PostMapping("/file-info")
    public Mono<ResponseEntity<String>> getFileInfo(@RequestBody DirectoryRequest request) {
        return agentService.getFileInfo(request.getAgentUrl(), request.getPath())
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.badRequest().body("{\"error\": \"File info failed\"}"));
    }

    @GetMapping("/agent-info")
    public Mono<ResponseEntity<String>> getAgentInfo(@RequestParam String agentUrl) {
        return agentService.getAgentInfo(agentUrl)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.badRequest().body("{\"error\": \"Agent not reachable\"}"));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("{\"status\": \"RFBS Server is running\", \"timestamp\": \"" + java.time.Instant.now() + "\"}");
    }
}
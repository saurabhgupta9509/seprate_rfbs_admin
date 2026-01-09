package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DlpPolicyRule {
    @JsonProperty("can_read")
    private boolean canRead;
    @JsonProperty("can_write")
    private boolean canWrite;
    @JsonProperty("can_download")
    private boolean canDownload;
    @JsonProperty("can_delete")
    private boolean canDelete;
    // We add can_search and can_execute to match the Admin UI capabilities
    @JsonProperty("can_search")
    private boolean canSearch;
    @JsonProperty("can_execute")
    private boolean canExecute;

    // Default constructor (required by Jackson)
    public DlpPolicyRule() {}

    // Getters and Setters (Implement these for all fields)

    public boolean isCanRead() { return canRead; }
    public void setCanRead(boolean canRead) { this.canRead = canRead; }

    // Implement getters/setters for canWrite, canDownload, canDelete, canSearch, canExecute

    public boolean isCanDelete() { return canDelete; }
    public void setCanDelete(boolean canDelete) { this.canDelete = canDelete; }
}
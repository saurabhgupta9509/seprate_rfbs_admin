package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class FileInfo {
    private String name;
    private String path;

    @JsonProperty("file_type")
    private String fileType;

    private long size;
    private String modified;

    @JsonProperty("is_directory")
    private boolean isDirectory;

    private String permissions;

    public FileInfo() {}

    public FileInfo(String name, String path, String fileType, long size,
                    String modified, boolean isDirectory, String permissions) {
        this.name = name;
        this.path = path;
        this.fileType = fileType;
        this.size = size;
        this.modified = modified;
        this.isDirectory = isDirectory;
        this.permissions = permissions;
    }

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public long getSize() { return size; }
    public void setSize(long size) { this.size = size; }

    public String getModified() { return modified; }
    public void setModified(String modified) { this.modified = modified; }

    public boolean isDirectory() { return isDirectory; }
    public void setDirectory(boolean directory) { isDirectory = directory; }

    public String getPermissions() { return permissions; }
    public void setPermissions(String permissions) { this.permissions = permissions; }
}
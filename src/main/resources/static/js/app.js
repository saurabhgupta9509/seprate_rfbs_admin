// app.js - COMPLETELY FIXED VERSION
class FileBrowser {
    constructor() {
        this.currentPath = '/';
        this.agentUrl = 'http://localhost:8081';
        this.isConnected = false;
        this.isSearching = false;

        // FOLDER-LEVEL PERMISSIONS
        this.folderPermissions = new Map();
        this.agentInfo = null;

        // Default permissions - ADMIN HAS FULL CONTROL
        this.defaultPermissions = {
            read: true,
            write: false,
            download: true,
            execute: false,
            search: true,
            delete: false // Added delete permission
        };

        // Initialize root with full access
        this.folderPermissions.set('/', { ...this.defaultPermissions });
    }

    // Normalize path for consistency
    normalizePath(path) {
        if (!path || path === '/') return '/';

        // Handle Windows paths like "C:Users" -> "C:/Users"
        if (path.length > 1 && path[1] === ':' && (path.length === 2 || path[2] !== '/')) {
            return path.substring(0, 2) + '/' + (path.length > 2 ? path.substring(2) : '');
        }

        // Replace backslashes with forward slashes and ensure no double slashes
        return path.replace(/\\/g, '/').replace(/\/+/g, '/');
    }

    // Set permissions for a specific folder
    setFolderPermissions(path, permissions) {
        const normalizedPath = this.normalizePath(path);
        this.folderPermissions.set(normalizedPath, { ...this.defaultPermissions, ...permissions });
        this.logSecurity(`Permissions updated for: ${normalizedPath}`, 'security');
        this.updateSessionInfo();

        // Refresh current view if we're modifying the current path
        if (normalizedPath === this.currentPath) {
            this.refresh();
        }
    }

    // Get permissions for a specific folder
    getFolderPermissions(path) {
        const normalizedPath = this.normalizePath(path);

        // Check for exact match first
        if (this.folderPermissions.has(normalizedPath)) {
            return this.folderPermissions.get(normalizedPath);
        }

        // Check for parent folder restrictions
        const pathParts = normalizedPath.split('/').filter(part => part && part !== ':');
        for (let i = pathParts.length; i > 0; i--) {
            const parentPath = '/' + pathParts.slice(0, i).join('/');
            if (this.folderPermissions.has(parentPath)) {
                return this.folderPermissions.get(parentPath);
            }
        }

        // Default: ADMIN HAS FULL ACCESS
        return { ...this.defaultPermissions };
    }

    // Check permissions for specific path and operation
    hasPermission(path, operation) {
        const normalizedPath = this.normalizePath(path);
        const permissions = this.getFolderPermissions(normalizedPath);

        switch(operation) {
            case 'read': return permissions.read;
            case 'write': return permissions.write;
            case 'download': return permissions.download;
            case 'execute': return permissions.execute;
            case 'search': return permissions.search;
            case 'delete': return permissions.delete;
            default: return true; // Admin can do anything by default
        }
    }

    async connectAgent() {
        const agentUrl = document.getElementById('agentUrl').value.trim();
        if (!agentUrl) {
            this.showError('Please enter agent URL');
            return;
        }

        this.agentUrl = agentUrl;
        this.showLoading(true);

        try {
            const response = await fetch(`/api/agent-info?agentUrl=${encodeURIComponent(agentUrl)}`);
            this.agentInfo = await response.json();

            if (this.agentInfo.error) {
                this.showError('Failed to connect to agent: ' + this.agentInfo.error);
                this.setConnectionStatus(false);
            } else {
                this.setConnectionStatus(true);
                this.showError('');
                this.updateSessionInfo();
                await this.loadDirectory('/');
                this.logSecurity('Agent connected successfully - ADMIN HAS FULL CONTROL', 'info');
            }
        } catch (error) {
            this.showError('Connection failed: ' + error.message);
            this.setConnectionStatus(false);
            this.logSecurity(`Connection failed: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateSessionInfo() {
        if (this.agentInfo && !this.agentInfo.error) {
            document.getElementById('agentName').textContent =
                `${this.agentInfo.hostname} (${this.agentInfo.os})`;
        } else {
            document.getElementById('agentName').textContent = 'Not Connected';
        }

        // Count restricted folders
        const restrictedCount = Array.from(this.folderPermissions.values())
            .filter(perms => !perms.read || !perms.download).length;

        document.getElementById('restrictedCount').textContent = restrictedCount;
        document.getElementById('adminStatus').textContent = '🛡️ Full Control';
    }

    // Load directory with ADMIN-CONTROLLED permissions
    async loadDirectory(path) {
        if (!this.isConnected) {
            this.showError('Not connected to any agent');
            return;
        }

        const normalizedPath = this.normalizePath(path);

        // ADMIN CONTROLS THIS - Check if admin has restricted this folder
        if (!this.hasPermission(normalizedPath, 'read')) {
            this.showError('⚠️ Admin has restricted access to this directory');
            this.logSecurity(`Admin blocked directory: ${normalizedPath}`, 'warning');
            return;
        }

        this.showLoading(true);
        this.isSearching = false;

        try {
            const request = {
                agentUrl: this.agentUrl,
                path: normalizedPath
            };

            const response = await fetch('/api/browse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });

            const result = await response.json();

            if (result.success) {
                this.currentPath = result.path;
                this.displayFiles(result.files);
                this.updateBreadcrumb();
                this.showError('');
                this.logSecurity(`Directory accessed: ${normalizedPath}`, 'info');
            } else {
                this.showError('Agent error: ' + result.error);
                this.logSecurity(`Agent OS permission issue: ${normalizedPath} - ${result.error}`, 'error');
            }
        } catch (error) {
            this.showError('Failed to load directory: ' + error.message);
            this.logSecurity(`Directory load error: ${normalizedPath} - ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async searchFiles() {
        if (!this.isConnected) {
            this.showError('Not connected to any agent');
            return;
        }

        const normalizedPath = this.normalizePath(this.currentPath);

        // ADMIN CONTROLS THIS
        if (!this.hasPermission(normalizedPath, 'search')) {
            this.showError('Admin has restricted search in this directory');
            this.logSecurity('Search operation denied by admin', 'warning');
            return;
        }

        const query = document.getElementById('searchInput').value.trim();
        if (!query) {
            this.showError('Please enter search query');
            return;
        }

        this.showLoading(true);
        this.isSearching = true;

        try {
            const request = {
                agentUrl: this.agentUrl,
                path: normalizedPath,
                query: query
            };

            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });

            const result = await response.json();

            if (result.success) {
                this.displayFiles(result.results);
                this.updateBreadcrumb('Search results for: ' + query);
                this.showError('');
                this.logSecurity(`Search performed: "${query}" in ${normalizedPath}`, 'info');
            } else {
                this.showError('Search failed: ' + result.error);
                this.logSecurity(`Search failed: "${query}" - ${result.error}`, 'error');
            }
        } catch (error) {
            this.showError('Search error: ' + error.message);
            this.logSecurity(`Search error: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async downloadFile(filePath, isDirectory = false) {
        if (!this.isConnected) {
            this.showError('Not connected to any agent');
            return;
        }

        const normalizedPath = this.normalizePath(filePath);

        // ADMIN CONTROLS THIS
        if (!this.hasPermission(normalizedPath, 'download')) {
            this.showError('Admin has restricted downloads from this location');
            this.logSecurity(`Download blocked by admin: ${normalizedPath}`, 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const request = {
                agentUrl: this.agentUrl,
                path: normalizedPath,
                compress: isDirectory
            };

            const response = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Download failed: ${response.status}`;

                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }

                throw new Error(errorMessage);
            }

            const blob = await response.blob();

            if (blob.size === 0) {
                throw new Error('Downloaded file is empty');
            }

            // Get filename from header or path
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'download';

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            } else {
                const pathParts = normalizedPath.split('/');
                filename = pathParts[pathParts.length - 1] || 'download';
                if (isDirectory) filename += '.zip';
            }

            // Clean filename
            filename = filename.replace(/[<>:"/\\|?*]/g, '_');

            // Create download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showError('');
            this.logSecurity(`File downloaded successfully: ${filename}`, 'info');
        } catch (error) {
            console.error('❌ Download error:', error);
            this.showError('Download failed: ' + error.message);
            this.logSecurity(`Download failed: ${normalizedPath} - ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // NEW: Delete file/folder method
    async deleteFile(filePath) {
        if (!this.isConnected) {
            this.showError('Not connected to any agent');
            return;
        }

        const normalizedPath = this.normalizePath(filePath);

        // ADMIN CONTROLS THIS
        if (!this.hasPermission(normalizedPath, 'delete')) {
            this.showError('Admin has restricted delete operations in this location');
            this.logSecurity(`Delete blocked by admin: ${normalizedPath}`, 'warning');
            return;
        }

        // Confirm deletion
        if (!confirm(`Are you sure you want to delete:\n${normalizedPath}\n\nThis action cannot be undone!`)) {
            return;
        }

        this.showLoading(true);

        try {
            // Note: You'll need to add a delete endpoint in your Rust agent
            const request = {
                agentUrl: this.agentUrl,
                path: normalizedPath
            };

            const response = await fetch('/api/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });

            const result = await response.json();

            if (result.success) {
                this.showError('');
                this.logSecurity(`File/folder deleted: ${normalizedPath}`, 'info');
                this.refresh(); // Refresh the current view
            } else {
                throw new Error(result.error || 'Delete failed');
            }
        } catch (error) {
            console.error('❌ Delete error:', error);
            this.showError('Delete failed: ' + error.message);
            this.logSecurity(`Delete failed: ${normalizedPath} - ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    downloadCurrent() {
        this.downloadFile(this.currentPath, true);
    }

    displayFiles(files) {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';

        if (files.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    ${this.isSearching ? 'No files found' : 'Directory is empty'}
                </td>
            `;
            fileList.appendChild(row);
            return;
        }

        files.forEach(file => {
            const row = document.createElement('tr');
            const normalizedPath = this.normalizePath(file.path);

            // ADMIN CONTROLS: Check permissions for this specific file/folder
            const canRead = this.hasPermission(normalizedPath, 'read');
            const canDownload = this.hasPermission(normalizedPath, 'download');
            const canDelete = this.hasPermission(normalizedPath, 'delete');
            const currentPerms = this.getFolderPermissions(normalizedPath);

            row.className = file.is_directory ? 'directory' : 'file';
            row.dataset.path = normalizedPath;

            if (!canRead) {
                row.classList.add('no-permission');
            }

            // Directory click handler - only if admin allows
            if (file.is_directory && canRead) {
                row.onclick = () => this.loadDirectory(normalizedPath);
                row.style.cursor = 'pointer';
            } else {
                row.style.cursor = 'default';
            }

            // Permission badges showing ADMIN'S restrictions
            const adminReadBadge = currentPerms.read ? 'can-read' : 'no-read';
            const adminDownloadBadge = currentPerms.download ? 'can-download' : 'no-download';
            const adminDeleteBadge = currentPerms.delete ? 'can-delete' : 'no-delete';

            // Action buttons - only show what admin allows
            let actionButtons = '';
            if (canRead) {
                if (canDownload && !file.is_directory) {
                    actionButtons += `
                        <button class="action-btn download-btn" onclick="event.stopPropagation(); fileBrowser.downloadFile('${this.escapeHtml(normalizedPath)}', false)" title="Download File">
                            ⬇️
                        </button>
                    `;
                }

                if (!file.is_directory) {
                    actionButtons += `
                        <button class="action-btn view-btn" onclick="event.stopPropagation(); fileBrowser.viewFile('${this.escapeHtml(normalizedPath)}')" title="View File">
                            👁️
                        </button>
                    `;
                }

                // Delete button (show for both files and folders)
                if (canDelete) {
                    actionButtons += `
                        <button class="action-btn delete-btn" onclick="event.stopPropagation(); fileBrowser.deleteFile('${this.escapeHtml(normalizedPath)}')" title="Delete">
                            🗑️
                        </button>
                    `;
                }

                // Permission management button for directories
                if (file.is_directory) {
                    actionButtons += `
                        <button class="action-btn permission-btn" onclick="event.stopPropagation(); openPermissionPanel('${this.escapeHtml(normalizedPath)}')" title="Manage Permissions">
                            🛡️
                        </button>
                    `;
                }
            }

            row.innerHTML = `
                <td>
                    <span class="file-icon">${file.is_directory ? '📁' : '📄'}</span>
                    ${file.name}
                    ${!canRead ? '<span class="restricted-badge">🚫</span>' : ''}
                </td>
                <td>${file.file_type}</td>
                <td>${file.is_directory ? '-' : this.formatFileSize(file.size)}</td>
                <td>${file.modified}</td>
                <td>
                    <span class="permission-badge ${adminReadBadge}" title="Admin Read Permission">R</span>
                    <span class="permission-badge ${adminDownloadBadge}" title="Admin Download Permission">D</span>
                    <span class="permission-badge ${adminDeleteBadge}" title="Admin Delete Permission">X</span>
                    <span class="permission-badge ${file.can_read ? 'can-read' : 'no-read'}" title="OS Read Permission">OS:R</span>
                    <span class="permission-badge ${file.can_write ? 'can-write' : 'no-write'}" title="OS Write Permission">OS:W</span>
                </td>
                <td class="action-buttons">
                    ${actionButtons}
                </td>
            `;

            fileList.appendChild(row);
        });
    }

    viewFile(filePath) {
        const normalizedPath = this.normalizePath(filePath);

        if (!this.hasPermission(normalizedPath, 'read')) {
            this.showError('Admin has restricted access to this file');
            return;
        }

        this.logSecurity(`File view requested: ${normalizedPath}`, 'info');

        // Get file extension
        const extension = normalizedPath.split('.').pop().toLowerCase();
        const fileName = normalizedPath.split('/').pop();

        // Show appropriate viewer based on file type
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
            this.showImageModal(normalizedPath, fileName);
        } else if (extension === 'pdf') {
            this.showPdfModal(normalizedPath, fileName);
        } else if (['txt', 'html', 'css', 'js', 'json', 'xml', 'csv', 'md'].includes(extension)) {
            this.showTextModal(normalizedPath, fileName);
        } else {
            // For other file types, offer download
            if (confirm(`Cannot preview ${extension.toUpperCase()} files.\nWould you like to download it instead?`)) {
                this.downloadFile(normalizedPath, false);
            }
        }
    }

    // Modal methods
    showImageModal(filePath, fileName) {
        this.showModal(`
            <div class="modal-header">
                <h3>🖼️ ${fileName}</h3>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <img src="/api/download?agentUrl=${encodeURIComponent(this.agentUrl)}&path=${encodeURIComponent(filePath)}"
                     alt="${fileName}"
                     style="max-width: 100%; max-height: 70vh; display: block; margin: 0 auto;"
                     onerror="this.style.display='none'; document.getElementById('imageError').style.display='block'">
                <div id="imageError" style="display: none; padding: 20px; text-align: center; color: #e74c3c;">
                    ❌ Could not load image.<br>
                    <button onclick="fileBrowser.downloadFile('${this.escapeHtml(filePath)}', false)" class="action-btn">Download Instead</button>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="fileBrowser.downloadFile('${this.escapeHtml(filePath)}', false)" class="btn-primary">📥 Download</button>
                <button onclick="closeModal()" class="btn-secondary">Close</button>
            </div>
        `, 'image-modal');
    }

    showPdfModal(filePath, fileName) {
        this.showModal(`
            <div class="modal-header">
                <h3>📄 ${fileName}</h3>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body" style="height: 70vh;">
                <iframe src="/api/download?agentUrl=${encodeURIComponent(this.agentUrl)}&path=${encodeURIComponent(filePath)}"
                        style="width: 100%; height: 100%; border: none;"
                        onerror="document.getElementById('pdfError').style.display='block'">
                </iframe>
                <div id="pdfError" style="display: none; padding: 20px; text-align: center; color: #e74c3c;">
                    ❌ Could not load PDF.<br>
                    <button onclick="fileBrowser.downloadFile('${this.escapeHtml(filePath)}', false)" class="action-btn">Download Instead</button>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="fileBrowser.downloadFile('${this.escapeHtml(filePath)}', false)" class="btn-primary">📥 Download</button>
                <button onclick="closeModal()" class="btn-secondary">Close</button>
            </div>
        `, 'pdf-modal');
    }

    showTextModal(filePath, fileName) {
        // We'll download and display the text content
        this.downloadFile(filePath, false).then(() => {
            // After download, we can't directly read the file due to security restrictions
            // So we'll show a message instead
            this.showModal(`
                <div class="modal-header">
                    <h3>📝 ${fileName}</h3>
                    <button class="close-btn" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Text file downloaded. Please open the downloaded file to view its contents.</p>
                    <p>For security reasons, text files are downloaded instead of displayed directly in the browser.</p>
                </div>
                <div class="modal-footer">
                    <button onclick="closeModal()" class="btn-secondary">Close</button>
                </div>
            `, 'text-modal');
        });
    }

    showModal(content, className = '') {
        const modal = document.createElement('div');
        modal.className = `modal ${className}`;
        modal.innerHTML = `
            <div class="modal-content">
                ${content}
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Utility methods (formatFileSize, updateBreadcrumb, goUp, refresh, setConnectionStatus, showError, showLoading, escapeHtml, logSecurity)
    // ... keep all your existing utility methods the same ...

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateBreadcrumb(searchText = '') {
        const breadcrumb = document.getElementById('currentPath');
        if (searchText) {
            breadcrumb.textContent = searchText;
        } else {
            breadcrumb.textContent = this.currentPath;
        }
    }

    goUp() {
        if (this.currentPath === '/' || this.currentPath === '\\') {
            return;
        }

        const pathParts = this.normalizePath(this.currentPath).split('/').filter(part => part && part !== ':');
        if (pathParts.length > 0) {
            pathParts.pop();
            const newPath = pathParts.length === 0 ? '/' : '/' + pathParts.join('/');
            this.loadDirectory(newPath);
        }
    }

    refresh() {
        this.loadDirectory(this.currentPath);
    }

    setConnectionStatus(connected) {
        this.isConnected = connected;
        const statusElement = document.getElementById('connectionStatus');
        if (connected) {
            statusElement.textContent = 'Connected';
            statusElement.className = 'status connected';
        } else {
            statusElement.textContent = 'Disconnected';
            statusElement.className = 'status disconnected';
        }
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        if (message) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        } else {
            errorElement.classList.add('hidden');
        }
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (show) {
            loadingElement.classList.remove('hidden');
        } else {
            loadingElement.classList.add('hidden');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    logSecurity(message, type = 'info') {
        const logContainer = document.getElementById('securityLog');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

// Global modal function
function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Permission Panel Functions
let currentEditingPath = '';

function openPermissionPanel(path) {
    currentEditingPath = path;
    const panel = document.getElementById('permissionPanel');
    const pathSpan = document.getElementById('currentPermissionPath');

    pathSpan.textContent = path;

    // Load current permissions
    const currentPerms = fileBrowser.getFolderPermissions(path);
    document.getElementById('permReadFolder').checked = currentPerms.read;
    document.getElementById('permWriteFolder').checked = currentPerms.write;
    document.getElementById('permDownloadFolder').checked = currentPerms.download;
    document.getElementById('permExecuteFolder').checked = currentPerms.execute;
    document.getElementById('permSearchFolder').checked = currentPerms.search;
    document.getElementById('permDeleteFolder').checked = currentPerms.delete;

    panel.classList.remove('hidden');
}

function closePermissionPanel() {
    document.getElementById('permissionPanel').classList.add('hidden');
    currentEditingPath = '';
}

function applyFolderPermissions() {
    if (!currentEditingPath) return;

    const newPerms = {
        read: document.getElementById('permReadFolder').checked,
        write: document.getElementById('permWriteFolder').checked,
        download: document.getElementById('permDownloadFolder').checked,
        execute: document.getElementById('permExecuteFolder').checked,
        search: document.getElementById('permSearchFolder').checked,
        delete: document.getElementById('permDeleteFolder').checked
    };

    fileBrowser.setFolderPermissions(currentEditingPath, newPerms);
    closePermissionPanel();
}

function resetFolderPermissions() {
    if (!currentEditingPath) return;
    fileBrowser.setFolderPermissions(currentEditingPath, { ...fileBrowser.defaultPermissions });
    closePermissionPanel();
}

// Context Menu
document.addEventListener('contextmenu', function(e) {
    const row = e.target.closest('tr');
    if (row && row.classList.contains('directory')) {
        e.preventDefault();
        showContextMenu(e.pageX, e.pageY, row);
    }
});

function showContextMenu(x, y, row) {
    // Remove existing context menu
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        document.body.removeChild(existingMenu);
    }

    const path = row.dataset.path;
    if (!path) return;

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    const currentPerms = fileBrowser.getFolderPermissions(path);
    const isRestricted = !currentPerms.read || !currentPerms.download;

    menu.innerHTML = `
        <div class="menu-item" onclick="openPermissionPanel('${path}')">🛡️ Manage Permissions</div>
        <div class="menu-item" onclick="fileBrowser.setFolderPermissions('${path}', {read: true, download: true, search: true, delete: true})">✅ Allow Full Access</div>
        <div class="menu-item" onclick="fileBrowser.setFolderPermissions('${path}', {read: false, download: false, delete: false})">❌ Block Completely</div>
        <div class="menu-divider"></div>
        <div class="menu-item" onclick="fileBrowser.loadDirectory('${path}')">📁 Open Directory</div>
        ${currentPerms.delete ? `<div class="menu-item" onclick="fileBrowser.deleteFile('${path}')" style="color: #e74c3c;">🗑️ Delete Folder</div>` : ''}
        ${isRestricted ? `<div class="menu-item" onclick="fileBrowser.setFolderPermissions('${path}', {})">🔓 Remove Restrictions</div>` : ''}
    `;

    document.body.appendChild(menu);

    // Close menu when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            if (document.body.contains(menu)) {
                document.body.removeChild(menu);
            }
            document.removeEventListener('click', closeMenu);
        });
    }, 100);
}

// Global functions
const fileBrowser = new FileBrowser();

function connectAgent() {
    fileBrowser.connectAgent();
}

function refresh() {
    fileBrowser.refresh();
}

function goUp() {
    fileBrowser.goUp();
}

function navigateTo(path) {
    fileBrowser.loadDirectory(path);
}

function searchFiles() {
    fileBrowser.searchFiles();
}

function downloadCurrent() {
    fileBrowser.downloadCurrent();
}

// Handle Enter key in search input
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchFiles();
    }
});

// Close permission panel when clicking outside
document.addEventListener('click', function(e) {
    const panel = document.getElementById('permissionPanel');
    if (!panel.classList.contains('hidden') && !panel.contains(e.target)) {
        closePermissionPanel();
    }
});

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});
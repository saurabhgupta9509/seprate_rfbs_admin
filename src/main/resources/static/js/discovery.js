// Handle agent discovery and connection status
class DiscoveryManager {
    constructor() {
        this.connectionStatus = 'online';
        this.autoRefresh = true;
    }

    startConnectionMonitoring() {
        setInterval(() => this.checkConnection(), 10000);
    }
    
    async checkConnection() {
        try {
            await fetch('/api/health');
            this.setConnectionStatus('online');
        } catch {
            this.setConnectionStatus('offline');
        }
    }
}
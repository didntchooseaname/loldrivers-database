class LOLDriversApp {
    constructor() {
        this.drivers = [];
        this.filteredDrivers = [];
        this.currentDate = new Date(); // Use current actual date
        this.dataUrl = 'data/drv.json';
        this.lastFetch = null;
        this.renderingInProgress = false; // Éviter les re-rendus multiples
        
        this.initializeElements();
        this.bindEvents();
        this.loadData();
        
        // Simulate weekly updates
        this.setupWeeklyUpdates();
    }
    
    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearch');
        this.driversGrid = document.getElementById('driversGrid');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.retryButton = document.getElementById('retryButton');
        this.resultsCount = document.getElementById('resultsCount');
        this.lastUpdated = document.getElementById('lastUpdated');
        this.totalDrivers = document.getElementById('totalDrivers');
        this.hvciTrueCount = document.getElementById('hvciTrueCount');
        this.killerDriversCount = document.getElementById('killerDriversCount');
        this.hvciStatItem = document.getElementById('hvciStatItem');
        this.killerStatItem = document.getElementById('killerStatItem');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.themeToggle = document.getElementById('themeToggle');
        
        // Track current filter state
        this.activeFilters = new Set(); // Use Set to track multiple active filters
        
        // Initialize theme
        this.initializeTheme();
    }
    
    bindEvents() {
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        this.retryButton.addEventListener('click', () => this.loadData());
        
        // Add stat item click handlers
        this.hvciStatItem.addEventListener('click', () => this.toggleFilter('hvci'));
        this.killerStatItem.addEventListener('click', () => this.toggleFilter('killer'));
        
        // Add theme toggle handler
        this.themeToggle.addEventListener('click', (e) => this.toggleTheme(e));
        
        // Add filter button click handlers
        this.filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const filterType = e.target.getAttribute('data-filter');
                if (filterType === 'clear') {
                    this.clearAllFilters();
                } else {
                    this.toggleFilter(filterType);
                }
            });
        });
    }
    
    setupWeeklyUpdates() {
        // Check for updates every hour (simulate weekly check)
        setInterval(() => {
            const now = new Date();
            if (this.lastFetch && (now - this.lastFetch) > 7 * 24 * 60 * 60 * 1000) {
                this.loadData();
            }
        }, 60 * 60 * 1000);
    }
    
    async loadData() {
        this.showLoading();
        this.hideError();
        
        try {
            console.log('Fetching data from:', this.dataUrl);
            
            // Try different methods to load the data
            let response;
            let data;
            
            // Method 1: Try standard fetch
            try {
                response = await fetch(this.dataUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                data = await response.json();
                console.log('Data loaded successfully via fetch:', data);
                
            } catch (fetchError) {
                console.warn('Fetch failed, trying alternative method:', fetchError.message);
                
                // Method 2: Try XMLHttpRequest for local files
                data = await this.loadDataViaXHR();
                console.log('Data loaded successfully via XHR:', data);
            }
            
            // Handle different possible response formats
            let driversArray = [];
            if (Array.isArray(data)) {
                driversArray = data;
            } else if (data && typeof data === 'object') {
                // If it's an object, look for arrays in common property names
                driversArray = data.drivers || data.data || data.items || Object.values(data);
                if (!Array.isArray(driversArray)) {
                    driversArray = [data];
                }
            }
            
            console.log('Processed drivers array:', driversArray.length, 'items');
            
            // Process drivers to handle the KnownVulnerableSamples structure
            this.drivers = driversArray
                .filter(item => item && typeof item === 'object')
                .flatMap(driver => {
                    // If this driver has KnownVulnerableSamples, create entries for each sample
                    if (driver.KnownVulnerableSamples && Array.isArray(driver.KnownVulnerableSamples)) {
                        return driver.KnownVulnerableSamples.map(sample => ({
                            ...sample,
                            // Add metadata from the parent driver
                            DriverId: driver.Id,
                            Tags: driver.Tags,
                            Verified: driver.Verified,
                            Author: driver.Author,
                            Created: driver.Created,
                            MitreID: driver.MitreID,
                            CVE: driver.CVE,
                            Category: driver.Category,
                            Commands: driver.Commands,
                            Resources: driver.Resources
                        }));
                    }
                    // If no samples, return the driver as-is (fallback)
                    return [driver];
                });
            this.filteredDrivers = [...this.drivers];
            this.lastFetch = new Date();
            
            this.updateLastUpdatedTime();
            this.updateStatistics();
            this.renderDrivers();
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading drivers data:', error);
            
            // Load sample data as fallback
            this.loadSampleData();
            this.showError(`Data file unavailable. Showing sample data. Error: ${error.message}

💡 Pour charger vos données réelles:
1. Démarrez un serveur local: python -m http.server 8000
2. Ou ouvrez via: http://localhost:8000
3. Ou utilisez Live Server dans VS Code`);
            this.hideLoading();
        }
    }
    
    // Alternative method to load data using XMLHttpRequest
    loadDataViaXHR() {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', this.dataUrl, true);
            xhr.responseType = 'json';
            
            xhr.onload = function() {
                if (xhr.status === 200 || xhr.status === 0) { // 0 for local files
                    resolve(xhr.response || JSON.parse(xhr.responseText));
                } else {
                    reject(new Error(`XHR error! status: ${xhr.status}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('XHR network error'));
            };
            
            try {
                xhr.send();
            } catch (e) {
                reject(e);
            }
        });
    }
    
    loadSampleData() {
        // Sample data based on the provided structure
        this.drivers = [
            {
                "Authentihash": {
                    "MD5": "151f2aa65417bbb3563e02d1f60484dc",
                    "SHA1": "970bd6388867c86b786d4e218d1a6967d7304ee4",
                    "SHA256": "9d61963c098b07fa7ee6dba40f476fc5d2f16301d79a3e8554319d66c69404a9"
                },
                "Company": "Razer, Inc.",
                "Description": "Razer Overlay Support",
                "OriginalFilename": "Rzpnk.sys",
                "ImportedFunctions": [
                    "IofCompleteRequest",
                    "ObfDereferenceObject",
                    "ZwTerminateProcess",
                    "PsSetCreateProcessNotifyRoutine",
                    "MmGetSystemRoutineAddress",
                    "KeStackAttachProcess"
                ],
                "LoadsDespiteHVCI": "FALSE",
                "MD5": "f758e7d53184faab5bc51f751937fa36",
                "SHA1": "7e900b0370a1d3cb8a3ea5394d7d094f95ec5dc0",
                "SHA256": "d59cc3765a2a9fa510273dded5a9f9ac5190f1edf24a00ffd6a1bbd1cb34c757",
                "Signatures": [
                    {
                        "Certificates": [
                            {
                                "ValidFrom": "2016-02-10 00:00:00",
                                "ValidTo": "2019-02-07 23:59:59"
                            }
                        ]
                    }
                ]
            },
            {
                "Company": "Microsoft Corporation",
                "Description": "Windows Driver Framework",
                "OriginalFilename": "WinDriver.sys",
                "ImportedFunctions": [
                    "IoCreateDevice",
                    "IoDeleteDevice",
                    "KeInitializeEvent",
                    "ExAllocatePoolWithTag"
                ],
                "LoadsDespiteHVCI": "TRUE",
                "MD5": "a1b2c3d4e5f6789012345678901234ab",
                "SHA1": "abc123def456789012345678901234567890abcd",
                "SHA256": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
                "Signatures": [
                    {
                        "Certificates": [
                            {
                                "ValidFrom": "2020-01-01 00:00:00",
                                "ValidTo": "2026-12-31 23:59:59"
                            }
                        ]
                    }
                ]
            },
            {
                "Company": "Vulnerable Corp",
                "Description": "Potentially dangerous driver",
                "OriginalFilename": "BadDriver.sys",
                "ImportedFunctions": [
                    "ZwTerminateProcess",
                    "ZwKillProcess",
                    "NtTerminateProcess",
                    "PsTerminateSystemThread"
                ],
                "LoadsDespiteHVCI": "FALSE",
                "MD5": "deadbeefcafebabe1234567890abcdef",
                "SHA1": "deadbeefcafebabe1234567890abcdef12345678",
                "SHA256": "deadbeefcafebabe1234567890abcdef1234567890abcdef1234567890abcdef",
                "Signatures": []
            }
        ];
        
        this.filteredDrivers = [...this.drivers];
        this.lastFetch = new Date();
        this.updateLastUpdatedTime();
        this.updateStatistics();
        this.renderDrivers();
    }
    
    showLoading() {
        this.loadingIndicator.classList.remove('hidden');
        this.driversGrid.style.display = 'none';
        this.errorMessage.classList.add('hidden');
    }
    
    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
        this.driversGrid.style.display = 'grid';
    }
    
    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
    }
    
    hideError() {
        this.errorMessage.classList.add('hidden');
    }
    
    updateLastUpdatedTime() {
        if (this.lastFetch) {
            this.lastUpdated.textContent = this.lastFetch.toLocaleString();
        }
    }
    
    updateStatistics() {
        // Update total drivers count
        this.totalDrivers.textContent = this.drivers.length;
        
        // Count HVCI compatible drivers (LoadsDespiteHVCI === "TRUE")
        const hvciCompatible = this.drivers.filter(driver => 
            driver.LoadsDespiteHVCI && 
            driver.LoadsDespiteHVCI.toString().toUpperCase() === 'TRUE'
        ).length;
        
        // Count killer drivers (those with dangerous imported functions)
        const killerDrivers = this.drivers.filter(driver => {
            if (driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions)) {
                return driver.ImportedFunctions.some(func => 
                    func.toLowerCase().includes('zwterminateprocess') ||
                    func.toLowerCase().includes('zwkillprocess') ||
                    func.toLowerCase().includes('ntterminate')
                );
            }
            return false;
        }).length;
        
        this.hvciTrueCount.textContent = hvciCompatible;
        this.killerDriversCount.textContent = killerDrivers;
    }
    
    applyCombinedFilters() {
        if (this.activeFilters.size === 0) {
            this.filteredDrivers = [...this.drivers];
            return;
        }
        
        this.filteredDrivers = this.drivers.filter(driver => {
            // Driver must match ALL active filters (AND logic)
            return Array.from(this.activeFilters).every(filterType => {
                return this.matchesFilter(driver, filterType);
            });
        });
    }
    
    matchesFilter(driver, filterType) {
        switch (filterType) {
            case 'hvci':
                return driver.LoadsDespiteHVCI && 
                       driver.LoadsDespiteHVCI.toString().toUpperCase() === 'TRUE';
            
            case 'killer':
                if (driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions)) {
                    return driver.ImportedFunctions.some(func => 
                        func.toLowerCase().includes('zwterminateprocess') ||
                        func.toLowerCase().includes('zwkillprocess') ||
                        func.toLowerCase().includes('ntterminate')
                    );
                }
                return false;
            
            case 'signed':
                return driver.Signatures && Array.isArray(driver.Signatures) && driver.Signatures.length > 0;
            
            case 'unsigned':
                return !driver.Signatures || !Array.isArray(driver.Signatures) || driver.Signatures.length === 0;
            
            case 'recent':
                return this.hasActiveCertificate(driver);
            
            default:
                return true;
        }
    }
    
    updateFilterUI() {
        // Update stat items
        this.clearStatItemActive();
        if (this.activeFilters.has('hvci')) {
            this.hvciStatItem.classList.add('active');
        }
        if (this.activeFilters.has('killer')) {
            this.killerStatItem.classList.add('active');
        }
        
        // Update filter buttons
        this.filterButtons.forEach(button => {
            const filterType = button.getAttribute('data-filter');
            if (filterType && filterType !== 'clear') {
                if (this.activeFilters.has(filterType)) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });
    }
    
    toggleFilter(filterType) {
        // Clear search input when using stat filters
        this.searchInput.value = '';
        
        // Toggle filter in the set
        if (this.activeFilters.has(filterType)) {
            this.activeFilters.delete(filterType);
        } else {
            this.activeFilters.add(filterType);
        }
        
        // Apply combined filters
        this.applyCombinedFilters();
        this.updateFilterUI();
        this.renderDrivers();
    }
    
    clearFilterButtonsActive() {
        this.filterButtons.forEach(button => {
            button.classList.remove('active');
        });
    }
    
    clearAllFilters() {
        this.searchInput.value = '';
        this.activeFilters.clear();
        this.clearStatItemActive();
        this.clearFilterButtonsActive();
        this.applyCombinedFilters();
        this.renderDrivers();
    }
    
    clearStatItemActive() {
        this.hvciStatItem.classList.remove('active');
        this.killerStatItem.classList.remove('active');
    }
    
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        // Start with filtered drivers (which already have active filters applied)
        this.applyCombinedFilters();
        let baseDrivers = this.filteredDrivers;
        
        if (!searchTerm) {
            // If no search term, keep the filtered drivers as they are
            this.renderDrivers();
            return;
        }
        
        // Apply search to the already filtered drivers
        this.filteredDrivers = baseDrivers.filter(driver => 
            this.searchInDriver(driver, searchTerm)
        );
        
        this.renderDrivers();
    }
    
    searchInDriver(driver, searchTerm) {
        // Search in basic fields
        const basicFields = [
            driver.OriginalFilename || driver.Filename,
            driver.Company,
            driver.Description,
            driver.MD5,
            driver.SHA1,
            driver.SHA256,
            driver.FileVersion,
            driver.Copyright
        ];
        
        // Search in Authentihash
        if (driver.Authentihash) {
            basicFields.push(
                driver.Authentihash.MD5,
                driver.Authentihash.SHA1,
                driver.Authentihash.SHA256
            );
        }
        
        // Search in metadata fields
        if (driver.Tags && Array.isArray(driver.Tags)) {
            basicFields.push(...driver.Tags);
        }
        
        if (driver.CVE && Array.isArray(driver.CVE)) {
            basicFields.push(...driver.CVE);
        }
        
        basicFields.push(
            driver.Category,
            driver.Author,
            driver.MitreID,
            driver.Verified
        );
        
        // Check basic fields
        if (basicFields.some(field => 
            field && field.toString().toLowerCase().includes(searchTerm)
        )) {
            return true;
        }
        
        // Search in ImportedFunctions
        if (driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions)) {
            if (driver.ImportedFunctions.some(func => 
                func.toLowerCase().includes(searchTerm)
            )) {
                return true;
            }
        }
        
        // Search in LoadsDespiteHVCI
        if (driver.LoadsDespiteHVCI && 
            driver.LoadsDespiteHVCI.toLowerCase().includes(searchTerm)) {
            return true;
        }
        
        // Search in Commands
        if (driver.Commands) {
            const commandFields = [
                driver.Commands.Command,
                driver.Commands.Description,
                driver.Commands.OperatingSystem,
                driver.Commands.Privileges,
                driver.Commands.Usecase
            ];
            if (commandFields.some(field => 
                field && field.toString().toLowerCase().includes(searchTerm)
            )) {
                return true;
            }
        }
        
        return false;
    }
    
    clearSearch() {
        this.clearAllFilters();
    }
    
    renderDrivers() {
        this.resultsCount.textContent = this.filteredDrivers.length;
        
        if (this.filteredDrivers.length === 0) {
            this.driversGrid.innerHTML = `
                <div class="empty-state">
                    <h3>No drivers found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
            return;
        }
        
        // Éviter les re-rendus multiples
        if (this.renderingInProgress) {
            return;
        }
        this.renderingInProgress = true;
        
        // Rendu simple sans gestion complexe d'animations
        this.driversGrid.innerHTML = this.filteredDrivers
            .map(driver => this.createDriverCard(driver))
            .join('');
        
        // Bind collapsible events après le rendu
        setTimeout(() => {
            this.bindCollapsibleEvents();
            this.renderingInProgress = false;
        }, 100);
    }
    
    createDriverCard(driver) {
        const hashes = this.getHashes(driver);
        const statusTags = this.generateStatusTags(driver);
        const filename = driver.OriginalFilename || driver.Filename || 'Unknown Driver';
        
        return `
            <div class="driver-card">
                <div class="driver-header">
                    <h3 class="driver-title">${this.escapeHtml(filename)}</h3>
                    ${this.renderHashTags(hashes)}
                    ${this.renderStatusTags(statusTags)}
                </div>
                
                ${this.renderCollapsibleSection('Company', driver.Company || 'Unknown')}
                ${this.renderCollapsibleSection('Description', driver.Description || 'No description available')}
                ${driver.Category ? this.renderCollapsibleSection('Category', driver.Category) : ''}
                ${driver.Author ? this.renderCollapsibleSection('Author', driver.Author) : ''}
                ${driver.MitreID ? this.renderCollapsibleSection('MITRE ID', driver.MitreID) : ''}
                ${this.renderCommandsSection(driver.Commands)}
                ${this.renderImportedFunctionsSection(driver.ImportedFunctions)}
            </div>
        `;
    }
    
    getHashes(driver) {
        const hashes = {
            MD5: driver.MD5 || (driver.Authentihash && driver.Authentihash.MD5),
            SHA1: driver.SHA1 || (driver.Authentihash && driver.Authentihash.SHA1),
            SHA256: driver.SHA256 || (driver.Authentihash && driver.Authentihash.SHA256)
        };
        return hashes;
    }
    
    renderHashTags(hashes) {
        const tags = [];
        
        if (hashes.MD5) {
            tags.push(`<span class="hash-tag md5">MD5: ${hashes.MD5}</span>`);
        }
        if (hashes.SHA1) {
            tags.push(`<span class="hash-tag sha1">SHA1: ${hashes.SHA1}</span>`);
        }
        if (hashes.SHA256) {
            tags.push(`<span class="hash-tag sha256">SHA256: ${hashes.SHA256}</span>`);
        }
        
        if (tags.length === 0) {
            tags.push('<span class="hash-tag">No hashes available</span>');
        }
        
        return `<div class="hash-tags">${tags.join('')}</div>`;
    }
    
    generateStatusTags(driver) {
        const tags = [];
        
        // LoadsDespiteHVCI tag
        if (driver.LoadsDespiteHVCI) {
            const isTrue = driver.LoadsDespiteHVCI.toString().toUpperCase() === 'TRUE';
            tags.push({
                text: `HVCI: ${driver.LoadsDespiteHVCI}`,
                type: isTrue ? 'success' : 'danger'
            });
        }
        
        // Killer tag - check for ZwTerminateProcess in ImportedFunctions
        if (driver.ImportedFunctions && Array.isArray(driver.ImportedFunctions)) {
            const hasKillerFunction = driver.ImportedFunctions.some(func => 
                func.toLowerCase().includes('zwterminateprocess') ||
                func.toLowerCase().includes('zwkillprocess') ||
                func.toLowerCase().includes('ntterminate')
            );
            if (hasKillerFunction) {
                tags.push({
                    text: 'KILLER',
                    type: 'danger'
                });
            }
        }
        
        // Active certificate tag
        if (this.hasActiveCertificate(driver)) {
            tags.push({
                text: 'ACTIVE CERTIFICATE',
                type: 'success'
            });
        }
        
        return tags;
    }
    
    hasActiveCertificate(driver) {
        if (!driver.Signatures || !Array.isArray(driver.Signatures)) {
            return false;
        }
        
        for (const signature of driver.Signatures) {
            if (signature.Certificates && Array.isArray(signature.Certificates)) {
                for (const cert of signature.Certificates) {
                    if (cert.ValidTo) {
                        const validToDate = new Date(cert.ValidTo);
                        if (validToDate > this.currentDate) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    renderStatusTags(tags) {
        if (!tags.length) return '';
        
        const tagElements = tags.map(tag => 
            `<span class="status-tag ${tag.type}">${tag.text}</span>`
        ).join('');
        
        return `<div class="status-tags">${tagElements}</div>`;
    }
    
    renderCollapsibleSection(title, content) {
        if (!content) return '';
        
        const sectionId = `section-${Math.random().toString(36).substr(2, 9)}`;
        
        return `
            <div class="collapsible-section expanded" data-section-id="${sectionId}">
                <div class="collapsible-header">
                    <span class="collapsible-title">${title}</span>
                    <span class="collapsible-icon">▼</span>
                </div>
                <div class="collapsible-content">
                    <div class="collapsible-inner">
                        <div class="field-content">${this.escapeHtml(content)}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderImportedFunctionsSection(functions) {
        if (!functions || !Array.isArray(functions) || functions.length === 0) {
            return `
                <div class="collapsible-section expanded">
                    <div class="collapsible-header">
                        <span class="collapsible-title">Imported Functions (0)</span>
                        <span class="collapsible-icon">▼</span>
                    </div>
                    <div class="collapsible-content">
                        <div class="collapsible-inner">
                            <div class="field-content">No imported functions available</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        const sectionId = `functions-${Math.random().toString(36).substr(2, 9)}`;
        const functionsList = functions.map(func => {
            const isDangerous = func.toLowerCase().includes('zwterminateprocess') ||
                              func.toLowerCase().includes('zwkillprocess') ||
                              func.toLowerCase().includes('ntterminate');
            
            return `<li class="function-item ${isDangerous ? 'dangerous' : ''}">${this.escapeHtml(func)}</li>`;
        }).join('');
        
        return `
            <div class="collapsible-section expanded" data-section-id="${sectionId}">
                <div class="collapsible-header">
                    <span class="collapsible-title">Imported Functions (${functions.length})</span>
                    <span class="collapsible-icon">▼</span>
                </div>
                <div class="collapsible-content">
                    <div class="collapsible-inner">
                        <ul class="functions-list functions-scrollable">${functionsList}</ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderCommandsSection(commands) {
        if (!commands || typeof commands !== 'object') {
            return '';
        }
        
        const sectionId = `commands-${Math.random().toString(36).substr(2, 9)}`;
        let commandContent = '';
        
        if (commands.Description) {
            commandContent += `<div class="command-field"><strong>Description:</strong> ${this.escapeHtml(commands.Description)}</div>`;
        }
        if (commands.OperatingSystem) {
            commandContent += `<div class="command-field"><strong>OS:</strong> ${this.escapeHtml(commands.OperatingSystem)}</div>`;
        }
        if (commands.Privileges) {
            commandContent += `<div class="command-field"><strong>Privileges:</strong> ${this.escapeHtml(commands.Privileges)}</div>`;
        }
        if (commands.Usecase) {
            commandContent += `<div class="command-field"><strong>Use case:</strong> ${this.escapeHtml(commands.Usecase)}</div>`;
        }
        if (commands.Command && commands.Command.trim()) {
            commandContent += `<div class="command-field"><strong>Command:</strong> <code>${this.escapeHtml(commands.Command)}</code></div>`;
        }
        
        if (!commandContent) {
            return '';
        }
        
        return `
            <div class="collapsible-section" data-section-id="${sectionId}">
                <div class="collapsible-header">
                    <span class="collapsible-title">Commands & Usage</span>
                    <span class="collapsible-icon">▼</span>
                </div>
                <div class="collapsible-content">
                    <div class="collapsible-inner">
                        ${commandContent}
                    </div>
                </div>
            </div>
        `;
    }
    
    bindCollapsibleEvents() {
        const headers = document.querySelectorAll('.collapsible-header');
        headers.forEach(header => {
            // Remove existing event listeners to prevent duplicates
            header.replaceWith(header.cloneNode(true));
        });
        
        // Re-query after replacing elements
        const newHeaders = document.querySelectorAll('.collapsible-header');
        newHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                const section = header.parentElement;
                section.classList.toggle('expanded');
            });
        });
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text.toString();
        return div.innerHTML;
    }
    
    // Theme management methods
    initializeTheme() {
        // Get saved theme or default to system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        this.currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.applyTheme(this.currentTheme, false);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(this.currentTheme);
            }
        });
    }
    
    toggleTheme(event) {
        // Toggle theme
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        
        // Save preference
        localStorage.setItem('theme', this.currentTheme);
    }
    
    applyTheme(theme) {
        // Apply theme immediately
        document.documentElement.setAttribute('data-color-scheme', theme);
        this.updateThemeToggleState(theme);
    }
    
    updateThemeToggleState(theme) {
        const track = this.themeToggle.querySelector('.theme-toggle-track');
        const thumb = this.themeToggle.querySelector('.theme-toggle-thumb');
        
        if (theme === 'dark') {
            track.setAttribute('aria-label', 'Switch to light mode');
            this.themeToggle.setAttribute('aria-label', 'Switch to light mode');
        } else {
            track.setAttribute('aria-label', 'Switch to dark mode');
            this.themeToggle.setAttribute('aria-label', 'Switch to dark mode');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LOLDriversApp();
});
// Morning Timer Application
class MorningTimer {
    constructor() {
        this.config = this.loadConfig();
        this.currentTime = new Date();
        this.isActive = false;
        this.currentInterval = null;
        this.lastTriggered = -1;
        this.clockInterval = null;
        this.tts = null;
        this.audio = null;
        this.flickerTimeout = null;
        this.flickerOverlay = null;
        
        this.init();
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.loadVoices();
        this.startClock();
        this.renderIntervals();
        this.updateDisplay();
    }

    // Load configuration from localStorage or use defaults
    loadConfig() {
        const defaultConfig = {
            timerSettings: {
                startTime: "07:00",
                endTime: "07:43",
                activeDays: [1, 2, 3, 4, 5], // Monday-Friday
                totalDuration: 43
            },
            intervals: [
                {
                    id: 1,
                    minute: 0,
                    duration: 5,
                    color: "#FF6B6B",
                    instruction: "It is time to wake up wake up now! Rise and shine and have an amazing day",
                    audio: "wake_up_routine.mp3",
                    enabled: true
                },
                {
                    id: 2,
                    minute: 5,
                    duration: 5,
                    color: "#FF4757",
                    instruction: "Time to change your clothes!",
                    audio: "ambulance_siren.mp3",
                    enabled: true
                },
                {
                    id: 3,
                    minute: 10,
                    duration: 5,
                    color: "#FFA502",
                    instruction: "Time to pee and go eat!",
                    audio: "big_announcement_bells.mp3",
                    enabled: true
                },
                {
                    id: 4,
                    minute: 15,
                    duration: 20,
                    color: "#2ED573",
                    instruction: "EAT YOUR FOOD!",
                    audio: "relaxing_music.mp3",
                    enabled: true
                },
                {
                    id: 5,
                    minute: 35,
                    duration: 0,
                    color: "#3742FA",
                    instruction: "Time to brush and get ready for school, 8 minutes left!",
                    audio: "final_reminder.mp3",
                    enabled: true
                }
            ],
            ttsSettings: {
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
                voice: "default"
            },
            audioSettings: {
                volume: 0.8,
                fadeIn: 200,
                fadeOut: 200
            }
        };

        const stored = localStorage.getItem('morning-timer-config');
        return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
    }

    // Save configuration to localStorage
    saveConfig() {
        localStorage.setItem('morning-timer-config', JSON.stringify(this.config));
    }

    // Setup event listeners
    setupEventListeners() {
        // Settings panel toggle
        document.getElementById('settings-toggle').addEventListener('click', () => {
            this.toggleSettings();
        });

        document.getElementById('close-settings').addEventListener('click', () => {
            this.toggleSettings();
        });

        // Timer settings
        document.getElementById('start-time').addEventListener('change', (e) => {
            this.config.timerSettings.startTime = e.target.value;
            this.saveConfig();
        });

        document.getElementById('end-time').addEventListener('change', (e) => {
            this.config.timerSettings.endTime = e.target.value;
            this.saveConfig();
        });

        // Active days checkboxes
        document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.config.timerSettings.activeDays = Array.from(
                    document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked')
                ).map(cb => parseInt(cb.value));
                this.saveConfig();
            });
        });

        // TTS settings
        ['tts-rate', 'tts-pitch', 'tts-volume'].forEach(id => {
            const slider = document.getElementById(id);
            const valueSpan = document.getElementById(id + '-value');
            
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueSpan.textContent = value.toFixed(1);
                
                const setting = id.replace('tts-', '');
                this.config.ttsSettings[setting] = value;
                this.saveConfig();
            });
        });

        document.getElementById('tts-voice').addEventListener('change', (e) => {
            this.config.ttsSettings.voice = e.target.value;
            this.saveConfig();
        });

        // Audio settings
        document.getElementById('audio-volume').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('audio-volume-value').textContent = value.toFixed(1);
            this.config.audioSettings.volume = value;
            this.saveConfig();
        });

        ['fade-in', 'fade-out'].forEach(id => {
            document.getElementById(id).addEventListener('change', (e) => {
                const setting = id.replace('-', '');
                this.config.audioSettings[setting] = parseInt(e.target.value);
                this.saveConfig();
            });
        });

        // Configuration actions
        document.getElementById('add-interval').addEventListener('click', () => {
            this.addInterval();
        });

        document.getElementById('export-config').addEventListener('click', () => {
            this.exportConfig();
        });

        document.getElementById('import-config').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importConfig(e.target.files[0]);
        });

        document.getElementById('reset-config').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset to default configuration?')) {
                this.resetConfig();
            }
        });
    }

    // Load available TTS voices
    loadVoices() {
        const voiceSelect = document.getElementById('tts-voice');
        
        // Clear existing options except default
        voiceSelect.innerHTML = '<option value="default">Default</option>';
        
        if ('speechSynthesis' in window) {
            const voices = speechSynthesis.getVoices();
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
        }
    }

    // Start the main clock
    startClock() {
        this.clockInterval = setInterval(() => {
            this.updateTime();
        }, 1000);
    }

    // Update current time and check for intervals
    updateTime() {
        this.currentTime = new Date();
        this.checkActiveState();
        this.checkIntervals();
        this.updateDisplay();
    }

    // Check if timer should be active
    checkActiveState() {
        const now = this.currentTime;
        const dayOfWeek = now.getDay();
        const timeStr = now.toTimeString().slice(0, 5);
        
        const isActiveDay = this.config.timerSettings.activeDays.includes(dayOfWeek);
        const isActiveTime = timeStr >= this.config.timerSettings.startTime && 
                           timeStr <= this.config.timerSettings.endTime;
        
        this.isActive = isActiveDay && isActiveTime;
    }

    // Check for interval triggers
    checkIntervals() {
        if (!this.isActive) return;

        const now = this.currentTime;
        const startTime = new Date(now);
        const [startHour, startMinute] = this.config.timerSettings.startTime.split(':').map(Number);
        startTime.setHours(startHour, startMinute, 0, 0);

        const elapsedMinutes = Math.floor((now - startTime) / (1000 * 60));

        // Validate elapsed minutes
        if (elapsedMinutes < 0 || elapsedMinutes > this.config.timerSettings.totalDuration) {
            return;
        }

        // Find matching interval
        const interval = this.config.intervals.find(i => 
            i.enabled && i.minute === elapsedMinutes && i.id !== this.lastTriggered
        );

        if (interval) {
            this.triggerInterval(interval);
        }
    }

    // Trigger an interval
    async triggerInterval(interval) {
        this.lastTriggered = interval.id;
        this.currentInterval = interval;

        // Start flickering effect for 30 seconds
        this.startFlickering();

        // Update background color
        document.body.style.backgroundColor = interval.color;

        // Play TTS
        await this.playTTS(interval.instruction);

        // Play audio
        await this.playAudio(interval.audio);

        // Update display
        this.updateDisplay();
    }

    // Play text-to-speech
    playTTS(text) {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) {
                console.warn('TTS not supported');
                resolve();
                return;
            }

            // Cancel any existing speech
            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = this.config.ttsSettings.rate;
            utterance.pitch = this.config.ttsSettings.pitch;
            utterance.volume = this.config.ttsSettings.volume;

            if (this.config.ttsSettings.voice !== 'default') {
                const voices = speechSynthesis.getVoices();
                const voice = voices.find(v => v.name === this.config.ttsSettings.voice);
                if (voice) utterance.voice = voice;
            }

            utterance.onend = resolve;
            utterance.onerror = resolve;

            speechSynthesis.speak(utterance);
        });
    }

    // Play audio file
    playAudio(filename) {
        return new Promise((resolve) => {
            if (!filename) {
                resolve();
                return;
            }

            // Stop any existing audio
            if (this.audio) {
                this.audio.pause();
                this.audio.currentTime = 0;
            }

            this.audio = new Audio(`audio/${filename}`);
            this.audio.volume = this.config.audioSettings.volume;

            this.audio.onended = resolve;
            this.audio.onerror = () => {
                console.warn(`Audio file not found: ${filename}`);
                resolve();
            };

            this.audio.play().catch(err => {
                console.warn('Audio playback failed:', err);
                resolve();
            });
        });
    }

    // Update the display
    updateDisplay() {
        const clockElement = document.getElementById('clock');
        const statusElement = document.getElementById('status');
        const intervalElement = document.getElementById('current-interval');

        if (this.isActive) {
            const now = this.currentTime;
            const startTime = new Date(now);
            const [startHour, startMinute] = this.config.timerSettings.startTime.split(':').map(Number);
            startTime.setHours(startHour, startMinute, 0, 0);

            const elapsed = now - startTime;
            const totalDuration = this.config.timerSettings.totalDuration * 60 * 1000;
            const remaining = Math.max(0, totalDuration - elapsed);

            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

            if (hours > 0) {
                clockElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                clockElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }

            statusElement.textContent = 'Active';
            
            if (this.currentInterval) {
                intervalElement.textContent = this.currentInterval.instruction;
            } else {
                intervalElement.textContent = '';
            }
        } else {
            clockElement.textContent = '--:--:--';
            statusElement.textContent = 'Inactive';
            intervalElement.textContent = '';
        }
    }

    // Toggle settings panel
    toggleSettings() {
        const panel = document.getElementById('settings-panel');
        panel.classList.toggle('hidden');
    }

    // Render intervals in settings
    renderIntervals() {
        const container = document.getElementById('intervals-list');
        container.innerHTML = '';

        this.config.intervals.forEach(interval => {
            const item = document.createElement('div');
            item.className = 'interval-item';
            item.innerHTML = `
                <div class="interval-header">
                    <span class="interval-minute">Minute ${interval.minute}</span>
                    <div class="interval-actions">
                        <button class="btn-edit" onclick="app.editInterval(${interval.id})">Edit</button>
                        <button class="btn-delete" onclick="app.deleteInterval(${interval.id})">Delete</button>
                    </div>
                </div>
                <div class="interval-details">
                    <input type="number" placeholder="Minute" value="${interval.minute}" 
                           onchange="app.updateInterval(${interval.id}, 'minute', this.value)">
                    <input type="color" value="${interval.color}" 
                           onchange="app.updateInterval(${interval.id}, 'color', this.value)">
                    <textarea placeholder="Instruction" onchange="app.updateInterval(${interval.id}, 'instruction', this.value)">${interval.instruction}</textarea>
                    <input type="text" placeholder="Audio file" value="${interval.audio}" 
                           onchange="app.updateInterval(${interval.id}, 'audio', this.value)">
                    <label>
                        <input type="checkbox" ${interval.enabled ? 'checked' : ''} 
                               onchange="app.updateInterval(${interval.id}, 'enabled', this.checked)">
                        Enabled
                    </label>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // Add new interval
    addInterval() {
        const newId = this.config.intervals.length > 0 ? 
            Math.max(...this.config.intervals.map(i => i.id)) + 1 : 1;
        
        const newInterval = {
            id: newId,
            minute: 0,
            duration: 5,
            color: "#3498db",
            instruction: "New interval",
            audio: "",
            enabled: true
        };

        this.config.intervals.push(newInterval);
        this.config.intervals.sort((a, b) => a.minute - b.minute);
        this.saveConfig();
        this.renderIntervals();
    }

    // Update interval
    updateInterval(id, field, value) {
        const interval = this.config.intervals.find(i => i.id === id);
        if (interval) {
            if (field === 'minute' || field === 'duration') {
                const numValue = parseInt(value);
                if (isNaN(numValue) || numValue < 0) {
                    console.warn(`Invalid ${field} value: ${value}`);
                    return;
                }
                interval[field] = numValue;
            } else if (field === 'enabled') {
                interval[field] = value;
            } else {
                interval[field] = value;
            }
            this.saveConfig();
            this.renderIntervals();
        }
    }

    // Edit interval (placeholder for future enhancement)
    editInterval(id) {
        // Could open a modal or expand the interval item
        console.log('Edit interval:', id);
    }

    // Delete interval
    deleteInterval(id) {
        if (confirm('Are you sure you want to delete this interval?')) {
            this.config.intervals = this.config.intervals.filter(i => i.id !== id);
            this.saveConfig();
            this.renderIntervals();
        }
    }

    // Export configuration
    exportConfig() {
        const dataStr = JSON.stringify(this.config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'morning-timer-config.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // Import configuration
    importConfig(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedConfig = JSON.parse(e.target.result);
                this.config = { ...this.config, ...importedConfig };
                this.saveConfig();
                this.renderIntervals();
                this.updateSettingsUI();
                alert('Configuration imported successfully!');
            } catch (error) {
                alert('Error importing configuration: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    // Reset configuration to defaults
    resetConfig() {
        localStorage.removeItem('morning-timer-config');
        this.config = this.loadConfig();
        this.renderIntervals();
        this.updateSettingsUI();
        alert('Configuration reset to defaults!');
    }

    // Update settings UI with current config values
    updateSettingsUI() {
        // Timer settings
        document.getElementById('start-time').value = this.config.timerSettings.startTime;
        document.getElementById('end-time').value = this.config.timerSettings.endTime;

        // Active days
        document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = this.config.timerSettings.activeDays.includes(parseInt(checkbox.value));
        });

        // TTS settings
        document.getElementById('tts-rate').value = this.config.ttsSettings.rate;
        document.getElementById('tts-rate-value').textContent = this.config.ttsSettings.rate.toFixed(1);
        document.getElementById('tts-pitch').value = this.config.ttsSettings.pitch;
        document.getElementById('tts-pitch-value').textContent = this.config.ttsSettings.pitch.toFixed(1);
        document.getElementById('tts-volume').value = this.config.ttsSettings.volume;
        document.getElementById('tts-volume-value').textContent = this.config.ttsSettings.volume.toFixed(1);
        document.getElementById('tts-voice').value = this.config.ttsSettings.voice;

        // Audio settings
        document.getElementById('audio-volume').value = this.config.audioSettings.volume;
        document.getElementById('audio-volume-value').textContent = this.config.audioSettings.volume.toFixed(1);
        document.getElementById('fade-in').value = this.config.audioSettings.fadeIn;
        document.getElementById('fade-out').value = this.config.audioSettings.fadeOut;
    }

    // Start the flickering effect for 30 seconds
    startFlickering() {
        // Clear any existing flickering
        this.stopFlickering();

        // Add flickering classes to body and create overlay
        document.body.classList.add('flickering', 'light-flash');
        
        // Create flicker overlay for more dramatic effect
        this.flickerOverlay = document.createElement('div');
        this.flickerOverlay.className = 'flicker-overlay';
        document.body.appendChild(this.flickerOverlay);

        // Stop flickering after 30 seconds
        this.flickerTimeout = setTimeout(() => {
            this.stopFlickering();
        }, 30000);
    }

    // Stop the flickering effect
    stopFlickering() {
        // Clear timeout if it exists
        if (this.flickerTimeout) {
            clearTimeout(this.flickerTimeout);
            this.flickerTimeout = null;
        }

        // Remove flickering classes
        document.body.classList.remove('flickering', 'light-flash');

        // Remove flicker overlay if it exists
        if (this.flickerOverlay) {
            this.flickerOverlay.remove();
            this.flickerOverlay = null;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MorningTimer();
});

// Load voices when they become available
if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
        if (window.app) {
            window.app.loadVoices();
        }
    };
}

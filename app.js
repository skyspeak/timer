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
        this.audioContext = null; // Web Audio context to improve playback reliability
        this.mediaElementSource = null;
        this.flickerTimeout = null;
        this.flickerOverlay = null;
        this.lastWarningTriggered = -1;
        this.audioEnabled = false; // Track if audio is enabled after user interaction
        
        this.init();
    }

    // Initialize the application
    init() {
        // Detect if running on GitHub Pages
        this.isGitHubPages = window.location.hostname.includes('github.io') || 
                           window.location.hostname.includes('github.com');
        
        if (this.isGitHubPages) {
            console.log('🌐 Running on GitHub Pages - using HTTPS audio paths');
        } else {
            console.log('🏠 Running locally - using local audio paths');
        }
        
        this.setupEventListeners();
        this.loadVoices();
        this.startClock();
        this.renderIntervals();
        this.updateDisplay();
        this.setupAutoTrigger();
        this.requestAudioPermissions();
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
                },
                {
                    id: 6,
                    minute: 40,
                    duration: 3,
                    color: "#9B59B6",
                    instruction: "Wear your shoes, grab your jackets and backpack!",
                    audio: "ambulance_siren.mp3",
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
        console.log('Setting up event listeners...');
        
        // Browser visibility change - keep timer running in background
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Page hidden - timer continues in background');
            } else {
                console.log('Page visible - timer active');
            }
        });

        // Audio enable button
        const enableAudioBtn = document.getElementById('enable-audio-btn');
        if (enableAudioBtn) {
            enableAudioBtn.addEventListener('click', () => {
                this.enableAudio();
            });
        } else {
            console.error('Audio enable button not found!');
        }

        // Settings panel toggle
        const settingsToggle = document.getElementById('settings-toggle');
        console.log('Settings toggle element:', settingsToggle);
        if (settingsToggle) {
            settingsToggle.addEventListener('click', () => {
                this.toggleSettings();
            });
        } else {
            console.error('Settings toggle element not found!');
        }

        const closeSettings = document.getElementById('close-settings');
        if (closeSettings) {
            closeSettings.addEventListener('click', () => {
                this.toggleSettings();
            });
        }

        // Timer settings
        const startTime = document.getElementById('start-time');
        if (startTime) {
            startTime.addEventListener('change', (e) => {
                this.config.timerSettings.startTime = e.target.value;
                this.saveConfig();
            });
        }

        const endTime = document.getElementById('end-time');
        if (endTime) {
            endTime.addEventListener('change', (e) => {
                this.config.timerSettings.endTime = e.target.value;
                this.saveConfig();
            });
        }

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

        const ttsVoice = document.getElementById('tts-voice');
        if (ttsVoice) {
            ttsVoice.addEventListener('change', (e) => {
                this.config.ttsSettings.voice = e.target.value;
                this.saveConfig();
            });
        }

        // Audio settings
        const audioVolume = document.getElementById('audio-volume');
        if (audioVolume) {
            audioVolume.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                const audioVolumeValue = document.getElementById('audio-volume-value');
                if (audioVolumeValue) {
                    audioVolumeValue.textContent = value.toFixed(1);
                }
                this.config.audioSettings.volume = value;
                this.saveConfig();
            });
        }

        ['fade-in', 'fade-out'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    const setting = id.replace('-', '');
                    this.config.audioSettings[setting] = parseInt(e.target.value);
                    this.saveConfig();
                });
            }
        });

        // Configuration actions
        const addInterval = document.getElementById('add-interval');
        console.log('Add interval element:', addInterval);
        if (addInterval) {
            addInterval.addEventListener('click', () => {
                this.addInterval();
            });
        } else {
            console.error('Add interval element not found!');
        }

        const exportConfig = document.getElementById('export-config');
        if (exportConfig) {
            exportConfig.addEventListener('click', () => {
                this.exportConfig();
            });
        }

        const importConfig = document.getElementById('import-config');
        if (importConfig) {
            importConfig.addEventListener('click', () => {
                const importFile = document.getElementById('import-file');
                if (importFile) {
                    importFile.click();
                }
            });
        }

        const importFile = document.getElementById('import-file');
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                this.importConfig(e.target.files[0]);
            });
        }

        const resetConfig = document.getElementById('reset-config');
        if (resetConfig) {
            resetConfig.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset to default configuration?')) {
                    this.resetConfig();
                }
            });
        }

        // MP3 Test button
        const testMP3 = document.getElementById('test-tts');
        if (testMP3) {
            testMP3.addEventListener('click', () => {
                this.testNumberedMP3Sequence();
            });
        }

        // Note: Audio will be enabled only when user clicks "Enable Sound" button
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

    // Setup auto-trigger for 7 AM every day
    setupAutoTrigger() {
        // Check if we should auto-start the timer
        this.checkAutoStart();
        
        // Set up a daily check at midnight to schedule the next day's timer
        this.scheduleDailyCheck();
    }

    // Check if we should auto-start the timer
    checkAutoStart() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const timeStr = now.toTimeString().slice(0, 5);
        
        // Check if it's an active day and we're in the timer window
        const isActiveDay = this.config.timerSettings.activeDays.includes(dayOfWeek);
        const isInTimerWindow = timeStr >= this.config.timerSettings.startTime && 
                               timeStr <= this.config.timerSettings.endTime;
        
        if (isActiveDay && isInTimerWindow) {
            console.log('Auto-starting timer - currently in active window');
            this.isActive = true;
            this.showNotification('Morning Timer Started', 'Your morning routine timer is now active!');
        }
    }

    // Request notification permission only (no AudioContext here)
    async requestAudioPermissions() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        // Show a message to user about clicking to enable audio
        this.showAudioEnableMessage();
    }

    // Show message to enable audio
    showAudioEnableMessage() {
        // Show the audio enable button
        const audioContainer = document.getElementById('audio-enable-container');
        if (audioContainer) {
            audioContainer.classList.remove('hidden');
            
            // Add GitHub Pages specific message
            if (this.isGitHubPages) {
                const button = document.getElementById('enable-audio-btn');
                if (button) {
                    button.innerHTML = '🔊 Enable Audio for Timer<br><small>Click to enable audio on GitHub Pages</small>';
                }
            }
        }
    }


    // Enable audio by playing a silent sound
    enableAudio() {
        console.log('🔊 Enabling audio...');
        
        // Hide the audio enable button
        const audioContainer = document.getElementById('audio-enable-container');
        if (audioContainer) {
            audioContainer.classList.add('hidden');
        }
        
        try {
            // Initialize (or resume) a shared AudioContext
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                if (!this.audioContext) {
                    this.audioContext = new AudioCtx();
                    console.log('🎵 AudioContext created:', this.audioContext.state);
                } else if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                    console.log('🎵 AudioContext resumed:', this.audioContext.state);
                }
            }

            // Test with a simple audio file first - try multiple paths for GitHub Pages
            let testPaths;
            if (this.isGitHubPages) {
                // Prioritize GitHub Pages HTTPS paths when running on GitHub Pages
                testPaths = [
                    'https://skyspeak.github.io/timer/audio/wake_up_routine.mp3',
                    'https://gliu.github.io/timer/audio/wake_up_routine.mp3',
                    '/audio/wake_up_routine.mp3',
                    'audio/wake_up_routine.mp3',
                    './audio/wake_up_routine.mp3'
                ];
            } else {
                // Use local paths when running locally
                testPaths = [
                    'audio/wake_up_routine.mp3',
                    './audio/wake_up_routine.mp3',
                    '/audio/wake_up_routine.mp3'
                ];
            }

            let testIndex = 0;
            const tryTestAudio = () => {
                if (testIndex >= testPaths.length) {
                    console.warn('⚠️ All audio test paths failed, enabling audio anyway');
                    this.audioEnabled = true;
                    return;
                }

                const testPath = testPaths[testIndex];
                console.log(`🎵 Testing audio path: ${testPath}`);
                
                const testAudio = new Audio(testPath);
                testAudio.volume = 0.1; // Low volume for testing
                testAudio.crossOrigin = 'anonymous';
                
                testAudio.play().then(() => {
                    console.log('✅ Audio test successful - you should hear wake_up_routine.mp3');
                    this.audioEnabled = true;
                    // Stop after 2 seconds
                    setTimeout(() => {
                        testAudio.pause();
                        testAudio.currentTime = 0;
                    }, 2000);
                }).catch(err => {
                    console.warn(`❌ Audio test failed for ${testPath}:`, err);
                    testIndex++;
                    tryTestAudio();
                });
            };

            tryTestAudio();

        } catch (error) {
            console.error('❌ Audio enable failed:', error);
            // Enable audio anyway - user interaction was detected
            this.audioEnabled = true;
        }
    }

    // Show browser notification
    showNotification(title, message) {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body: message,
                    icon: '/favicon.ico'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(title, {
                            body: message,
                            icon: '/favicon.ico'
                        });
                    }
                });
            }
        }
    }

    // Schedule daily check at midnight
    scheduleDailyCheck() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0); // Set to midnight
        
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.checkAutoStart();
            this.scheduleDailyCheck(); // Schedule the next day
        }, msUntilMidnight);
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
        
        // Only update isActive if we're not already in an active state
        // This prevents interrupting an already running timer
        if (!this.isActive) {
            this.isActive = isActiveDay && isActiveTime;
        } else {
            // If we're currently active, check if we should stop
            if (!isActiveDay || !isActiveTime) {
                this.isActive = false;
                this.stopFlickering();
                this.currentInterval = null;
            }
        }
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

        // Check for warning announcements (60 seconds before each interval)
        const warningMinute = elapsedMinutes - 1; // 1 minute = 60 seconds before
        if (warningMinute >= 0) {
            const warningInterval = this.config.intervals.find(i => 
                i.enabled && i.minute === elapsedMinutes && i.id !== this.lastWarningTriggered
            );
            
            if (warningInterval) {
                this.triggerWarning(warningInterval);
            }
        }

        // Find matching interval
        const interval = this.config.intervals.find(i => 
            i.enabled && i.minute === elapsedMinutes && i.id !== this.lastTriggered
        );

        if (interval) {
            this.triggerInterval(interval);
        }
    }

    // Trigger a warning announcement
    async triggerWarning(interval) {
        this.lastWarningTriggered = interval.id;
        
        const warningMessage = `Warning! In 60 seconds, a new stage will begin: ${interval.instruction}`;
        
        // Just log the warning - no audio
        console.log(`⚠️ ${warningMessage}`);
    }

    // Trigger an interval
    async triggerInterval(interval) {
        this.lastTriggered = interval.id;
        this.currentInterval = interval;

        // Start flickering effect for 30 seconds
        this.startFlickering();

        // Update background color
        document.body.style.backgroundColor = interval.color;

        // Play the corresponding numbered MP3 file (3 times) for this interval
        const mp3Number = interval.id;
        console.log(`🎵 Playing ${mp3Number}.mp3 (3 times)...`);
        for (let repeat = 1; repeat <= 3; repeat++) {
            console.log(`🎵 Playing ${mp3Number}.mp3 (${repeat}/3)...`);
            await this.playAudio(`${mp3Number}.mp3`);
            console.log(`✅ ${mp3Number}.mp3 (${repeat}/3) completed`);
            if (repeat < 3) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        // Then play the stage-specific audio file
        if (interval.audio) {
            await this.playAudio(interval.audio);
        }

        // Update display
        this.updateDisplay();
    }




    // Play audio file for at least 60 seconds
    playAudio(filename) {
        return new Promise((resolve) => {
            if (!filename) {
                console.log('No filename provided, skipping audio');
                resolve();
                return;
            }

            // Check if audio is enabled and user has interacted
            if (!this.audioEnabled) {
                console.warn('Audio not enabled - user interaction required');
                resolve();
                return;
            }

            // Stop any existing audio
            if (this.audio) {
                this.audio.pause();
                this.audio.currentTime = 0;
            }

            // Try multiple audio file paths for GitHub Pages compatibility
            let audioPaths;
            if (this.isGitHubPages) {
                // Prioritize GitHub Pages HTTPS paths when running on GitHub Pages
                audioPaths = [
                    `https://skyspeak.github.io/timer/audio/${filename}`,
                    `https://gliu.github.io/timer/audio/${filename}`,
                    `/audio/${filename}`,
                    `audio/${filename}`,
                    `./audio/${filename}`,
                    filename
                ];
            } else {
                // Use local paths when running locally
                audioPaths = [
                    `audio/${filename}`,
                    `./audio/${filename}`,
                    `/audio/${filename}`,
                    filename
                ];
            }

            let audioIndex = 0;
            const tryNextAudio = () => {
                if (audioIndex >= audioPaths.length) {
                    console.error(`❌ Could not load audio file: ${filename} - tried all paths`);
                    resolve();
                    return;
                }

                const audioPath = audioPaths[audioIndex];
                console.log(`🎵 Trying to load audio: ${audioPath}`);
                
                this.audio = new Audio(audioPath);
                this.audio.crossOrigin = 'anonymous';
                this.audio.volume = this.config.audioSettings.volume;
                this.audio.loop = false; // Play once, no looping

                // Set up 60-second timer (fallback if onended doesn't fire)
                const playDuration = 60000; // 60 seconds in milliseconds
                const stopTimer = setTimeout(() => {
                    console.warn(`⏰ Audio timeout for ${filename}`);
                    if (this.audio) {
                        this.audio.pause();
                        this.audio.currentTime = 0;
                    }
                    resolve();
                }, playDuration);

                this.audio.oncanplaythrough = () => {
                    console.log(`✅ Audio loaded successfully: ${audioPath}`);
                    this.audio.play().then(() => {
                        console.log(`🔊 Audio playing: ${filename}`);
                        if (this.isGitHubPages) {
                            console.log('🌐 GitHub Pages audio playback successful!');
                        }
                    }).catch(err => {
                        console.error(`❌ Audio playback failed for ${audioPath}:`, err);
                        if (this.isGitHubPages) {
                            console.error('🌐 GitHub Pages audio error - trying next path...');
                        }
                        clearTimeout(stopTimer);
                        audioIndex++;
                        tryNextAudio();
                    });
                };

                this.audio.onended = () => {
                    console.log(`✅ Audio finished playing: ${filename}`);
                    clearTimeout(stopTimer);
                    resolve();
                };

                this.audio.onerror = (e) => {
                    console.error(`❌ Audio file not found: ${audioPath}`, e);
                    clearTimeout(stopTimer);
                    audioIndex++;
                    tryNextAudio();
                };

                this.audio.onloadstart = () => {
                    console.log(`🔄 Audio loading started: ${audioPath}`);
                };

                this.audio.onload = () => {
                    console.log(`📁 Audio file loaded: ${audioPath}`);
                };

                // Load the audio
                this.audio.load();
            };

            tryNextAudio();
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
        console.log('Settings panel:', panel);
        console.log('Panel classes before toggle:', panel.classList.toString());
        
        panel.classList.toggle('hidden');
        
        console.log('Panel classes after toggle:', panel.classList.toString());
        console.log('Panel is hidden:', panel.classList.contains('hidden'));
        
        // Check if test button exists when panel is shown
        if (!panel.classList.contains('hidden')) {
            const testButton = document.getElementById('test-tts');
            console.log('Test TTS button:', testButton);
            if (testButton) {
                console.log('✅ Test button found!');
            } else {
                console.error('❌ Test button not found!');
            }
        }
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

    // Test numbered MP3 sequence
    async testNumberedMP3Sequence() {
        console.log('🧪 Testing numbered MP3 sequence...');
        
        try {
            // Test each interval's MP3 file (3 times each)
            for (let i = 1; i <= 6; i++) {
                console.log(`🎵 Testing ${i}.mp3 (3 times)...`);
                for (let repeat = 1; repeat <= 3; repeat++) {
                    console.log(`🎵 Playing ${i}.mp3 (${repeat}/3)...`);
                    await this.playAudio(`${i}.mp3`);
                    console.log(`✅ ${i}.mp3 (${repeat}/3) completed`);
                    if (repeat < 3) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }
                if (i < 6) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            console.log('✅ Numbered MP3 sequence test completed - you should have heard 1.mp3 through 6.mp3 (each 3 times)');
            
        } catch (error) {
            console.error('❌ Numbered MP3 sequence test failed:', error);
        }
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

        // Flicker exactly 10 times
        let flickerCount = 0;
        const flickerInterval = setInterval(() => {
            flickerCount++;
            
            // Toggle the flicker effect
            if (flickerCount % 2 === 1) {
                document.body.classList.add('flicker-flash');
            } else {
                document.body.classList.remove('flicker-flash');
            }
            
            // Stop after 10 flickers (20 toggles)
            if (flickerCount >= 20) {
                clearInterval(flickerInterval);
                this.stopFlickering();
            }
        }, 150); // Flicker every 150ms for dramatic effect
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
    // Force refresh to ensure latest code is loaded
    window.app = new MorningTimer();
});

// Load voices when they become available
if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
        if (window.app && typeof window.app.loadVoices === 'function') {
            window.app.loadVoices();
        }
    };
}

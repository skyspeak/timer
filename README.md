# Morning Timer System

A browser-based timer application that runs weekday mornings (7:00-7:43 AM) with synchronized color transitions, text-to-speech announcements, and audio playback for a custom morning routine.

## Features

- **Live Clock**: 43-minute weekday timer (7:00-7:43 AM)
- **Color Display**: Full-screen color transitions at each interval
- **Text-to-Speech**: Voice announcements using Web Speech API
- **Audio Playback**: Post-announcement soundtrack playback
- **Configurable**: Customizable intervals, colors, and settings
- **Responsive**: Works on desktop and mobile devices

## Quick Start

1. Open `index.html` in a modern web browser
2. The timer will automatically activate on weekdays between 7:00-7:35 AM
3. Click the ⚙️ button to access settings and configuration

## Configuration

The application includes a comprehensive settings panel where you can:

- **Timer Settings**: Adjust start/end times and active days
- **Intervals**: Add, edit, or remove timer intervals
- **TTS Settings**: Configure speech rate, pitch, volume, and voice
- **Audio Settings**: Set volume levels and fade effects
- **Import/Export**: Save and load configuration files

## Custom Morning Routine Intervals

| Time | Color | TTS Message | Audio File |
|------|-------|-------------|------------|
| 7:00 AM | #FF6B6B | "It is time to wake up wake up now! Rise and shine and have an amazing day" | wake_up_routine.mp3 |
| 7:05 AM | #FF4757 | "Time to change your clothes!" | ambulance_siren.mp3 |
| 7:10 AM | #FFA502 | "Time to pee and go eat!" | big_announcement_bells.mp3 |
| 7:15 AM | #2ED573 | "EAT YOUR FOOD!" | relaxing_music.mp3 |
| 7:35 AM | #3742FA | "Time to brush and get ready for school, 8 minutes left!" | final_reminder.mp3 |

## Browser Requirements

- Modern browser with Web Speech API support
- HTML5 Audio support
- LocalStorage support for configuration persistence

## File Structure

```
timer/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and animations
├── app.js             # Main JavaScript application
├── audio/             # Audio files directory
│   └── README.md      # Audio files documentation
└── README.md          # This file
```

## Audio Files

**Note**: Some audio files are included in this repository. Additional audio files may need to be added for the complete experience.

### Required Audio Files:
- `wake_up_routine.mp3` - 5-minute wake-up music (MP3 format)
- `ambulance_siren.mp3` - Siren sound (MP3 format)  
- `big_announcement_bells.mp3` - Bell sounds (MP3 format)
- `relaxing_music.mp3` - 20-minute relaxing music (MP3 format)
- `final_reminder.mp3` - Final reminder sound (MP3 format)

See `download_audio_guide.md` for detailed instructions on finding free audio files. The application will work with just text-to-speech if audio files are missing.

## Live Demo

🌐 **Try it now**: [https://skyspeak.github.io/timer/](https://skyspeak.github.io/timer/)

The application is deployed on GitHub Pages and ready to use!

## Development

The application is built with vanilla JavaScript, HTML5, and CSS3. No external dependencies are required.

### Local Development

1. Clone the repository: `git clone https://github.com/skyspeak/timer.git`
2. Start a local server: `python3 -m http.server 8000`
3. Open http://localhost:8000 in your browser

### GitHub Pages Deployment

The application is automatically deployed to GitHub Pages using GitHub Actions. The deployment workflow is configured in `.github/workflows/deploy.yml`.

### Key Components

- **MorningTimer Class**: Main application logic
- **Configuration System**: LocalStorage-based settings management
- **Web Speech API**: Text-to-speech functionality
- **HTML5 Audio**: Sound playback with fade effects
- **CSS Transitions**: Smooth color transitions

## License

This project is open source and available under the MIT License.

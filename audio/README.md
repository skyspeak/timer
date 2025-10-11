# Audio Files Directory

This directory contains the audio files used by the Morning Timer application.

## Required Audio Files

The following audio files are referenced in the default configuration:

- `morning.mp3` - Morning wake-up sound
- `chime.mp3` - 5-minute chime
- `soft-bell.mp3` - 10-minute soft bell
- `gentle-tone.mp3` - 15-minute gentle tone
- `upbeat.mp3` - 20-minute upbeat sound
- `countdown.mp3` - 25-minute countdown sound
- `finale.mp3` - 30-minute finale sound
- `complete.mp3` - 35-minute completion sound

## Audio File Specifications

- **Format**: MP3, 44.1kHz, 128kbps
- **Duration**: 3-10 seconds recommended
- **Volume**: Normalized to prevent sudden volume changes

## Adding Audio Files

1. Place your audio files in this directory
2. Update the interval configuration in the settings panel
3. The application will automatically load the files when intervals are triggered

## Fallback Behavior

If an audio file is missing or fails to load, the application will:
- Log a warning to the console
- Continue with the next step in the interval sequence
- Not interrupt the timer flow

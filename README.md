# Calendar Planner - iOS App

A beautiful iOS calendar planner app inspired by Skylight, featuring calendar management, sticky notes, photo sharing, and an automatic photo slideshow mode.

## Features

### 📅 Calendar
- **Multiple View Modes**: Month, week, and day views
- **Event Management**: Create, edit, and delete calendar events
- **Google Calendar Integration**: Sync events with your Google Calendar
- **Color Coding**: Organize events with custom colors
- **All-day Events**: Support for both timed and all-day events

### 📝 Sticky Notes
- **Digital Notes**: Create colorful sticky notes
- **Multiple Colors**: Choose from 6 different note colors
- **Easy Management**: Edit, delete, and organize your notes
- **Persistent Storage**: Notes are saved locally on your device

### 📸 Photos
- **Photo Gallery**: View all your shared photos in a grid layout
- **Photo Sharing**: Share photos with family and friends
- **Captions**: Add captions to your photos
- **Favorites**: Mark photos as favorites
- **Multiple Selection**: Add up to 10 photos at once

### 🖼️ Photo Slideshow
- **Automatic Slideshow**: After idle timeout, the app displays photos like a digital frame
- **Smooth Transitions**: Beautiful fade transitions between photos
- **Customizable Timeout**: Set idle timeout from 1-10 minutes
- **Manual Controls**: Navigate photos manually or exit slideshow anytime

## Requirements

- iOS 16.0 or later
- Xcode 15.0 or later
- Swift 5.9 or later

## Setup Instructions

### 1. Create Xcode Project

1. Open Xcode
2. Create a new project: **File → New → Project**
3. Select **iOS → App**
4. Configure your project:
   - Product Name: `CalendarPlanner`
   - Interface: `SwiftUI`
   - Language: `Swift`
   - Core Data: `Checked`
5. Choose a location and create the project

### 2. Add Source Files

1. Delete the default ContentView.swift file
2. Create the following folder structure in your Xcode project:
   ```
   CalendarPlanner/
   ├── App/
   ├── Views/
   ├── Models/
   ├── ViewModels/
   ├── Services/
   ├── Persistence/
   └── Resources/
   ```

3. Add all the Swift files from this repository to their respective folders:
   - Drag and drop files from `CalendarPlanner/App/` to the App group
   - Drag and drop files from `CalendarPlanner/Views/` to the Views group
   - And so on for all folders

4. Replace the auto-generated `CalendarPlannerApp.swift` with the one from this repo

### 3. Configure Info.plist

1. Open your `Info.plist` file
2. Add the following keys (or copy from the provided `Info.plist`):
   - **NSPhotoLibraryUsageDescription**: "We need access to your photo library to display and share photos in the app."
   - **NSPhotoLibraryAddUsageDescription**: "We need access to save photos to your photo library."
   - **NSCameraUsageDescription**: "We need access to your camera to take photos."

### 4. Google Calendar API Setup (Optional)

To enable Google Calendar integration:

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Google Calendar API

2. **Create OAuth 2.0 Credentials**:
   - Go to **APIs & Services → Credentials**
   - Create **OAuth 2.0 Client ID** for iOS
   - Note your Client ID

3. **Install Google Sign-In SDK**:
   ```ruby
   # Add to your Podfile
   pod 'GoogleSignIn'
   ```

   Or use Swift Package Manager:
   - In Xcode: **File → Add Packages**
   - Add: `https://github.com/google/GoogleSignIn-iOS`

4. **Configure the App**:
   - Open `GoogleCalendarService.swift`
   - Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID
   - Open `Info.plist`
   - Replace `YOUR_REVERSED_CLIENT_ID` with your reversed Client ID

5. **Update App Delegate** (if needed):
   - Handle Google Sign-In URL schemes

### 5. Core Data Model

The Core Data model is already configured in `CalendarPlanner.xcdatamodeld`. Make sure it's included in your project target.

### 6. Build and Run

1. Select your target device or simulator
2. Press **Cmd + R** to build and run
3. Grant photo library permissions when prompted

## Project Structure

```
CalendarPlanner/
├── App/
│   └── CalendarPlannerApp.swift          # Main app entry point
├── Views/
│   ├── MainTabView.swift                  # Main tab navigation
│   ├── CalendarView.swift                 # Calendar main view
│   ├── MonthCalendarView.swift            # Month calendar grid
│   ├── WeekCalendarView.swift             # Week calendar view
│   ├── DayCalendarView.swift              # Day calendar with hourly slots
│   ├── AddEventView.swift                 # Add new event form
│   ├── EventDetailView.swift              # Event detail and edit
│   ├── StickyNotesView.swift              # Sticky notes board
│   ├── AddStickyNoteView.swift            # Add new note
│   ├── EditStickyNoteView.swift           # Edit existing note
│   ├── PhotoGalleryView.swift             # Photo gallery grid
│   ├── PhotoSlideshowView.swift           # Slideshow mode
│   └── SettingsView.swift                 # App settings
├── Models/
│   ├── CalendarEvent.swift                # Calendar event model
│   ├── StickyNote.swift                   # Sticky note model
│   └── Photo.swift                        # Photo model
├── ViewModels/
│   ├── CalendarViewModel.swift            # Calendar business logic
│   ├── StickyNoteViewModel.swift          # Notes business logic
│   └── PhotoViewModel.swift               # Photos business logic
├── Services/
│   ├── GoogleCalendarService.swift        # Google Calendar API
│   ├── PhotoService.swift                 # Photo storage service
│   └── IdleTimerService.swift             # Idle detection service
└── Persistence/
    ├── PersistenceController.swift        # Core Data controller
    └── CalendarPlanner.xcdatamodeld       # Core Data model
```

## Usage

### Adding Calendar Events

1. Go to the **Calendar** tab
2. Tap the **+** button in the top right
3. Fill in event details
4. Choose a color
5. Optionally sync with Google Calendar
6. Tap **Add**

### Creating Sticky Notes

1. Go to the **Notes** tab
2. Tap the **+** button
3. Type your note content
4. Choose a color
5. Tap **Add**

### Adding Photos

1. Go to the **Photos** tab
2. Tap the **+** button
3. Select up to 10 photos from your library
4. Photos will appear in the gallery

### Photo Slideshow

1. Leave the app idle for the configured timeout (default: 1 minute)
2. The app will automatically enter slideshow mode
3. Photos will cycle every 5 seconds
4. Tap anywhere or use controls to exit

### Settings

1. Go to the **Settings** tab
2. Adjust idle timeout (1-10 minutes)
3. Sign in with Google Calendar (optional)
4. View app version information

## Data Storage

- **Calendar Events**: Stored in UserDefaults and optionally synced with Google Calendar
- **Sticky Notes**: Stored in UserDefaults
- **Photos**: Stored in app's Documents directory
- **Settings**: Stored in UserDefaults

## Customization

### Colors

Modify the color options in:
- `StickyNote.swift` - For sticky note colors
- Event color picker in `AddEventView.swift`

### Slideshow Timing

Adjust slideshow interval in `PhotoSlideshowView.swift`:
```swift
Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) // Change 5.0 to your preferred interval
```

### Idle Timeout

Default timeout can be changed in `IdleTimerService.swift`:
```swift
@Published var idleTimeoutSeconds: TimeInterval = 60 // Change default timeout
```

## Known Limitations

1. **Google Calendar Integration**: Requires manual setup with Google Cloud Console
2. **Photos**: Stored locally only, no cloud backup
3. **Sync**: One-way sync from Google Calendar (for now)
4. **iPad**: Optimized for iPad but UI could be enhanced further

## Future Enhancements

- [ ] Full two-way Google Calendar sync
- [ ] iCloud photo backup
- [ ] Apple Calendar integration
- [ ] Widget support
- [ ] Apple Watch companion app
- [ ] Shared family calendars
- [ ] Photo slideshow themes
- [ ] Export calendar to PDF
- [ ] Dark mode support
- [ ] Localization

## License

This project is provided as-is for educational and personal use.

## Support

For issues or questions, please create an issue in the repository.

## Acknowledgments

Inspired by Skylight - the digital family calendar and photo frame.

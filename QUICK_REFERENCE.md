# Calendar Planner - Quick Reference Guide

## File Overview

### 📱 App Entry Point
- **CalendarPlannerApp.swift** - Main app file, sets up environment objects and services

### 🎨 Views (UI Components)

#### Navigation
- **MainTabView.swift** - Tab bar navigation with slideshow integration

#### Calendar
- **CalendarView.swift** - Main calendar interface with view mode switcher
- **MonthCalendarView.swift** - Monthly grid calendar
- **WeekCalendarView.swift** - Weekly calendar strip
- **DayCalendarView.swift** - Hourly day view
- **AddEventView.swift** - Form to create new events
- **EventDetailView.swift** - Display and manage event details

#### Sticky Notes
- **StickyNotesView.swift** - Note board with grid layout
- **AddStickyNoteView.swift** - Create new sticky note
- **EditStickyNoteView.swift** - Edit existing sticky note

#### Photos
- **PhotoGalleryView.swift** - Photo grid with thumbnail views
- **PhotoSlideshowView.swift** - Full-screen slideshow mode

#### Settings
- **SettingsView.swift** - App configuration and preferences

### 📊 Models (Data Structures)
- **CalendarEvent.swift** - Event data model with Google sync support
- **StickyNote.swift** - Note data model with colors
- **Photo.swift** - Photo metadata model

### 🧠 ViewModels (Business Logic)
- **CalendarViewModel.swift** - Calendar event management
- **StickyNoteViewModel.swift** - Note CRUD operations
- **PhotoViewModel.swift** - Photo management and slideshow

### ⚙️ Services (External Integrations)
- **GoogleCalendarService.swift** - Google Calendar API integration
- **PhotoService.swift** - Local photo storage
- **IdleTimerService.swift** - Idle detection for slideshow

### 💾 Persistence
- **PersistenceController.swift** - Core Data setup
- **CalendarPlanner.xcdatamodeld** - Core Data model

## Key Features Implementation

### Calendar Management

**Add Event:**
```swift
let event = CalendarEvent(
    title: "Meeting",
    description: "Team meeting",
    startDate: Date(),
    endDate: Date().addingTimeInterval(3600),
    color: "blue"
)
viewModel.addEvent(event)
```

**Update Event:**
```swift
viewModel.updateEvent(modifiedEvent)
```

**Delete Event:**
```swift
viewModel.deleteEvent(event)
```

**Get Events for Date:**
```swift
let events = viewModel.eventsForDate(selectedDate)
```

### Sticky Notes

**Add Note:**
```swift
let note = StickyNote(
    content: "Remember to...",
    color: "yellow"
)
viewModel.addNote(note)
```

**Update Note:**
```swift
var updated = note
updated.content = "New content"
viewModel.updateNote(updated)
```

**Delete Note:**
```swift
viewModel.deleteNote(note)
```

### Photo Management

**Add Photo:**
```swift
viewModel.addPhoto(image: uiImage, caption: "Family vacation")
```

**Load Image:**
```swift
let image = viewModel.loadImage(for: photo)
```

**Slideshow Controls:**
```swift
viewModel.nextPhoto()      // Next photo
viewModel.previousPhoto()  // Previous photo
viewModel.getCurrentPhoto() // Get current photo
```

### Google Calendar Sync

**Sync Events:**
```swift
await viewModel.syncWithGoogleCalendar()
```

**Add to Google:**
```swift
await viewModel.addEventToGoogleCalendar(event)
```

### Idle Timer

**Record Activity:**
```swift
idleTimerService.recordActivity()
```

**Check if Idle:**
```swift
if idleTimerService.isIdle {
    // Show slideshow
}
```

**Configure Timeout:**
```swift
idleTimerService.idleTimeoutSeconds = 120 // 2 minutes
```

## Data Storage

### UserDefaults Keys
- `calendarEvents` - Array of calendar events
- `stickyNotes` - Array of sticky notes
- `photos` - Array of photo metadata

### File Storage
- Photos: `Documents/Photos/*.jpg`

## Color Codes

### Event Colors
- `"blue"` - Blue
- `"red"` - Red
- `"green"` - Green
- `"yellow"` - Yellow
- `"purple"` - Purple
- `"orange"` - Orange

### Sticky Note Colors
- `"yellow"` - Classic yellow (default)
- `"pink"` - Pink
- `"blue"` - Light blue
- `"green"` - Light green
- `"purple"` - Light purple
- `"orange"` - Light orange

## Environment Objects

### Required in Views
```swift
@EnvironmentObject var calendarViewModel: CalendarViewModel
@EnvironmentObject var stickyNoteViewModel: StickyNoteViewModel
@EnvironmentObject var photoViewModel: PhotoViewModel
@EnvironmentObject var idleTimerService: IdleTimerService
```

## Common Tasks

### Navigate to Different Calendar Views
Change `viewMode` in CalendarView:
- `.month` - Monthly grid
- `.week` - Weekly strip
- `.day` - Hourly day view

### Customize Slideshow Interval
In `PhotoSlideshowView.swift`, line ~50:
```swift
Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true)
// Change 5.0 to your desired interval in seconds
```

### Adjust Idle Timeout Range
In `SettingsView.swift`, line ~18:
```swift
Slider(value: $idleTimeoutMinutes, in: 1...10, step: 1)
// Change range (1...10) to your desired min/max
```

### Change Default Colors
In respective model files:
- `CalendarEvent.swift` - Line ~19: `color: String = "blue"`
- `StickyNote.swift` - Line ~16: `color: String = "yellow"`

## API Integration

### Google Calendar API Endpoints

**Fetch Events:**
```
GET https://www.googleapis.com/calendar/v3/calendars/primary/events
```

**Create Event:**
```
POST https://www.googleapis.com/calendar/v3/calendars/primary/events
```

**Update Event:**
```
PUT https://www.googleapis.com/calendar/v3/calendars/primary/events/{eventId}
```

**Delete Event:**
```
DELETE https://www.googleapis.com/calendar/v3/calendars/primary/events/{eventId}
```

## Permissions Required

### Info.plist Keys
- `NSPhotoLibraryUsageDescription` - Read photo library
- `NSPhotoLibraryAddUsageDescription` - Save to photo library
- `NSCameraUsageDescription` - Camera access (optional)

## Debug Tips

### Check Data
```swift
// Print all events
print(calendarViewModel.events)

// Print all notes
print(stickyNoteViewModel.notes)

// Print all photos
print(photoViewModel.photos)
```

### Clear All Data
```swift
UserDefaults.standard.removeObject(forKey: "calendarEvents")
UserDefaults.standard.removeObject(forKey: "stickyNotes")
UserDefaults.standard.removeObject(forKey: "photos")
```

### Check Idle Status
```swift
print("Is idle: \(idleTimerService.isIdle)")
print("Timeout: \(idleTimerService.idleTimeoutSeconds)")
```

## Performance Tips

1. **Large Photo Galleries**: Implement thumbnail generation
2. **Many Events**: Add pagination to calendar views
3. **Memory**: Clear photo cache periodically
4. **Sync**: Implement background sync for Google Calendar

## Customization Ideas

- Add recurring events
- Implement event reminders
- Add calendar export (PDF/iCal)
- Create photo albums
- Add video support
- Implement shared calendars
- Add weather integration
- Create custom themes
- Add widgets

## Code Style

- SwiftUI for all views
- MVVM architecture
- Observable objects for state management
- Codable for data persistence
- Async/await for API calls
- Combine for reactive updates

## Testing Checklist

- ✅ Create/edit/delete events
- ✅ Switch calendar views
- ✅ Create/edit/delete notes
- ✅ Add/view/delete photos
- ✅ Slideshow activation after idle
- ✅ Exit slideshow on tap
- ✅ Settings persistence
- ✅ Photo sharing
- ✅ Event colors
- ✅ Note colors

## Keyboard Shortcuts (Simulator)

- **Cmd + R** - Run
- **Cmd + .** - Stop
- **Cmd + Shift + K** - Clean build
- **Cmd + B** - Build

## Common Issues & Solutions

**Issue: Photos not loading**
- Solution: Check photo library permissions

**Issue: Slideshow not activating**
- Solution: Wait full timeout period, check console for errors

**Issue: Events not saving**
- Solution: Check UserDefaults storage, verify JSON encoding

**Issue: Build errors**
- Solution: Clean build folder, check target membership

## Resources

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [Google Calendar API](https://developers.google.com/calendar)
- [Core Data Guide](https://developer.apple.com/documentation/coredata)

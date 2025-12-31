# Calendar Planner - Detailed Setup Guide

This guide will walk you through setting up the Calendar Planner iOS app step-by-step.

## Prerequisites

Before you begin, ensure you have:
- A Mac running macOS 13.0 (Ventura) or later
- Xcode 15.0 or later installed from the App Store
- An Apple Developer account (free or paid)
- Basic familiarity with Xcode

## Step-by-Step Setup

### Step 1: Create a New Xcode Project

1. **Launch Xcode**
   - Open Xcode from your Applications folder
   - Wait for it to fully load

2. **Create New Project**
   - Click "Create a new Xcode project" or go to **File → New → Project**
   - Select the **iOS** platform tab
   - Choose **App** template
   - Click **Next**

3. **Configure Project Settings**
   - **Product Name**: `CalendarPlanner`
   - **Team**: Select your Apple Developer team (or None for now)
   - **Organization Identifier**: `com.yourname` (use your own identifier)
   - **Bundle Identifier**: Will auto-populate as `com.yourname.CalendarPlanner`
   - **Interface**: Select **SwiftUI**
   - **Language**: Select **Swift**
   - **Storage**: Check **Use Core Data**
   - **Include Tests**: Optional (you can check if you want)
   - Click **Next**

4. **Choose Location**
   - Select where you want to save the project
   - Click **Create**

### Step 2: Organize Project Structure

1. **Delete Default Files**
   - In the Project Navigator (left sidebar), find `ContentView.swift`
   - Right-click it and select **Delete**
   - Choose **Move to Trash**

2. **Create Folder Groups**
   - Right-click on the `CalendarPlanner` folder (the yellow folder, not the project)
   - Select **New Group**
   - Create the following groups (folders):
     - `App`
     - `Views`
     - `Models`
     - `ViewModels`
     - `Services`
     - `Persistence` (should already exist with Core Data files)
     - `Resources`

### Step 3: Add Source Files

1. **Download/Clone Repository**
   - Download or clone this repository to your Mac
   - Keep Finder open to the repository folder

2. **Add Files to Xcode**

   **For App folder:**
   - Drag `CalendarPlannerApp.swift` from the repository's `CalendarPlanner/App/` folder
   - Drop it onto the `App` group in Xcode
   - In the dialog that appears:
     - Check "Copy items if needed"
     - Make sure your app target is selected
     - Click **Finish**

   **For Views folder:**
   - Drag all `.swift` files from `CalendarPlanner/Views/`
   - Drop onto the `Views` group
   - Same settings as above

   **For Models folder:**
   - Drag all `.swift` files from `CalendarPlanner/Models/`
   - Drop onto the `Models` group

   **For ViewModels folder:**
   - Drag all `.swift` files from `CalendarPlanner/ViewModels/`
   - Drop onto the `ViewModels` group

   **For Services folder:**
   - Drag all `.swift` files from `CalendarPlanner/Services/`
   - Drop onto the `Services` group

   **For Persistence folder:**
   - Replace the auto-generated `PersistenceController.swift` with the one from the repo
   - Add the Core Data model if needed

3. **Replace Main App File**
   - Delete the auto-generated `CalendarPlannerApp.swift` if you haven't already
   - The one you added from the repo should be the only app file

### Step 4: Configure Info.plist

1. **Locate Info.plist**
   - In Project Navigator, click on the project name (blue icon at top)
   - Select your app target
   - Click the **Info** tab

2. **Add Required Privacy Permissions**

   Click the **+** button to add new rows:

   **Photo Library Access:**
   - Key: `Privacy - Photo Library Usage Description`
   - Value: `We need access to your photo library to display and share photos in the app.`

   **Photo Library Additions:**
   - Key: `Privacy - Photo Library Additions Usage Description`
   - Value: `We need access to save photos to your photo library.`

   **Camera Access (optional):**
   - Key: `Privacy - Camera Usage Description`
   - Value: `We need access to your camera to take photos.`

### Step 5: Configure App Capabilities (Optional)

1. **Select Your Target**
   - Click on the project in Project Navigator
   - Select your app target
   - Click **Signing & Capabilities**

2. **Sign Your App**
   - Check **Automatically manage signing**
   - Select your Team
   - Xcode will automatically generate a provisioning profile

### Step 6: Build the Project

1. **Select a Simulator**
   - At the top of Xcode, click the device selector
   - Choose an iPhone simulator (e.g., "iPhone 15 Pro")

2. **Build the Project**
   - Press **Cmd + B** or go to **Product → Build**
   - Wait for the build to complete
   - Check for any errors in the Issue Navigator (⚠️ icon in left sidebar)

3. **Fix Any Build Errors**
   - If you see errors, they're likely from missing files or imports
   - Make sure all files are added to the target
   - Check that all imports are correct

### Step 7: Run the App

1. **Run on Simulator**
   - Press **Cmd + R** or click the Play button
   - Wait for the simulator to launch
   - The app should appear on the simulator

2. **Grant Permissions**
   - When prompted, allow photo library access
   - This is necessary for the photo gallery features

### Step 8: Test Basic Features

1. **Test Calendar**
   - Tap the Calendar tab
   - Tap + to add an event
   - Fill in details and save
   - Verify event appears on calendar

2. **Test Sticky Notes**
   - Tap the Notes tab
   - Tap + to add a note
   - Type some text and save
   - Verify note appears

3. **Test Photos**
   - Tap the Photos tab
   - Tap + to add photos
   - Select a photo from library
   - Verify photo appears in gallery

4. **Test Slideshow**
   - Let the app sit idle for 1 minute
   - Verify slideshow mode activates
   - Tap to exit slideshow

## Optional: Google Calendar Integration

### Prerequisites for Google Calendar

- Google account
- Access to Google Cloud Console

### Setup Steps

1. **Create Google Cloud Project**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Click **Create Project**
   - Name it "Calendar Planner"
   - Click **Create**

2. **Enable Google Calendar API**
   - In the Google Cloud Console, go to **APIs & Services**
   - Click **+ ENABLE APIS AND SERVICES**
   - Search for "Google Calendar API"
   - Click on it and click **ENABLE**

3. **Create OAuth Credentials**
   - Go to **APIs & Services → Credentials**
   - Click **+ CREATE CREDENTIALS**
   - Select **OAuth client ID**
   - If prompted, configure the OAuth consent screen first
   - For Application type, select **iOS**
   - Enter your Bundle ID (e.g., `com.yourname.CalendarPlanner`)
   - Click **Create**
   - Copy the **Client ID** that appears

4. **Add Google Sign-In SDK**

   **Option A: Swift Package Manager (Recommended)**
   - In Xcode, go to **File → Add Packages**
   - Paste: `https://github.com/google/GoogleSignIn-iOS`
   - Click **Add Package**
   - Select the package and click **Add Package** again

   **Option B: CocoaPods**
   - Create a `Podfile` in your project directory:
     ```ruby
     platform :ios, '16.0'
     use_frameworks!

     target 'CalendarPlanner' do
       pod 'GoogleSignIn'
     end
     ```
   - Run `pod install` in Terminal
   - Open `CalendarPlanner.xcworkspace` instead of `.xcodeproj`

5. **Configure Google Sign-In**

   **Update GoogleCalendarService.swift:**
   - Open `GoogleCalendarService.swift`
   - Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID
   - Replace `YOUR_GOOGLE_API_KEY` with your API key (create in Google Cloud Console)

   **Update Info.plist:**
   - Add a new row:
     - Key: `CFBundleURLTypes` (if not exists)
     - Type: Array
     - Add item with:
       - `CFBundleTypeRole`: Editor
       - `CFBundleURLSchemes`: Array with item: `com.googleusercontent.apps.YOUR_REVERSED_CLIENT_ID`

   **Get Reversed Client ID:**
   - Your Client ID looks like: `123456789-abc123.apps.googleusercontent.com`
   - Reversed is: `com.googleusercontent.apps.123456789-abc123`

6. **Implement Sign-In Flow**
   - You'll need to add Google Sign-In UI flow
   - See [Google Sign-In iOS Documentation](https://developers.google.com/identity/sign-in/ios)

## Troubleshooting

### Build Errors

**"Cannot find type 'X' in scope"**
- Make sure all files are added to the target
- Check that file imports are correct
- Clean build folder: **Product → Clean Build Folder** (Cmd + Shift + K)

**"Module compiled with Swift X cannot be imported by Swift Y"**
- Update all packages to latest versions
- Clean build folder
- Rebuild

### Runtime Errors

**App crashes on launch**
- Check Console for error messages
- Verify all view model dependencies are injected
- Make sure Core Data model is included

**Photos not loading**
- Check photo library permissions in Settings app
- Verify photo service is saving/loading correctly
- Check Documents directory path

**Slideshow not activating**
- Check idle timer settings
- Verify photos exist in gallery
- Check console for any errors

### Performance Issues

**Slow scrolling in photo gallery**
- Implement image thumbnail caching
- Reduce image quality when saving
- Use lazy loading for large galleries

**Memory warnings**
- Reduce image sizes
- Clear photo cache periodically
- Profile with Instruments

## Testing on Physical Device

1. **Connect iPhone/iPad**
   - Connect your device via USB
   - Trust the computer if prompted

2. **Select Device**
   - In Xcode, select your physical device from device list
   - Make sure it's unlocked

3. **Update Signing**
   - Go to **Signing & Capabilities**
   - Select your team
   - Xcode will provision your device

4. **Build and Run**
   - Press **Cmd + R**
   - App will install on your device
   - If there's a signing error, go to Settings → General → VPN & Device Management
   - Trust your developer certificate

## Next Steps

- Customize the app colors and UI
- Add your own app icon
- Configure app icon and launch screen
- Test all features thoroughly
- Submit to App Store (optional)

## Getting Help

If you encounter issues:

1. Check the error messages carefully
2. Search for the error online
3. Review Apple's documentation
4. Check the Issues section of this repository
5. Make sure all files are properly added to the target

## Tips for Success

- ✅ Build frequently to catch errors early
- ✅ Test on both simulator and device
- ✅ Start with basic features, add Google integration later
- ✅ Read error messages carefully
- ✅ Use version control (Git)
- ✅ Keep Xcode updated

Happy coding! 🎉

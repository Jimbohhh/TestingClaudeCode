//
//  SettingsView.swift
//  CalendarPlanner
//
//  Settings and configuration view
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var idleTimerService: IdleTimerService
    @EnvironmentObject var calendarViewModel: CalendarViewModel

    @State private var idleTimeoutMinutes: Double = 1.0
    @State private var showingGoogleSignIn = false

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Slideshow Settings")) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Idle timeout: \(Int(idleTimeoutMinutes)) minute(s)")
                            .font(.subheadline)

                        Slider(value: $idleTimeoutMinutes, in: 1...10, step: 1)
                            .onChange(of: idleTimeoutMinutes) { oldValue, newValue in
                                idleTimerService.idleTimeoutSeconds = newValue * 60
                            }
                    }

                    Text("The app will enter slideshow mode after being idle for the specified time.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Section(header: Text("Google Calendar")) {
                    Button(action: { showingGoogleSignIn = true }) {
                        HStack {
                            Image(systemName: "person.circle")
                            Text("Sign in with Google")
                        }
                    }

                    Text("Sign in to sync your events with Google Calendar")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Section(header: Text("About")) {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Text("Build")
                        Spacer()
                        Text("1")
                            .foregroundColor(.secondary)
                    }
                }

                Section {
                    Button(role: .destructive, action: clearAllData) {
                        HStack {
                            Spacer()
                            Text("Clear All Data")
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .onAppear {
                idleTimeoutMinutes = idleTimerService.idleTimeoutSeconds / 60
            }
            .alert("Google Sign In", isPresented: $showingGoogleSignIn) {
                Button("OK") { }
            } message: {
                Text("Google Sign In will be configured with your Google Client ID in the Xcode project. Please refer to the README for setup instructions.")
            }
        }
    }

    private func clearAllData() {
        // This would show a confirmation dialog in a production app
        UserDefaults.standard.removeObject(forKey: "calendarEvents")
        UserDefaults.standard.removeObject(forKey: "stickyNotes")
        UserDefaults.standard.removeObject(forKey: "photos")
    }
}

//
//  MainTabView.swift
//  CalendarPlanner
//
//  Main tab navigation view
//

import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var idleTimerService: IdleTimerService

    var body: some View {
        ZStack {
            if idleTimerService.isIdle {
                PhotoSlideshowView()
                    .transition(.opacity)
            } else {
                TabView {
                    CalendarView()
                        .tabItem {
                            Label("Calendar", systemImage: "calendar")
                        }

                    StickyNotesView()
                        .tabItem {
                            Label("Notes", systemImage: "note.text")
                        }

                    PhotoGalleryView()
                        .tabItem {
                            Label("Photos", systemImage: "photo.on.rectangle")
                        }

                    SettingsView()
                        .tabItem {
                            Label("Settings", systemImage: "gear")
                        }
                }
                .onTapGesture {
                    idleTimerService.recordActivity()
                }
            }
        }
        .animation(.easeInOut, value: idleTimerService.isIdle)
    }
}

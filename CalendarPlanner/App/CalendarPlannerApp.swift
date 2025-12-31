//
//  CalendarPlannerApp.swift
//  CalendarPlanner
//
//  Main app entry point
//

import SwiftUI

@main
struct CalendarPlannerApp: App {
    let persistenceController = PersistenceController.shared
    @StateObject private var calendarViewModel = CalendarViewModel()
    @StateObject private var stickyNoteViewModel = StickyNoteViewModel()
    @StateObject private var photoViewModel = PhotoViewModel()
    @StateObject private var idleTimerService = IdleTimerService()

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .environmentObject(calendarViewModel)
                .environmentObject(stickyNoteViewModel)
                .environmentObject(photoViewModel)
                .environmentObject(idleTimerService)
                .onAppear {
                    idleTimerService.startMonitoring()
                }
        }
    }
}

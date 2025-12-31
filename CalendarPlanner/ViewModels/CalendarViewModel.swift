//
//  CalendarViewModel.swift
//  CalendarPlanner
//
//  ViewModel for calendar management
//

import Foundation
import Combine

@MainActor
class CalendarViewModel: ObservableObject {
    @Published var events: [CalendarEvent] = []
    @Published var selectedDate: Date = Date()
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    private let googleCalendarService = GoogleCalendarService()
    private var cancellables = Set<AnyCancellable>()

    init() {
        loadEvents()
    }

    // MARK: - Event Management

    func loadEvents() {
        // Load events from UserDefaults
        if let data = UserDefaults.standard.data(forKey: "calendarEvents"),
           let decoded = try? JSONDecoder().decode([CalendarEvent].self, from: data) {
            events = decoded
        }
    }

    func saveEvents() {
        if let encoded = try? JSONEncoder().encode(events) {
            UserDefaults.standard.set(encoded, forKey: "calendarEvents")
        }
    }

    func addEvent(_ event: CalendarEvent) {
        events.append(event)
        saveEvents()
    }

    func updateEvent(_ event: CalendarEvent) {
        if let index = events.firstIndex(where: { $0.id == event.id }) {
            events[index] = event
            saveEvents()
        }
    }

    func deleteEvent(_ event: CalendarEvent) {
        events.removeAll { $0.id == event.id }
        saveEvents()
    }

    func eventsForDate(_ date: Date) -> [CalendarEvent] {
        let calendar = Calendar.current
        return events.filter { event in
            calendar.isDate(event.startDate, inSameDayAs: date)
        }
    }

    // MARK: - Google Calendar Integration

    func syncWithGoogleCalendar() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let googleEvents = try await googleCalendarService.fetchEvents()
            // Merge Google events with local events
            for googleEvent in googleEvents {
                if !events.contains(where: { $0.googleEventId == googleEvent.googleEventId }) {
                    events.append(googleEvent)
                }
            }
            saveEvents()
        } catch {
            errorMessage = "Failed to sync with Google Calendar: \(error.localizedDescription)"
        }
    }

    func addEventToGoogleCalendar(_ event: CalendarEvent) async {
        do {
            let googleEventId = try await googleCalendarService.createEvent(event)
            var updatedEvent = event
            updatedEvent.googleEventId = googleEventId
            updatedEvent.isFromGoogle = true
            updateEvent(updatedEvent)
        } catch {
            errorMessage = "Failed to add event to Google Calendar: \(error.localizedDescription)"
        }
    }
}

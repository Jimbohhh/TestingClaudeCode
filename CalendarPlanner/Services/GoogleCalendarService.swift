//
//  GoogleCalendarService.swift
//  CalendarPlanner
//
//  Service for Google Calendar API integration
//

import Foundation

class GoogleCalendarService {
    private let clientId = "YOUR_GOOGLE_CLIENT_ID" // Configure in Xcode project
    private let apiKey = "YOUR_GOOGLE_API_KEY" // Configure in Xcode project
    private var accessToken: String?

    // MARK: - Authentication

    func authenticate() async throws {
        // TODO: Implement Google OAuth2 authentication
        // This would use Google Sign-In SDK for iOS
        // For now, this is a placeholder
        throw GoogleCalendarError.notImplemented
    }

    func isAuthenticated() -> Bool {
        return accessToken != nil
    }

    // MARK: - Fetch Events

    func fetchEvents(from startDate: Date = Date(), to endDate: Date = Calendar.current.date(byAdding: .month, value: 1, to: Date())!) async throws -> [CalendarEvent] {
        guard let accessToken = accessToken else {
            throw GoogleCalendarError.notAuthenticated
        }

        // Build the request URL
        var components = URLComponents(string: "https://www.googleapis.com/calendar/v3/calendars/primary/events")!
        components.queryItems = [
            URLQueryItem(name: "timeMin", value: ISO8601DateFormatter().string(from: startDate)),
            URLQueryItem(name: "timeMax", value: ISO8601DateFormatter().string(from: endDate)),
            URLQueryItem(name: "singleEvents", value: "true"),
            URLQueryItem(name: "orderBy", value: "startTime")
        ]

        var request = URLRequest(url: components.url!)
        request.addValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw GoogleCalendarError.requestFailed
        }

        let googleResponse = try JSONDecoder().decode(GoogleCalendarEventsResponse.self, from: data)
        return googleResponse.items.map { $0.toCalendarEvent() }
    }

    // MARK: - Create Event

    func createEvent(_ event: CalendarEvent) async throws -> String {
        guard let accessToken = accessToken else {
            throw GoogleCalendarError.notAuthenticated
        }

        let url = URL(string: "https://www.googleapis.com/calendar/v3/calendars/primary/events")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        let googleEvent = GoogleEvent(from: event)
        request.httpBody = try JSONEncoder().encode(googleEvent)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw GoogleCalendarError.requestFailed
        }

        let createdEvent = try JSONDecoder().decode(GoogleEvent.self, from: data)
        return createdEvent.id
    }

    // MARK: - Update Event

    func updateEvent(_ event: CalendarEvent) async throws {
        guard let accessToken = accessToken, let eventId = event.googleEventId else {
            throw GoogleCalendarError.notAuthenticated
        }

        let url = URL(string: "https://www.googleapis.com/calendar/v3/calendars/primary/events/\(eventId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.addValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        let googleEvent = GoogleEvent(from: event)
        request.httpBody = try JSONEncoder().encode(googleEvent)

        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw GoogleCalendarError.requestFailed
        }
    }

    // MARK: - Delete Event

    func deleteEvent(_ eventId: String) async throws {
        guard let accessToken = accessToken else {
            throw GoogleCalendarError.notAuthenticated
        }

        let url = URL(string: "https://www.googleapis.com/calendar/v3/calendars/primary/events/\(eventId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.addValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 204 else {
            throw GoogleCalendarError.requestFailed
        }
    }
}

// MARK: - Google Calendar Models

struct GoogleCalendarEventsResponse: Codable {
    let items: [GoogleEvent]
}

struct GoogleEvent: Codable {
    let id: String
    let summary: String?
    let description: String?
    let start: GoogleEventDateTime
    let end: GoogleEventDateTime
    let colorId: String?

    init(from event: CalendarEvent) {
        self.id = event.googleEventId ?? UUID().uuidString
        self.summary = event.title
        self.description = event.description
        self.start = GoogleEventDateTime(dateTime: event.startDate, isAllDay: event.isAllDay)
        self.end = GoogleEventDateTime(dateTime: event.endDate, isAllDay: event.isAllDay)
        self.colorId = event.color
    }

    func toCalendarEvent() -> CalendarEvent {
        CalendarEvent(
            title: summary ?? "Untitled",
            description: description ?? "",
            startDate: start.dateTime ?? Date(),
            endDate: end.dateTime ?? Date(),
            isAllDay: start.date != nil,
            color: colorId ?? "blue",
            googleEventId: id,
            isFromGoogle: true
        )
    }
}

struct GoogleEventDateTime: Codable {
    let dateTime: Date?
    let date: String?
    let timeZone: String?

    init(dateTime: Date, isAllDay: Bool) {
        if isAllDay {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            self.date = formatter.string(from: dateTime)
            self.dateTime = nil
        } else {
            self.dateTime = dateTime
            self.date = nil
        }
        self.timeZone = TimeZone.current.identifier
    }
}

// MARK: - Errors

enum GoogleCalendarError: Error {
    case notAuthenticated
    case requestFailed
    case notImplemented

    var localizedDescription: String {
        switch self {
        case .notAuthenticated:
            return "Not authenticated with Google Calendar"
        case .requestFailed:
            return "Google Calendar request failed"
        case .notImplemented:
            return "Feature not yet implemented"
        }
    }
}

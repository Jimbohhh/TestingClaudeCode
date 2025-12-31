//
//  CalendarEvent.swift
//  CalendarPlanner
//
//  Model for calendar events
//

import Foundation

struct CalendarEvent: Identifiable, Codable {
    var id: UUID
    var title: String
    var description: String
    var startDate: Date
    var endDate: Date
    var isAllDay: Bool
    var color: String
    var googleEventId: String?
    var isFromGoogle: Bool

    init(
        id: UUID = UUID(),
        title: String,
        description: String = "",
        startDate: Date,
        endDate: Date,
        isAllDay: Bool = false,
        color: String = "blue",
        googleEventId: String? = nil,
        isFromGoogle: Bool = false
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.startDate = startDate
        self.endDate = endDate
        self.isAllDay = isAllDay
        self.color = color
        self.googleEventId = googleEventId
        self.isFromGoogle = isFromGoogle
    }
}

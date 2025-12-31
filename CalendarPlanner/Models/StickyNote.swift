//
//  StickyNote.swift
//  CalendarPlanner
//
//  Model for sticky notes
//

import Foundation
import SwiftUI

struct StickyNote: Identifiable, Codable {
    var id: UUID
    var content: String
    var color: String
    var position: CGPoint
    var createdDate: Date
    var modifiedDate: Date

    init(
        id: UUID = UUID(),
        content: String,
        color: String = "yellow",
        position: CGPoint = .zero,
        createdDate: Date = Date(),
        modifiedDate: Date = Date()
    ) {
        self.id = id
        self.content = content
        self.color = color
        self.position = position
        self.createdDate = createdDate
        self.modifiedDate = modifiedDate
    }
}

// Color options for sticky notes
enum StickyNoteColor: String, CaseIterable {
    case yellow = "yellow"
    case pink = "pink"
    case blue = "blue"
    case green = "green"
    case purple = "purple"
    case orange = "orange"

    var colorValue: Color {
        switch self {
        case .yellow: return Color(red: 1.0, green: 0.95, blue: 0.6)
        case .pink: return Color(red: 1.0, green: 0.75, blue: 0.8)
        case .blue: return Color(red: 0.68, green: 0.85, blue: 0.9)
        case .green: return Color(red: 0.68, green: 0.93, blue: 0.68)
        case .purple: return Color(red: 0.85, green: 0.75, blue: 0.93)
        case .orange: return Color(red: 1.0, green: 0.8, blue: 0.6)
        }
    }
}

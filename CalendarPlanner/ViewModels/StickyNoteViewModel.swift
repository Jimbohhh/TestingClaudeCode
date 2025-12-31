//
//  StickyNoteViewModel.swift
//  CalendarPlanner
//
//  ViewModel for sticky notes management
//

import Foundation
import SwiftUI

@MainActor
class StickyNoteViewModel: ObservableObject {
    @Published var notes: [StickyNote] = []

    init() {
        loadNotes()
    }

    func loadNotes() {
        if let data = UserDefaults.standard.data(forKey: "stickyNotes"),
           let decoded = try? JSONDecoder().decode([StickyNote].self, from: data) {
            notes = decoded
        }
    }

    func saveNotes() {
        if let encoded = try? JSONEncoder().encode(notes) {
            UserDefaults.standard.set(encoded, forKey: "stickyNotes")
        }
    }

    func addNote(_ note: StickyNote) {
        notes.append(note)
        saveNotes()
    }

    func updateNote(_ note: StickyNote) {
        if let index = notes.firstIndex(where: { $0.id == note.id }) {
            var updatedNote = note
            updatedNote.modifiedDate = Date()
            notes[index] = updatedNote
            saveNotes()
        }
    }

    func deleteNote(_ note: StickyNote) {
        notes.removeAll { $0.id == note.id }
        saveNotes()
    }

    func updateNotePosition(_ note: StickyNote, position: CGPoint) {
        if let index = notes.firstIndex(where: { $0.id == note.id }) {
            var updatedNote = note
            updatedNote.position = position
            notes[index] = updatedNote
            saveNotes()
        }
    }
}

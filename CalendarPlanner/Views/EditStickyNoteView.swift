//
//  EditStickyNoteView.swift
//  CalendarPlanner
//
//  View for editing sticky notes
//

import SwiftUI

struct EditStickyNoteView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var viewModel: StickyNoteViewModel

    let note: StickyNote

    @State private var content = ""
    @State private var selectedColor = StickyNoteColor.yellow

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Note Content")) {
                    TextEditor(text: $content)
                        .frame(height: 200)
                }

                Section(header: Text("Color")) {
                    Picker("Color", selection: $selectedColor) {
                        ForEach(StickyNoteColor.allCases, id: \.self) { color in
                            HStack {
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(color.colorValue)
                                    .frame(width: 30, height: 30)
                                Text(color.rawValue.capitalized)
                            }
                            .tag(color)
                        }
                    }
                }
            }
            .navigationTitle("Edit Note")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        updateNote()
                    }
                    .disabled(content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .onAppear {
                content = note.content
                selectedColor = StickyNoteColor(rawValue: note.color) ?? .yellow
            }
        }
    }

    private func updateNote() {
        var updatedNote = note
        updatedNote.content = content
        updatedNote.color = selectedColor.rawValue
        viewModel.updateNote(updatedNote)
        dismiss()
    }
}

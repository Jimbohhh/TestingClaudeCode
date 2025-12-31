//
//  AddStickyNoteView.swift
//  CalendarPlanner
//
//  View for adding new sticky notes
//

import SwiftUI

struct AddStickyNoteView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var viewModel: StickyNoteViewModel

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
            .navigationTitle("New Note")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") {
                        addNote()
                    }
                    .disabled(content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }

    private func addNote() {
        let note = StickyNote(
            content: content,
            color: selectedColor.rawValue
        )
        viewModel.addNote(note)
        dismiss()
    }
}

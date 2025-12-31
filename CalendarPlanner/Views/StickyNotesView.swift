//
//  StickyNotesView.swift
//  CalendarPlanner
//
//  Sticky notes board view
//

import SwiftUI

struct StickyNotesView: View {
    @EnvironmentObject var viewModel: StickyNoteViewModel
    @EnvironmentObject var idleTimerService: IdleTimerService
    @State private var showingAddNote = false

    var body: some View {
        NavigationView {
            ZStack {
                Color(.systemGroupedBackground)
                    .ignoresSafeArea()

                ScrollView {
                    LazyVStack(spacing: 20) {
                        ForEach(viewModel.notes) { note in
                            StickyNoteCard(note: note)
                        }
                    }
                    .padding()
                }

                if viewModel.notes.isEmpty {
                    VStack {
                        Image(systemName: "note.text")
                            .font(.system(size: 60))
                            .foregroundColor(.secondary)
                        Text("No sticky notes yet")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        Text("Tap + to add your first note")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Sticky Notes")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddNote = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddNote) {
                AddStickyNoteView()
            }
            .onAppear {
                idleTimerService.recordActivity()
            }
        }
    }
}

struct StickyNoteCard: View {
    @EnvironmentObject var viewModel: StickyNoteViewModel
    let note: StickyNote

    @State private var showingEditSheet = false
    @State private var showingDeleteAlert = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(note.content)
                .font(.body)
                .foregroundColor(.black)

            Spacer()

            Text(formatDate(note.modifiedDate))
                .font(.caption)
                .foregroundColor(.black.opacity(0.6))
        }
        .padding()
        .frame(maxWidth: .infinity, minHeight: 150, alignment: .topLeading)
        .background(colorForNote(note))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 2, y: 2)
        .contextMenu {
            Button(action: { showingEditSheet = true }) {
                Label("Edit", systemImage: "pencil")
            }

            Button(role: .destructive, action: { showingDeleteAlert = true }) {
                Label("Delete", systemImage: "trash")
            }
        }
        .onTapGesture {
            showingEditSheet = true
        }
        .sheet(isPresented: $showingEditSheet) {
            EditStickyNoteView(note: note)
        }
        .alert("Delete Note", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                viewModel.deleteNote(note)
            }
        } message: {
            Text("Are you sure you want to delete this note?")
        }
    }

    private func colorForNote(_ note: StickyNote) -> Color {
        StickyNoteColor(rawValue: note.color)?.colorValue ?? StickyNoteColor.yellow.colorValue
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

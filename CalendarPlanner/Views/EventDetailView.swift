//
//  EventDetailView.swift
//  CalendarPlanner
//
//  View for displaying and editing event details
//

import SwiftUI

struct EventDetailView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var viewModel: CalendarViewModel

    let event: CalendarEvent

    @State private var isEditing = false
    @State private var showingDeleteAlert = false

    var body: some View {
        NavigationView {
            List {
                Section(header: Text("Details")) {
                    HStack {
                        Image(systemName: "text.alignleft")
                            .foregroundColor(.secondary)
                        Text(event.title)
                    }

                    if !event.description.isEmpty {
                        HStack(alignment: .top) {
                            Image(systemName: "doc.text")
                                .foregroundColor(.secondary)
                            Text(event.description)
                        }
                    }
                }

                Section(header: Text("Date & Time")) {
                    HStack {
                        Image(systemName: "calendar")
                            .foregroundColor(.secondary)
                        Text(formatDate(event.startDate))
                    }

                    if !event.isAllDay {
                        HStack {
                            Image(systemName: "clock")
                                .foregroundColor(.secondary)
                            Text(formatTime(from: event.startDate, to: event.endDate))
                        }
                    } else {
                        HStack {
                            Image(systemName: "clock")
                                .foregroundColor(.secondary)
                            Text("All day")
                        }
                    }
                }

                Section(header: Text("Status")) {
                    HStack {
                        Image(systemName: event.isFromGoogle ? "cloud" : "internaldrive")
                            .foregroundColor(.secondary)
                        Text(event.isFromGoogle ? "Synced with Google Calendar" : "Local event")
                    }
                }

                Section {
                    Button(role: .destructive, action: {
                        showingDeleteAlert = true
                    }) {
                        HStack {
                            Spacer()
                            Text("Delete Event")
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Event Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .alert("Delete Event", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    viewModel.deleteEvent(event)
                    dismiss()
                }
            } message: {
                Text("Are you sure you want to delete this event?")
            }
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .long
        return formatter.string(from: date)
    }

    private func formatTime(from start: Date, to end: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return "\(formatter.string(from: start)) - \(formatter.string(from: end))"
    }
}

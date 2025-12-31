//
//  AddEventView.swift
//  CalendarPlanner
//
//  View for adding new calendar events
//

import SwiftUI

struct AddEventView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var viewModel: CalendarViewModel

    @State private var title = ""
    @State private var description = ""
    @State private var startDate = Date()
    @State private var endDate = Date().addingTimeInterval(3600)
    @State private var isAllDay = false
    @State private var selectedColor = "blue"
    @State private var addToGoogle = false

    private let colors = ["blue", "red", "green", "yellow", "purple", "orange"]

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Event Details")) {
                    TextField("Title", text: $title)

                    TextEditor(text: $description)
                        .frame(height: 100)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                }

                Section(header: Text("Date & Time")) {
                    Toggle("All Day", isOn: $isAllDay)

                    DatePicker("Start", selection: $startDate, displayedComponents: isAllDay ? [.date] : [.date, .hourAndMinute])

                    DatePicker("End", selection: $endDate, displayedComponents: isAllDay ? [.date] : [.date, .hourAndMinute])
                }

                Section(header: Text("Appearance")) {
                    Picker("Color", selection: $selectedColor) {
                        ForEach(colors, id: \.self) { color in
                            HStack {
                                Circle()
                                    .fill(colorForName(color))
                                    .frame(width: 20, height: 20)
                                Text(color.capitalized)
                            }
                            .tag(color)
                        }
                    }
                }

                Section(header: Text("Sync")) {
                    Toggle("Add to Google Calendar", isOn: $addToGoogle)
                }
            }
            .navigationTitle("New Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") {
                        addEvent()
                    }
                    .disabled(title.isEmpty)
                }
            }
        }
    }

    private func addEvent() {
        let event = CalendarEvent(
            title: title,
            description: description,
            startDate: startDate,
            endDate: endDate,
            isAllDay: isAllDay,
            color: selectedColor
        )

        viewModel.addEvent(event)

        if addToGoogle {
            Task {
                await viewModel.addEventToGoogleCalendar(event)
            }
        }

        dismiss()
    }

    private func colorForName(_ name: String) -> Color {
        switch name {
        case "red": return .red
        case "blue": return .blue
        case "green": return .green
        case "yellow": return .yellow
        case "purple": return .purple
        case "orange": return .orange
        default: return .blue
        }
    }
}

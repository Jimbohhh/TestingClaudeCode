//
//  CalendarView.swift
//  CalendarPlanner
//
//  Calendar view with month/week/day views
//

import SwiftUI

struct CalendarView: View {
    @EnvironmentObject var viewModel: CalendarViewModel
    @EnvironmentObject var idleTimerService: IdleTimerService
    @State private var showingAddEvent = false
    @State private var selectedEvent: CalendarEvent?
    @State private var viewMode: CalendarViewMode = .month

    var body: some View {
        NavigationView {
            VStack {
                // Calendar view mode picker
                Picker("View", selection: $viewMode) {
                    Text("Month").tag(CalendarViewMode.month)
                    Text("Week").tag(CalendarViewMode.week)
                    Text("Day").tag(CalendarViewMode.day)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()

                // Calendar display
                ScrollView {
                    VStack(spacing: 20) {
                        // Calendar header
                        HStack {
                            Button(action: previousPeriod) {
                                Image(systemName: "chevron.left")
                            }

                            Spacer()

                            Text(headerText)
                                .font(.title2)
                                .fontWeight(.bold)

                            Spacer()

                            Button(action: nextPeriod) {
                                Image(systemName: "chevron.right")
                            }
                        }
                        .padding(.horizontal)

                        // Calendar grid
                        switch viewMode {
                        case .month:
                            MonthCalendarView(selectedDate: $viewModel.selectedDate)
                        case .week:
                            WeekCalendarView(selectedDate: $viewModel.selectedDate)
                        case .day:
                            DayCalendarView(selectedDate: $viewModel.selectedDate)
                        }

                        // Events for selected date
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Events")
                                .font(.headline)
                                .padding(.horizontal)

                            ForEach(viewModel.eventsForDate(viewModel.selectedDate)) { event in
                                EventRowView(event: event)
                                    .onTapGesture {
                                        selectedEvent = event
                                    }
                            }
                        }
                        .padding()
                    }
                }

                Spacer()
            }
            .navigationTitle("Calendar")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddEvent = true }) {
                        Image(systemName: "plus")
                    }
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: syncGoogleCalendar) {
                        Image(systemName: "arrow.triangle.2.circlepath")
                    }
                }
            }
            .sheet(isPresented: $showingAddEvent) {
                AddEventView()
            }
            .sheet(item: $selectedEvent) { event in
                EventDetailView(event: event)
            }
            .onAppear {
                idleTimerService.recordActivity()
            }
        }
    }

    private var headerText: String {
        let formatter = DateFormatter()
        switch viewMode {
        case .month:
            formatter.dateFormat = "MMMM yyyy"
        case .week:
            formatter.dateFormat = "MMM d, yyyy"
        case .day:
            formatter.dateFormat = "EEEE, MMMM d, yyyy"
        }
        return formatter.string(from: viewModel.selectedDate)
    }

    private func previousPeriod() {
        let calendar = Calendar.current
        switch viewMode {
        case .month:
            viewModel.selectedDate = calendar.date(byAdding: .month, value: -1, to: viewModel.selectedDate) ?? viewModel.selectedDate
        case .week:
            viewModel.selectedDate = calendar.date(byAdding: .weekOfYear, value: -1, to: viewModel.selectedDate) ?? viewModel.selectedDate
        case .day:
            viewModel.selectedDate = calendar.date(byAdding: .day, value: -1, to: viewModel.selectedDate) ?? viewModel.selectedDate
        }
    }

    private func nextPeriod() {
        let calendar = Calendar.current
        switch viewMode {
        case .month:
            viewModel.selectedDate = calendar.date(byAdding: .month, value: 1, to: viewModel.selectedDate) ?? viewModel.selectedDate
        case .week:
            viewModel.selectedDate = calendar.date(byAdding: .weekOfYear, value: 1, to: viewModel.selectedDate) ?? viewModel.selectedDate
        case .day:
            viewModel.selectedDate = calendar.date(byAdding: .day, value: 1, to: viewModel.selectedDate) ?? viewModel.selectedDate
        }
    }

    private func syncGoogleCalendar() {
        Task {
            await viewModel.syncWithGoogleCalendar()
        }
    }
}

enum CalendarViewMode {
    case month, week, day
}

// MARK: - Event Row View

struct EventRowView: View {
    let event: CalendarEvent

    var body: some View {
        HStack {
            Rectangle()
                .fill(colorForEvent(event))
                .frame(width: 4)

            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.headline)

                if !event.description.isEmpty {
                    Text(event.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }

                HStack {
                    Image(systemName: "clock")
                        .font(.caption)
                    Text(timeString(for: event))
                        .font(.caption)
                }
                .foregroundColor(.secondary)
            }
            .padding(.vertical, 8)

            Spacer()

            if event.isFromGoogle {
                Image(systemName: "cloud")
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
        .padding(.horizontal)
    }

    private func colorForEvent(_ event: CalendarEvent) -> Color {
        switch event.color {
        case "red": return .red
        case "blue": return .blue
        case "green": return .green
        case "yellow": return .yellow
        case "purple": return .purple
        case "orange": return .orange
        default: return .blue
        }
    }

    private func timeString(for event: CalendarEvent) -> String {
        if event.isAllDay {
            return "All day"
        }

        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return "\(formatter.string(from: event.startDate)) - \(formatter.string(from: event.endDate))"
    }
}

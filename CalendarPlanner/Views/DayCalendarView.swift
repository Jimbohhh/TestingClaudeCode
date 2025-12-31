//
//  DayCalendarView.swift
//  CalendarPlanner
//
//  Day calendar view with hourly slots
//

import SwiftUI

struct DayCalendarView: View {
    @Binding var selectedDate: Date
    @EnvironmentObject var viewModel: CalendarViewModel

    private let hours = Array(0...23)

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(hours, id: \.self) { hour in
                    HStack(alignment: .top) {
                        // Time label
                        Text(timeString(for: hour))
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .frame(width: 60, alignment: .trailing)
                            .padding(.trailing, 10)

                        // Hour slot
                        VStack {
                            Divider()

                            // Events for this hour
                            ForEach(eventsForHour(hour)) { event in
                                HStack {
                                    Rectangle()
                                        .fill(Color.blue)
                                        .frame(width: 3)

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(event.title)
                                            .font(.subheadline)
                                            .fontWeight(.semibold)

                                        Text(timeString(for: event))
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                    .padding(.vertical, 4)
                                    .padding(.horizontal, 8)

                                    Spacer()
                                }
                                .background(Color.blue.opacity(0.1))
                                .cornerRadius(6)
                                .padding(.vertical, 2)
                            }

                            Spacer()
                        }
                        .frame(minHeight: 60)
                    }
                }
            }
            .padding()
        }
    }

    private func timeString(for hour: Int) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h a"
        let date = Calendar.current.date(bySettingHour: hour, minute: 0, second: 0, of: Date())!
        return formatter.string(from: date)
    }

    private func timeString(for event: CalendarEvent) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return "\(formatter.string(from: event.startDate)) - \(formatter.string(from: event.endDate))"
    }

    private func eventsForHour(_ hour: Int) -> [CalendarEvent] {
        let calendar = Calendar.current
        return viewModel.eventsForDate(selectedDate).filter { event in
            let eventHour = calendar.component(.hour, from: event.startDate)
            return eventHour == hour
        }
    }
}

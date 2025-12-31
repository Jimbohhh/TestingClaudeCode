//
//  MonthCalendarView.swift
//  CalendarPlanner
//
//  Month calendar grid view
//

import SwiftUI

struct MonthCalendarView: View {
    @Binding var selectedDate: Date
    @EnvironmentObject var viewModel: CalendarViewModel

    private let calendar = Calendar.current
    private let daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    var body: some View {
        VStack {
            // Days of week header
            HStack {
                ForEach(daysOfWeek, id: \.self) { day in
                    Text(day)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal)

            // Calendar grid
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 10) {
                ForEach(daysInMonth(), id: \.self) { date in
                    if let date = date {
                        DayCell(date: date, selectedDate: $selectedDate, events: viewModel.eventsForDate(date))
                    } else {
                        Color.clear
                            .frame(height: 50)
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    private func daysInMonth() -> [Date?] {
        var days: [Date?] = []

        let components = calendar.dateComponents([.year, .month], from: selectedDate)
        guard let firstDayOfMonth = calendar.date(from: components) else { return [] }

        let range = calendar.range(of: .day, in: .month, for: firstDayOfMonth)!
        let firstWeekday = calendar.component(.weekday, from: firstDayOfMonth)

        // Add empty cells for days before the first day of the month
        for _ in 1..<firstWeekday {
            days.append(nil)
        }

        // Add all days in the month
        for day in range {
            if let date = calendar.date(byAdding: .day, value: day - 1, to: firstDayOfMonth) {
                days.append(date)
            }
        }

        return days
    }
}

struct DayCell: View {
    let date: Date
    @Binding var selectedDate: Date
    let events: [CalendarEvent]

    private let calendar = Calendar.current

    var body: some View {
        VStack {
            Text("\(calendar.component(.day, from: date))")
                .font(.system(size: 16))
                .fontWeight(isToday ? .bold : .regular)
                .foregroundColor(isSelected ? .white : (isToday ? .blue : .primary))
                .frame(width: 40, height: 40)
                .background(isSelected ? Color.blue : (isToday ? Color.blue.opacity(0.1) : Color.clear))
                .cornerRadius(20)

            if !events.isEmpty {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 4, height: 4)
            }
        }
        .frame(height: 50)
        .onTapGesture {
            selectedDate = date
        }
    }

    private var isToday: Bool {
        calendar.isDateInToday(date)
    }

    private var isSelected: Bool {
        calendar.isDate(date, inSameDayAs: selectedDate)
    }
}

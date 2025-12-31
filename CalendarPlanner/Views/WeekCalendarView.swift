//
//  WeekCalendarView.swift
//  CalendarPlanner
//
//  Week calendar view
//

import SwiftUI

struct WeekCalendarView: View {
    @Binding var selectedDate: Date
    @EnvironmentObject var viewModel: CalendarViewModel

    private let calendar = Calendar.current

    var body: some View {
        VStack {
            HStack(spacing: 10) {
                ForEach(daysInWeek(), id: \.self) { date in
                    VStack {
                        Text(dayName(for: date))
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Text("\(calendar.component(.day, from: date))")
                            .font(.title3)
                            .fontWeight(isSelected(date) ? .bold : .regular)
                            .foregroundColor(isSelected(date) ? .white : .primary)
                            .frame(width: 40, height: 40)
                            .background(isSelected(date) ? Color.blue : Color.clear)
                            .cornerRadius(20)

                        if !viewModel.eventsForDate(date).isEmpty {
                            Circle()
                                .fill(Color.blue)
                                .frame(width: 4, height: 4)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .onTapGesture {
                        selectedDate = date
                    }
                }
            }
            .padding()
        }
    }

    private func daysInWeek() -> [Date] {
        var days: [Date] = []
        let weekday = calendar.component(.weekday, from: selectedDate)
        let startOfWeek = calendar.date(byAdding: .day, value: -(weekday - 1), to: selectedDate)!

        for i in 0..<7 {
            if let day = calendar.date(byAdding: .day, value: i, to: startOfWeek) {
                days.append(day)
            }
        }

        return days
    }

    private func dayName(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date)
    }

    private func isSelected(_ date: Date) -> Bool {
        calendar.isDate(date, inSameDayAs: selectedDate)
    }
}

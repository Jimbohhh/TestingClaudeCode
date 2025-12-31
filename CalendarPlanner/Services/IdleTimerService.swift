//
//  IdleTimerService.swift
//  CalendarPlanner
//
//  Service for detecting idle state and triggering slideshow
//

import Foundation
import SwiftUI
import Combine

@MainActor
class IdleTimerService: ObservableObject {
    @Published var isIdle: Bool = false
    @Published var idleTimeoutSeconds: TimeInterval = 60 // 1 minute default

    private var lastActivityTime: Date = Date()
    private var timer: Timer?

    func startMonitoring() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.checkIdleState()
        }
    }

    func stopMonitoring() {
        timer?.invalidate()
        timer = nil
    }

    func recordActivity() {
        lastActivityTime = Date()
        if isIdle {
            isIdle = false
        }
    }

    private func checkIdleState() {
        let idleTime = Date().timeIntervalSince(lastActivityTime)
        if idleTime >= idleTimeoutSeconds && !isIdle {
            isIdle = true
        }
    }

    deinit {
        stopMonitoring()
    }
}

import EventKit
import PlaintextKit
import SwiftUI
import WidgetKit

struct CalendarAccessRow: View {
  // MARK: State
  @State private var status = EKEventStore.authorizationStatus(for: .event)

  // MARK: Body
  var body: some View {
    switch status {
    case .fullAccess:
      Label("Calendar connected", systemImage: "checkmark")
    case .notDetermined:
      Button("Allow calendar access") {
        Task {
          _ = try? await EKEventStore().requestFullAccessToEvents()
          status = EKEventStore.authorizationStatus(for: .event)
          WidgetCenter.shared.reloadAllTimelines()
        }
      }
    default:
      Text("Calendar access is off. Turn it on in Settings → Privacy → Calendars.")
        .font(.footnote)
        .foregroundStyle(.secondary)
    }
  }
}

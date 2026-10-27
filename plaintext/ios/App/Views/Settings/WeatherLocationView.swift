import PlaintextKit
import SwiftUI
import WeatherKit
import WidgetKit

struct WeatherLocationView: View {
  // MARK: State
  @Environment(AppModel.self) private var model
  @Environment(LocationModel.self) private var location
  @Environment(\.dismiss) private var dismiss
  @State private var query = ""
  @State private var results: [Preferences.WeatherLocation] = []

  // MARK: Body
  var body: some View {
    List {
      Button("Current location") {
        select(.current)
        location.requestIfNeeded()
      }
      if location.isDenied {
        Text("Location is off for Plaintext. Turn it on in Settings, or search for a city.")
          .font(.footnote)
          .foregroundStyle(.secondary)
      }
      ForEach(results, id: \.self) { result in
        if case .fixed(let name, _, _) = result {
          Button(name) { select(result) }
        }
      }
    }
    .searchable(text: $query, prompt: "City")
    .onSubmit(of: .search) {
      Task { results = await location.search(city: query) }
    }
    .navigationTitle("Weather location")
  }

  // MARK: Handlers
  private func select(_ weatherLocation: Preferences.WeatherLocation) {
    model.updateConfiguration { $0.preferences.weatherLocation = weatherLocation }
    model.updateState { $0.weather = nil }
    Task {
      _ = await HeaderDataSource.refreshWeather(store: model.store, preferences: model.configuration.preferences)
      model.reload()
      WidgetCenter.shared.reloadAllTimelines()
    }
    dismiss()
  }
}

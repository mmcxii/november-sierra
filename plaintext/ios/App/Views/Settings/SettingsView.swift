import PlaintextKit
import SwiftUI
import WeatherKit
import WidgetKit

struct SettingsView: View {
  // MARK: State
  @Environment(AppModel.self) private var model
  @Environment(StoreModel.self) private var storeModel
  @State private var attribution: WeatherAttribution?
  @State private var wallpaperMessage: String?

  // MARK: Body
  var body: some View {
    let preferences = model.configuration.preferences
    Form {
      Section("Look") {
        ThemeControls()
      }

      Section {
        Button("Save Wallpaper") {
          Task {
            do {
              try await WallpaperTools.saveToPhotos(model.configuration.theme)
              wallpaperMessage = "Saved a light photo and a dark photo."
            } catch {
              wallpaperMessage = error.localizedDescription
            }
          }
        }
      } header: {
        Text("Wallpaper")
      } footer: {
        Text(
          wallpaperMessage
            ?? "Two photos, one light and one dark. Set the one you want, then turn Blur off. It will not switch."
        )
      }

      Section("Time and weather") {
        Picker("Clock", selection: preference(\.clockFormat)) {
          Text("Automatic").tag(Preferences.ClockFormat.system)
          Text("12-hour").tag(Preferences.ClockFormat.twelveHour)
          Text("24-hour").tag(Preferences.ClockFormat.twentyFourHour)
        }
        Picker("Temperature", selection: preference(\.temperatureUnit)) {
          Text("Automatic").tag(Preferences.TemperatureUnit.system)
          Text("°F").tag(Preferences.TemperatureUnit.fahrenheit)
          Text("°C").tag(Preferences.TemperatureUnit.celsius)
        }
        NavigationLink {
          WeatherLocationView()
        } label: {
          LabeledContent("Weather location", value: locationName(preferences.weatherLocation))
        }
      }

      Section("Setup") {
        Button("Run the setup guide again") { model.restartOnboarding() }
        LabeledContent("Assistant", value: model.state.capabilities.assistantReady ? "Ready" : "Not set up")
        LabeledContent("Phone shortcut", value: model.state.phoneShortcutInstalled ? "Added" : "Not added")
        Link("Help", destination: PlaintextService.helpURL)
      }

      Section {
        if model.entitlements.isPro {
          Label("Plaintext Pro unlocked. Thank you.", systemImage: "heart.fill")
        } else {
          Button("Unlock Plaintext Pro") { model.isShowingPaywall = true }
        }
        Button("Restore purchases") { Task { await storeModel.restore() } }
      } header: {
        Text("Pro")
      } footer: {
        Text("One payment. No subscriptions, ever.")
      }

      Section {
        if let attribution {
          Link(destination: attribution.legalPageURL) {
            AsyncImage(url: attribution.combinedMarkDarkURL) { image in
              image.resizable().scaledToFit().frame(height: 14)
            } placeholder: {
              Text(" Weather")
            }
          }
        }
        Text(
          "Plaintext keeps your apps, settings, and location on this iPhone. The only thing it ever sends is the text of an app search that found nothing, so we know which apps to add."
        )
        .font(.footnote)
        .foregroundStyle(.secondary)
      }
    }
    .navigationTitle("Settings")
    .task { attribution = try? await WeatherService.shared.attribution }
  }

  // MARK: Handlers
  private func preference<Value>(_ keyPath: WritableKeyPath<Preferences, Value>) -> Binding<Value> {
    Binding(
      get: { model.configuration.preferences[keyPath: keyPath] },
      set: { value in model.updateConfiguration { $0.preferences[keyPath: keyPath] = value } }
    )
  }

  private func locationName(_ location: Preferences.WeatherLocation) -> String {
    switch location {
    case .current: "Current location"
    case .fixed(let name, _, _): name
    }
  }
}

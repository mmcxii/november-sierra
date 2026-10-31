import CoreLocation
import Foundation
import Observation
import PlaintextKit
import WidgetKit

/// Only asked for when the user turns on weather, never during first launch.
@MainActor
@Observable
final class LocationModel: NSObject, CLLocationManagerDelegate {
  private let manager = CLLocationManager()
  private let model: AppModel
  private(set) var authorization: CLAuthorizationStatus

  init(model: AppModel) {
    self.model = model
    authorization = manager.authorizationStatus
    super.init()
    manager.delegate = self
    manager.desiredAccuracy = kCLLocationAccuracyKilometer
  }

  var isDenied: Bool {
    authorization == .denied || authorization == .restricted
  }

  func requestIfNeeded() {
    switch manager.authorizationStatus {
    case .notDetermined:
      manager.requestWhenInUseAuthorization()
    case .authorizedWhenInUse, .authorizedAlways:
      manager.requestLocation()
    default:
      break
    }
  }

  func search(city: String) async -> [Preferences.WeatherLocation] {
    let placemarks = (try? await CLGeocoder().geocodeAddressString(city)) ?? []
    return placemarks.compactMap { placemark in
      guard let location = placemark.location else { return nil }
      let name = [placemark.locality, placemark.administrativeArea, placemark.country]
        .compactMap { $0 }
        .joined(separator: ", ")
      return .fixed(name: name, latitude: location.coordinate.latitude, longitude: location.coordinate.longitude)
    }
  }

  nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    let status = manager.authorizationStatus
    Task { @MainActor in
      authorization = status
      if status == .authorizedWhenInUse || status == .authorizedAlways {
        self.manager.requestLocation()
      }
    }
  }

  nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let coordinate = locations.last?.coordinate else { return }
    Task { @MainActor in
      model.updateState {
        $0.lastKnownLocation = Coordinate(latitude: coordinate.latitude, longitude: coordinate.longitude)
        $0.weather = nil
      }
      _ = await HeaderDataSource.refreshWeather(store: model.store, preferences: model.configuration.preferences)
      model.reload()
      WidgetCenter.shared.reloadAllTimelines()
    }
  }

  nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {}
}

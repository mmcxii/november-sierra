import PlaintextKit
import SwiftUI

enum MissedSearchReporter {
  private static let reportedKey = "reportedMissedSearches"

  static func reportIfNeeded(query: String, resultCount: Int) async {
    let defaults = UserDefaults.standard
    let reported = Set(defaults.stringArray(forKey: reportedKey) ?? [])
    guard MissedSearch.shouldReport(query: query, resultCount: resultCount, alreadyReported: reported) else { return }
    let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "0"
    var request = URLRequest(url: PlaintextService.missedSearchURL)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try? JSONEncoder().encode(
      MissedSearch(query: MissedSearch.normalized(query), appVersion: version))
    guard let result = try? await URLSession.shared.data(for: request),
      let http = result.1 as? HTTPURLResponse,
      http.statusCode < 300
    else { return }
    defaults.set(Array(reported.union([MissedSearch.normalized(query)])), forKey: reportedKey)
  }
}

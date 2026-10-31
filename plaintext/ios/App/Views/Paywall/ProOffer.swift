import PlaintextKit
import SwiftUI

/// Shown at the end of onboarding and whenever a locked feature is tapped. Free users keep everything they set up.
struct ProOffer: View {
  // MARK: State
  @Environment(AppModel.self) private var model
  @Environment(StoreModel.self) private var storeModel

  // MARK: Variables
  private static let features = [
    ("square.stack", "Unlimited apps, pages, and headers"),
    ("clock", "Analog clock and every date format"),
    ("cloud.sun", "5 and 10 day forecasts, colored icons"),
    ("hourglass", "Day, month, year, and life countdowns"),
    ("quote.opening", "Quote of the day"),
    ("calendar", "Your next calendar event"),
    ("rectangle.split.2x1", "Side-by-side and stacked headers"),
  ]

  // MARK: Body
  var body: some View {
    VStack(alignment: .leading, spacing: 20) {
      if model.entitlements.isPro {
        Label("Plaintext Pro is unlocked. Thank you.", systemImage: "heart.fill")
          .font(.headline)
      } else {
        VStack(alignment: .leading, spacing: 6) {
          Text("Plaintext Pro")
            .font(.title.weight(.semibold))
          Text("Pay once, keep it forever. No subscriptions, ever.")
            .foregroundStyle(.secondary)
        }
        VStack(alignment: .leading, spacing: 12) {
          ForEach(Self.features, id: \.1) { symbol, title in
            Label(title, systemImage: symbol)
          }
        }
        Button {
          Task { await storeModel.purchase() }
        } label: {
          if let product = storeModel.product {
            Text("Unlock for \(product.displayPrice)")
          } else {
            Text("Unlock Pro")
          }
        }
        .buttonStyle(PrimaryButtonStyle())
        .disabled(storeModel.product == nil || storeModel.isPurchasing)
        Button("Restore purchases") { Task { await storeModel.restore() } }
          .buttonStyle(SecondaryButtonStyle())
        Text("Shared with your Family Sharing group.")
          .font(.footnote)
          .foregroundStyle(.secondary)
        if let error = storeModel.errorMessage {
          Text(error).font(.footnote).foregroundStyle(.red)
        }
      }
    }
  }
}

import Foundation
import Observation
import PlaintextKit
import StoreKit
import WidgetKit

/// A single non-consumable unlock. Family Sharing is enabled on the product in App Store Connect.
@MainActor
@Observable
final class StoreModel {
  private(set) var product: Product?
  private(set) var isPurchasing = false
  var errorMessage: String?

  private let model: AppModel
  private var updates: Task<Void, Never>?

  init(model: AppModel) {
    self.model = model
    updates = Task { [weak self] in
      for await update in Transaction.updates {
        if case .verified(let transaction) = update {
          await transaction.finish()
        }
        await self?.refreshEntitlement()
      }
    }
  }

  func load() async {
    product = try? await Product.products(for: [ProProduct.id]).first
    await refreshEntitlement()
  }

  func purchase() async {
    guard let product else { return }
    isPurchasing = true
    defer { isPurchasing = false }
    do {
      switch try await product.purchase() {
      case .success(.verified(let transaction)):
        await transaction.finish()
        await refreshEntitlement()
      case .success(.unverified):
        errorMessage = "Apple couldn't verify the purchase. Try Restore Purchases."
      case .pending, .userCancelled:
        break
      @unknown default:
        break
      }
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func restore() async {
    try? await AppStore.sync()
    await refreshEntitlement()
  }

  func refreshEntitlement() async {
    var isPro = false
    for await result in Transaction.currentEntitlements {
      if case .verified(let transaction) = result, transaction.productID == ProProduct.id,
        transaction.revocationDate == nil
      {
        isPro = true
      }
    }
    guard isPro != model.state.isPro else { return }
    model.updateState { $0.isPro = isPro }
    WidgetCenter.shared.reloadAllTimelines()
  }
}

import PlaintextKit
import SwiftUI

@main
struct PlaintextApp: App {
  @State private var model: AppModel
  @State private var storeModel: StoreModel
  @State private var location: LocationModel
  @Environment(\.scenePhase) private var scenePhase

  init() {
    let store = SharedStore.appGroup()
    #if DEBUG
      if ProcessInfo.processInfo.arguments.contains("-resetForUITests") {
        store.configuration = .empty
        store.state = SharedState()
      }
    #endif
    let model = AppModel(store: store)
    _model = State(initialValue: model)
    _storeModel = State(initialValue: StoreModel(model: model))
    _location = State(initialValue: LocationModel(model: model))
  }

  var body: some Scene {
    WindowGroup {
      RootView()
        .environment(model)
        .environment(storeModel)
        .environment(location)
        .preferredColorScheme(model.configuration.theme.preferredColorScheme)
        .onOpenURL { model.handle($0) }
        .task {
          await storeModel.load()
          await model.refreshRemoteCatalog()
        }
        .onChange(of: scenePhase) { _, phase in
          if phase == .active { model.reload() }
        }
    }
  }
}

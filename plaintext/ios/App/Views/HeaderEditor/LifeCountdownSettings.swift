import PlaintextKit
import SwiftUI

struct LifeCountdownSettings: View {
  // MARK: State
  @Environment(AppModel.self) private var model

  // MARK: Body
  var body: some View {
    let preferences = model.configuration.preferences
    let currentYear = Calendar.current.component(.year, from: Date())
    Picker(
      "Birth year",
      selection: Binding(
        get: { preferences.birthYear ?? currentYear - 30 },
        set: { year in model.updateConfiguration { $0.preferences.birthYear = year } }
      )
    ) {
      ForEach((currentYear - 100...currentYear).reversed(), id: \.self) { Text(String($0)).tag($0) }
    }
    Stepper(
      "Life expectancy: \(preferences.lifeExpectancyYears)",
      value: Binding(
        get: { preferences.lifeExpectancyYears },
        set: { years in model.updateConfiguration { $0.preferences.lifeExpectancyYears = years } }
      ),
      in: 40...120
    )
  }
}

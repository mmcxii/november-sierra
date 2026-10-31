import PlaintextKit
import SwiftUI

struct NumberedSteps: View {
  let steps: [String]

  var body: some View {
    VStack(alignment: .leading, spacing: 14) {
      ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
        HStack(alignment: .firstTextBaseline, spacing: 12) {
          Text("\(index + 1)")
            .font(.subheadline.monospacedDigit())
            .foregroundStyle(.secondary)
            .frame(width: 18, alignment: .trailing)
          Text(step)
            .fixedSize(horizontal: false, vertical: true)
        }
      }
    }
  }
}

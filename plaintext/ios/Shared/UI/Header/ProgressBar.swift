import PlaintextKit
import SwiftUI

struct ProgressBar: View {
  let fraction: Double
  let color: Color

  var body: some View {
    GeometryReader { proxy in
      ZStack(alignment: .leading) {
        Capsule().fill(color.opacity(0.2))
        Capsule().fill(color).frame(width: proxy.size.width * fraction)
      }
    }
  }
}

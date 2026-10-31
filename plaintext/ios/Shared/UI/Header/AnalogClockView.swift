import PlaintextKit
import SwiftUI

struct AnalogClockView: View {
  // MARK: Inputs
  let hour: Int
  let minute: Int
  let color: Color

  // MARK: Body
  var body: some View {
    GeometryReader { proxy in
      let side = min(proxy.size.width, proxy.size.height)
      let center = CGPoint(x: proxy.size.width / 2, y: proxy.size.height / 2)
      let minuteAngle = Angle.degrees(Double(minute) * 6)
      let hourAngle = Angle.degrees((Double(hour % 12) + Double(minute) / 60) * 30)
      ZStack {
        Circle().stroke(color.opacity(0.35), lineWidth: max(1, side * 0.02))
        hand(length: side * 0.26, width: side * 0.05, angle: hourAngle, center: center)
        hand(length: side * 0.38, width: side * 0.03, angle: minuteAngle, center: center)
        Circle().fill(color).frame(width: side * 0.07, height: side * 0.07)
      }
    }
  }

  // MARK: Handlers
  private func hand(length: CGFloat, width: CGFloat, angle: Angle, center: CGPoint) -> some View {
    Path { path in
      path.move(to: center)
      path.addLine(
        to: CGPoint(
          x: center.x + length * sin(angle.radians),
          y: center.y - length * cos(angle.radians)
        )
      )
    }
    .stroke(color, style: StrokeStyle(lineWidth: width, lineCap: .round))
  }
}

import AVKit
import PlaintextKit
import SwiftUI

/// Plays a bundled screen recording for steps iOS doesn't let us automate. Recordings are optional and named
/// `<step>-ios<major>.mp4`; the newest one at or below the running version wins, then `<step>.mp4`.
struct InstructionVideo: View {
  // MARK: Inputs
  let step: OnboardingStep
  let systemMajorVersion: Int

  // MARK: State
  @State private var player: AVQueuePlayer?
  @State private var looper: AVPlayerLooper?

  // MARK: Body
  var body: some View {
    Group {
      if let player {
        VideoPlayer(player: player)
          .aspectRatio(9 / 19.5, contentMode: .fit)
          .frame(maxHeight: 360)
          .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
          .disabled(true)
      }
    }
    .onAppear(perform: start)
    .onDisappear { player?.pause() }
  }

  // MARK: Handlers
  private func start() {
    let names = stride(from: systemMajorVersion, through: 18, by: -1).map { "\(step.rawValue)-ios\($0)" }
    let url = (names + [step.rawValue])
      .compactMap { Bundle.main.url(forResource: $0, withExtension: "mp4") }
      .first
    guard let url else { return }
    let queue = AVQueuePlayer()
    queue.isMuted = true
    looper = AVPlayerLooper(player: queue, templateItem: AVPlayerItem(url: url))
    player = queue
    queue.play()
  }
}

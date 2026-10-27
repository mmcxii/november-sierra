import Photos
import PlaintextKit

enum WallpaperTools {
  enum Failure: LocalizedError {
    case photosAccessDenied
    case renderFailed

    var errorDescription: String? {
      switch self {
      case .photosAccessDenied: "Allow Plaintext to add photos in Settings → Privacy → Photos."
      case .renderFailed: "Plaintext couldn't create the wallpaper."
      }
    }
  }

  /// Writes one solid tile for the light color and one for the dark color. iOS will not switch between them.
  @MainActor
  static func saveToPhotos(_ theme: Theme) async throws {
    let tiles = [
      (ThemeVariant.light, theme.background(for: .light)),
      (ThemeVariant.dark, theme.background(for: .dark)),
    ]
    var files: [(filename: String, data: Data)] = []
    for (appearance, color) in tiles {
      guard let data = WallpaperRenderer.pngData(for: color) else { throw Failure.renderFailed }
      files.append((WallpaperRenderer.filename(for: appearance), data))
    }
    let status = await PHPhotoLibrary.requestAuthorization(for: .addOnly)
    guard status == .authorized || status == .limited else { throw Failure.photosAccessDenied }
    try await PHPhotoLibrary.shared().performChanges {
      for file in files {
        let options = PHAssetResourceCreationOptions()
        options.originalFilename = file.filename
        let request = PHAssetCreationRequest.forAsset()
        request.addResource(with: .photo, data: file.data, options: options)
      }
    }
  }
}

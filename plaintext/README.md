# Plaintext: Dumb Phone Launcher

_Zen Minimalist Home Screen_

Plaintext turns an iPhone home screen into a short list of words. Each widget shows one page of apps as plain text, with an optional header (time, date, weather, a quote) above them. Headers and pages are separate lists, so a widget can mix any header with any page, or leave the header blank. Tapping a word opens the app directly.

```
plaintext/
├── ios/
│   ├── project.yml        XcodeGen spec — generates Plaintext.xcodeproj
│   ├── PlaintextKit/      Swift package: models, catalog, launch routing, storage, formatting (tested on Linux)
│   ├── Shared/            Compiled into both the app and the widget extension
│   ├── App/               SwiftUI app: onboarding, editor, settings, paywall, shortcut intents
│   ├── Widgets/           WidgetKit extension: one widget, any size, header and page chosen per instance
│   └── Tests/             Widget snapshot tests and the simulator walkthrough UI test
└── docs/
    └── shortcuts.md       Build specs for the prebuilt shortcuts and onboarding recordings
```

## Building

You need a Mac with Xcode 16 or newer (Xcode 27 to get the iOS 27 full-page launcher) and [XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
brew install xcodegen
cd plaintext/ios
xcodegen generate
open Plaintext.xcodeproj
```

The `.xcodeproj`, Info.plists, and entitlements files are generated, so edit `project.yml` rather than Xcode's target settings.

1. Put your Team ID in `Config/Local.xcconfig` (git-ignored): `DEVELOPMENT_TEAM = ABCDE12345`.
2. In the Apple Developer portal, register the App Group `group.com.novembersierra.plaintext` and enable **App Groups** and **WeatherKit** for both `com.novembersierra.plaintext` and `com.novembersierra.plaintext.widgets`. Automatic signing handles the rest.
3. Pick the **Plaintext** scheme and an iPhone simulator. Purchases work locally through `Plaintext.storekit`; no App Store Connect setup is needed to test the paywall.
4. To test on iOS 18 without a device: Xcode → Settings → Components → add the iOS 18 simulator runtime.

Core logic tests run anywhere Swift does:

```bash
cd plaintext/ios/PlaintextKit && swift test
```

CI (`.github/workflows/plaintext-ios.yml`) runs those tests on Linux and builds the app and widgets on macOS for every PR that touches `plaintext/`.

### Reviewing without a Mac

The **Widget snapshots and app walkthrough** job renders the screens so you can review a PR from the browser. Open the job's run page, download the **plaintext-screens** artifact, and open `index.html`:

- `widgets/`: the widget at each size, in each appearance setting (System, Light, Dark), on a light and a dark device, with the default and Eggshell/Graphite backgrounds, plus font samples, header layouts, and a page with the header left blank (`Tests/Snapshots`).
- `walkthrough-light/` and `walkthrough-dark/`: numbered screenshots from a fresh install through onboarding, the header and page carousels, a renamed app (its catalog name struck through on the page card), the page and header editors, settings, and the paywall, plus a screen recording of each run (`Tests/UI`).

The walkthrough can't add widgets to the home screen, run Shortcuts automations, fetch weather, or buy Pro, so those still need a device. In Xcode, run the same tests with ⌘U; screenshots are attached to each test in the Report navigator.

Swift style is enforced by `swift format` and the `shared/swift-style` checker in the pre-commit hook and the `Swift Style` workflow. The app targets build in Swift 6 language mode with warnings as errors. The rules and the view template are in the `swift-code-review` skill (`.agents/skills/swift-code-review/SKILL.md`). To fix view layout automatically:

```bash
swift run --package-path shared/swift-style swift-style --fix plaintext/ios
```

## How a tap opens an app

The launch path is the product, so it's worth knowing. `LaunchRouter` picks one of these per item, best first:

1. **Direct.** The widget row is a `Button(intent:)` whose `LaunchItemIntent` returns an `OpenURLIntent` with the app's URL scheme. The system opens the app without Plaintext ever appearing. Works for every catalog app with a known scheme and every custom link.
2. **Assistant.** For apps with no public URL (Camera, Settings, Clock) or added by name. The intent stages the app name in the App Group and opens Plaintext; the user's "When Plaintext is opened" automation runs the **Plaintext Assistant** shortcut, which asks the app for the name and opens it. The user sees a brief black frame, never the Shortcuts app.
3. **Shortcut.** Phone (Apple blocks opening it directly) and user-made shortcuts run through `shortcuts://run-shortcut`, which briefly shows Shortcuts.

If an item needs setup that hasn't happened, the tap opens Plaintext straight to the fix.

The app catalog (`PlaintextKit/Resources/catalog.json`) ships in the binary and refreshes from `https://novembersierra.dev/plaintext/catalog.json`; the newer `version` wins. Schemes for Apple apps marked `direct` and the popular third-party apps are the well-known ones, but every entry should be checked on a device before launch — when one fails, change it to `assistant`.

## Widgets and iOS versions

| iOS   | Home screen                                                                                                                                                     |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 18–26 | One widget, small to large. Each shows one page, plus an optional header. Leave the header blank for just the apps. Add another widget for another combination. |
| 27+   | The same widget, plus a full-page size (`systemExtraLargePortrait`).                                                                                            |

Widgets have a light background and a dark background. Both are user-picked colors stored in the shared configuration in the App Group (`Theme` in PlaintextKit), and both default to white and black. By default, widgets follow the system appearance. Settings can pin them to Light or Dark regardless of the system. WidgetKit re-renders existing entries when the appearance changes, and the app reloads timelines on every save, so widgets never need to be re-added.

Save Wallpaper writes two solid photos at the phone's screen size, one in the light color and one in the dark color. Set one of them as the home screen wallpaper and turn Blur off. iOS will not switch that photo when the appearance changes, so the invisible edge holds for the color that was set. Widgets still follow the theme pin on their own. The Plaintext Wallpaper shortcut sets a single photo and names it for the phone's current appearance.

Apps can't remove the glass that iOS 26's Clear and Tinted modes draw around widgets. Onboarding therefore steers people to Automatic, Dark or Light, matching their widget setting.

## Product decisions

Captured from the NS-10 planning interview.

- **Minimum iOS 18**, same as Blank Spaces. Newer features sit behind `#available`.
- **Free:** one page, one header, up to 6 apps, classic header with digital clock (12/24h), basic date, and current weather (°F/°C), full onboarding and all shortcuts.
- **Pro, $9.99 one-time** (`com.novembersierra.plaintext.pro`, non-consumable, Family Sharing on): unlimited apps, pages, and headers, analog clock, date formats, 5/10-day forecasts, colored weather icons, day/month/year/life countdowns, quote of the day, next calendar event, side-by-side and stacked header layouts. No subscriptions, ever. Consider $4.99 if volume justifies it.
- **Privacy:** everything stays on the device. The only network traffic is the catalog download, WeatherKit, and the text of app searches that found nothing (`MissedSearch`), sent so we know which apps to add.
- **Roadmap, not v1:** blocking or interrupting distracting apps (Screen Time `FamilyControls`, which needs an Apple entitlement request — file it early), focus-mode page switching, gradient and image wallpapers, a `plaintext/website` for the catalog, help pages, and the missed-search endpoint.

## Before launch

- [ ] Build each shortcut from `docs/shortcuts.md`, share it, and add its iCloud link to `App/Shortcuts/ShortcutLinks.swift`.
- [ ] Record the onboarding videos listed in `docs/shortcuts.md`.
- [ ] Verify every `direct` catalog entry opens its app from the widget on iOS 18, 26, and 27.
- [ ] Verify the Assistant end to end: automation runs silently, Open App accepts the text variable.
- [ ] Publish `catalog.json`, help pages, and the missed-search endpoint (`PlaintextService`).
- [ ] App icon, App Store screenshots, privacy policy, and the Pro product in App Store Connect.

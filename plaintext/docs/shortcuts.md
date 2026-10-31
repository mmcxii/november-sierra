# Prebuilt shortcuts

iOS only imports shortcuts that Apple has signed, and the only way to get one signed is to build it in the Shortcuts app and share it. So each shortcut below is built once by hand on an iPhone running the oldest iOS we support (18), shared as an iCloud link, and the link is added to `ShortcutLinks.links` in `ios/App/Shortcuts/ShortcutLinks.swift`. Until a link is there, the app shows the install button as unavailable.

Names must match exactly. The app runs them by name (`PrebuiltShortcut` in `PlaintextKit/LaunchRouter.swift`).

To share: long-press the shortcut → Share → Copy iCloud Link. Rebuild and re-share whenever a spec changes; old links keep serving the old version.

Install and run the latest Plaintext build on the device first, so its actions ("Get App to Open", "Get Plaintext Wallpaper") appear in the Shortcuts action list.

## Plaintext Assistant

Opens apps that have no public URL (Camera, Settings, Clock, …) or that the user added by name. A widget tap stages the app name and opens Plaintext; a personal automation the user creates during onboarding ("When Plaintext is opened → Run Immediately → Plaintext Assistant") then runs this shortcut. Automations run without showing the Shortcuts app, so the user sees only a brief black screen.

1. **Get App to Open** (Plaintext). Returns the staged app name, or an empty string. It also tells the app the automation works, which is how onboarding checks the step off.
2. **If** _App Name_ **has any value**
   1. **Open App** — tap the App field, choose **Select Variable**, pick _App Name_.
3. **End If**

Settings: the details panel → turn off **Show in Share Sheet**.

To check on a device:

- Open Plaintext with nothing staged. Nothing should happen, and onboarding should show "Assistant ready."
- Add Camera to the launcher, tap it on the home screen. Camera opens after a brief black frame, and the Shortcuts app never appears.
- If **Open App** won't accept a text variable on some iOS version, note which one. The fix is on the app side: `GetAppToOpenIntent` would return a different value type, and the shortcut stays the same.

## Plaintext Phone

Apple blocks third-party apps from opening Phone directly, so Phone always goes through Shortcuts.

1. **Open App** → Phone

## Plaintext Wallpaper

Sets one solid wallpaper. The file is named for the phone's current appearance, `Plaintext Light.png` or `Plaintext Dark.png`. Saving from the app writes both colors to Photos. This shortcut sets only the one that matches the phone right now. iOS will not switch it later.

1. **Get Plaintext Wallpaper** (Plaintext)
2. **Set Wallpaper Photo** → _Lock Screen and Home Screen_, image = _Wallpaper_. In the action's options, turn off **Show Preview** and **Crop to Subject**.

Blur and Perspective Zoom can't be changed from Shortcuts; onboarding covers those as manual steps.

## Plaintext Grayscale

1. **Set Color Filters** → _Toggle_

Onboarding also points users at Settings → Accessibility → Accessibility Shortcut → Color Filters for triple-click.

## Plaintext Add Shortcut

Lets people put any of their own shortcuts on the launcher.

1. **Get My Shortcuts**
2. **Choose from List** → _My Shortcuts_, prompt "Add to Plaintext"
3. **URL Encode** → _Chosen Item_ (Encode)
4. **Text** → `plaintext://add-shortcut?name=` followed by the _URL Encoded Text_ variable
5. **Open URLs** → _Text_

## Screen recordings

Steps iOS won't let us automate (adding widgets, hiding pages, clearing the dock, setting the wallpaper) show a looping recording above the written steps when one is bundled. Record them on a clean device and add them to the app target as `<step>-ios<major>.mp4`. The app uses the newest recording at or below the running iOS version, then `<step>.mp4`, so only record a new version when Apple changes the steps:

| Step                 | Files                                                                  |
| -------------------- | ---------------------------------------------------------------------- |
| Add the widgets      | `addWidgets-ios18.mp4`, `addWidgets-ios26.mp4`, `addWidgets-ios27.mp4` |
| Clear the dock       | `hideDockAndBorders-ios18.mp4`, `hideDockAndBorders-ios26.mp4`         |
| Hide the other pages | `hidePages.mp4`                                                        |
| Match the wallpaper  | `wallpaper-ios18.mp4`, `wallpaper-ios26.mp4`                           |

Keep them short (under 15 seconds), muted, cropped to the phone screen, and recorded in the dark theme. The wallpaper recording shows Save Wallpaper, then setting one of the two photos and turning Blur and Perspective Zoom off. It does not show a screenshot import or a wallpaper pair.

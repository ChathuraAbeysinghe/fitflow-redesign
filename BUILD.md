# FitFlow: run and release build (Lab Sheet 6, Activity 1)

## 1. Run the app
```bash
npm install
npx expo start          # scan the QR code with Expo Go, or press "a" for an Android emulator
```
Check it works: onboarding -> Home -> Start now -> Plan -> Progress -> Feed -> Log.

## 2. Bump the version (every release)
In `app.json`:
- `expo.version`            -> user-facing name, e.g. "1.0.1"
- `expo.android.versionCode` -> integer, must increase every upload (1, 2, 3 ...)

## 3. Create the signing keystore (once, keep it safe)
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore fitflow-release.keystore \
  -alias fitflow -keyalg RSA -keysize 2048 -validity 10000
```
Rules: never commit the keystore or passwords (already in .gitignore), back it up in two private
places, store the passwords in a password manager. If it is lost you cannot update the app
(Google Play App Signing can reset an *upload* key, but only if enrolled).

## 4A. Local signed build (no accounts needed)
Requires JDK 17 and the Android SDK (Android Studio installs both).
```bash
npx expo prebuild --platform android      # generates ./android
cp fitflow-release.keystore android/app/
```
Add to `android/gradle.properties` (do not commit):
```
FITFLOW_STORE_FILE=fitflow-release.keystore
FITFLOW_STORE_PASSWORD=****
FITFLOW_KEY_ALIAS=fitflow
FITFLOW_KEY_PASSWORD=****
```
In `android/app/build.gradle` add a release signing config and enable minification:
```gradle
android {
  signingConfigs {
    release {
      storeFile file(FITFLOW_STORE_FILE)
      storePassword FITFLOW_STORE_PASSWORD
      keyAlias FITFLOW_KEY_ALIAS
      keyPassword FITFLOW_KEY_PASSWORD
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
  }
}
```
Build:
```bash
cd android
./gradlew bundleRelease     # -> app/build/outputs/bundle/release/app-release.aab
./gradlew assembleRelease   # -> app/build/outputs/apk/release/app-release.apk
```

## 4B. Cloud build with EAS (needs a free Expo account)
```bash
npm i -g eas-cli && eas login
eas build -p android --profile preview      # installable .apk for testers
eas build -p android --profile production   # .aab for Google Play
```

## 5. Verify the signed build
```bash
apksigner verify --verbose --print-certs app-release.apk
keytool -printcert -jarfile app-release.apk
bundletool build-apks --bundle=app-release.aab --output=fitflow.apks --mode=universal
ls -lh app-release.apk app-release.aab        # record sizes for the report
adb install app-release.apk                   # test on a real device / emulator
```

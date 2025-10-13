# Firebase App Distribution Setup Guide

This guide will help you set up Firebase App Distribution so you can easily share your Android app for testing.

## Prerequisites
✅ Firebase CLI installed (already done!)
✅ Google account

## Step 1: Login to Firebase

```bash
firebase login
```

This will open your browser. Log in with your Google account.

## Step 2: Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project" or "Create a project"
3. Project name: **Its Just Fine** (or whatever you prefer)
4. You can disable Google Analytics (not needed for testing)
5. Click "Create project"

## Step 3: Register Your Android App

1. In the Firebase console, click on your new project
2. Click the Android icon to add an Android app
3. Enter package name: `com.itsjustfine.game`
4. App nickname: **Its Just Fine**
5. Click "Register app"
6. Download the `google-services.json` file
7. Place it in: `/Users/majling/Development/its-just-fine/android/app/google-services.json`

## Step 4: Enable App Distribution

1. In Firebase console, go to **Release & Monitor > App Distribution**
2. Click "Get started"
3. Create a tester group called "testers" (or any name you want)
4. Add testers by email (your email, friends, etc.)

## Step 5: Get Your App ID

After registering your app, you'll see an App ID that looks like:
```
1:123456789:android:abcdef123456
```

Copy this and update the script in `package.json`:
- Open `package.json`
- Find the line with `android:distribute`
- Replace `1:YOUR_APP_ID:android:YOUR_ANDROID_APP_ID` with your actual App ID

## Step 6: Upload Your First Build

```bash
npm run android:distribute
```

This will:
1. Build your web app
2. Sync to Capacitor
3. Build the Android APK
4. Upload to Firebase App Distribution
5. Send emails to your testers with download links!

## Alternative: Manual Upload

If you prefer to upload manually:

```bash
# Build the APK first
npm run android:build

# Then upload manually
firebase appdistribution:distribute \
  android/app/build/outputs/apk/debug/app-debug.apk \
  --app 1:YOUR_APP_ID:android:YOUR_ANDROID_APP_ID \
  --groups testers
```

## After First Upload

Once uploaded, you and your testers will receive an email with a link to download the app.

Future uploads will automatically notify testers of new versions!

## Quick Commands

```bash
# Build and distribute in one command
npm run android:distribute

# Just build (no upload)
npm run android:build

# Upload existing APK
firebase appdistribution:distribute android/app/build/outputs/apk/debug/app-debug.apk --app YOUR_APP_ID --groups testers
```

## Troubleshooting

**"App not registered"**: Make sure you completed Step 3 and added the Android app to Firebase.

**"Permission denied"**: Make sure you're logged in with `firebase login`.

**"google-services.json missing"**: Download it from Firebase Console > Project Settings > Your Apps, and place in `android/app/`.

## Benefits

- 🔗 Shareable link for testers
- 📧 Automatic email notifications
- 📊 Track installs and tester feedback
- 🔄 Version management
- 🚀 Quick updates - just run `npm run android:distribute` again!

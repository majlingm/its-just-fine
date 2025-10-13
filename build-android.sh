#!/bin/bash

# Android APK Build Script for "It's Just Fine"
# This script builds the web app, syncs to Capacitor, and builds the Android APK

set -e  # Exit on error

echo "🎮 Building It's Just Fine for Android..."

# Set Java and Android SDK paths
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"

echo "📦 Building web app with Vite..."
npm run build

echo "🔄 Syncing to Capacitor Android..."
npx cap sync android

echo "🤖 Building Android APK..."
cd android
./gradlew clean assembleDebug

echo ""
echo "✅ Build complete!"
echo "📱 APK location: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "To install on device:"
echo "  adb install app/build/outputs/apk/debug/app-debug.apk"
echo ""

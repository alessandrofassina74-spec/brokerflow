#!/usr/bin/env python3
import os
import sys
import shutil
import subprocess

IMAGE_PATH = "/Users/alessandrofassina/.gemini/antigravity/brain/ee05c8f0-a861-4fa9-aaca-cd0903d1bb1e/brokerflow_parser_icon_1788172141046.jpg"
APP_DIR = "/Users/alessandrofassina/Desktop/BrokerFlow_Parser.app"

def main():
    print("Creazione della struttura della macOS App...")
    macos_dir = os.path.join(APP_DIR, "Contents/MacOS")
    resources_dir = os.path.join(APP_DIR, "Contents/Resources")
    os.makedirs(macos_dir, exist_ok=True)
    os.makedirs(resources_dir, exist_ok=True)
    
    # 1. Generate Info.plist
    info_plist_content = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>BrokerFlow_Parser</string>
    <key>CFBundleIconFile</key>
    <string>icon.icns</string>
    <key>CFBundleIdentifier</key>
    <string>com.brokerflow.parser</string>
    <key>CFBundleName</key>
    <string>BrokerFlow Parser</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.10</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
"""
    with open(os.path.join(APP_DIR, "Contents/Info.plist"), "w", encoding="utf-8") as f:
        f.write(info_plist_content)
        
    # 2. Write executable script
    launch_script = """#!/bin/bash
# BrokerFlow - Launcher App
# Opens a Terminal and starts the Python GUI launcher
osascript -e 'tell application "Terminal" to do script "cd \\"/Users/alessandrofassina/Desktop/broker flow\\" && python3 scripts/gui_launcher.py"'
"""
    exec_path = os.path.join(macos_dir, "BrokerFlow_Parser")
    with open(exec_path, "w", encoding="utf-8") as f:
        f.write(launch_script)
    os.chmod(exec_path, 0o755)
    
    # 3. Create .icns file using sips and iconutil
    print("Compilazione dell'icona .icns in corso...")
    iconset_dir = "/tmp/icon.iconset"
    if os.path.exists(iconset_dir):
        shutil.rmtree(iconset_dir)
    os.makedirs(iconset_dir)
    
    # Standard macOS icon sizes
    sizes = [
        ("icon_16x16.png", 16),
        ("icon_16x16@2x.png", 32),
        ("icon_32x32.png", 32),
        ("icon_32x32@2x.png", 64),
        ("icon_128x128.png", 128),
        ("icon_128x128@2x.png", 256),
        ("icon_256x256.png", 256),
        ("icon_256x256@2x.png", 512),
        ("icon_512x512.png", 512),
        ("icon_512x512@2x.png", 1024)
    ]
    
    for filename, size in sizes:
        out_path = os.path.join(iconset_dir, filename)
        # Use built-in sips to resize and convert to png format
        subprocess.run(["sips", "-s", "format", "png", "-z", str(size), str(size), IMAGE_PATH, "--out", out_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
    # Compile iconset to icns
    icns_path = os.path.join(resources_dir, "icon.icns")
    subprocess.run(["iconutil", "-c", "icns", iconset_dir, "-o", icns_path])
    
    # Clean up tmp iconset
    shutil.rmtree(iconset_dir)
    
    # 4. Remove old .command file to keep Desktop tidy
    old_command = "/Users/alessandrofassina/Desktop/BrokerFlow_Parser.command"
    if os.path.exists(old_command):
        os.remove(old_command)
        print("Rimosso vecchio file .command")
        
    # 5. Touch the app bundle to force Finder update
    subprocess.run(["touch", APP_DIR])
    print("macOS App Bundle creata con successo sul Desktop!")

if __name__ == "__main__":
    main()

# extensionz4locumz

This repository contains all the Chrome extensions I've written to make my workflow at Cynet easier.

## How to Install a Chrome Extension

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked**.
5. Select the folder of the extension you want to install.
6. The extension should now appear in your Chrome extensions list.
7. To use an extension, select text on a webpage, right-click it, and choose the extension from the context menu.

## Included Extensions

* `doxxem` — Searches selected names for Doximity Emergency Medicine profiles.
* `npiLookup` — Verifies and looks up NPI numbers through the official NPI Registry.
* `doxx2phonebook` — Generates and copies a USPhoneBook URL from selected Doximity doctor information.

### 1. doxxem

I use this extension to quickly look up a selected name and find their Doximity profile, specifically for Emergency Medicine.

### 2. npiLookup

This extension is used to verify whether an NPI number is legitimate and quickly look up an NPI number on the official NPI Registry website.

### 3. doxx2phonebook 

This extension takes selected doctor information from Doximity, generates a USPhoneBook search URL using the doctor's name, city, and state, and copies the generated URL to the clipboard.
For example, selecting:

```text
Walter Louis Meier IV MD
Emergency Medicine•Chattanooga, TN
```

generates and copies:

```text
https://www.usphonebook.com/walter-louis-meier-iv/tn/chattanooga
```

You can then paste the URL into Firefox or another supported browser.
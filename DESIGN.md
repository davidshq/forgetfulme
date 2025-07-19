We are building a cross-browser extension. Our primary target is Chrome but it should work with Edge and other Chromium browsers. Ideally it should work with Firefox as well as Safari, but if architectural considerations make this too difficult we'll focus on Chromium browsers first.

The purpose of this extension is to allow folks to mark sites they are visiting as having been viewed. This is mainly for research purposes.

There should be multiple types of "read" - e.g., "good-reference", "low-value", "read", "revisit-later". The types of "read" should be a user customizable list.

We need some form of storage that is going to be fairly unlimited as it is possible someone might store hundreds of thousands of entries.

We also want this to be usable across browsers. This should be especially true of Chromium browsers but ideally of all browsers.

For the initial release we will focus on Chromium browsers and use the native, built-in Chrome Sync Storage API.

The UI should allow one to click on the extension icon to mark something as saved, it should also have a pop-up that shows when someone clicks on the button that allows for further refinement (e.g. choosing the exact value for read) and should provide a button linking to a Settings page

The Settings page should allow one to set custom values for "read"

The UI should also expose tags in the popup which are user customizable

There should also be keyboard shortcuts for adding a link as read.
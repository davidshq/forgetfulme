These are todos created due to actual usage of the extension.

# Popup Screen
- When one clicks on Forgot Password? one gets a default browser modal, lets make this a page instead.
- When clicking on many buttons they get much larger. Why?

# Logged In Screen
- This is where one can mark things as read.
- We want nicer styling for this page.
    - Instead of a big signout button lets have an exit door icon that one can click on to logout without words (but should have alt/tooltip text)
    - The information about the link isn't really separated out from the rest of the page. It should be in a visible container.
    - I don't think we need a notice that the page is not bookmark, that is evident based on the UI, remove the notice.
- When clicking on View All Bookmarks it redirects to the correct page but says I'm not signed in. Probably a state issue?

# Bookmark Manager
- Lets have just Search visible by default with a Filters button that then displays the other fields. 

# Other
- When I reset my email it takes me to email confirmed. It doesn't ask me for a new password. It says I'm signed in, but that doesn't help me reset my password?

# Recent Entries
In the popup the recent entries doens't have a container around it differentiating it from the rest of the page.


# Future
- Add a notes field
- Keep a log of when we visited pages and how long we dwelt on the page.
    - This should be off by default and be configurable in settings at both levels - e.g., one can log visited pages or not and if one is logging visited pages then it should allow one to enable/disable dwell time.
    - If the dwell time option is enabled we need to record site dwell when we visit them even if they aren't saved, if they decide to save the page we'll want that. If they navigate away from the page without saving it then we should dispose of that time since we aren't tracking the page.
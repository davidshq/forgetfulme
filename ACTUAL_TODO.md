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
- When I attempt to save a bookmark I get this error:
xayqvoztwylrmwhwgefj.supabase.co/rest/v1/bookmarks?id=eq.bm_mdormep0_nqcbhe1v0&user_id=eq.14366e0d-8c92-45a0-9255-beff70e23a7b:1   Failed to load resource: the server responded with a status of 400 ()
ErrorService.js:445  [BOO-W9I0-mdormesprh0b] An unexpected error occurred. Please try again. Error: Failed to save bookmark: 
    at BookmarkService.saveToDatabase (BookmarkService.js:686:13)
    at async BookmarkService.createBookmark (BookmarkService.js:84:29)
    at async PopupController.js:482:27
    at async PopupController.safeExecute (BaseController.js:280:22)
    at async PopupController.handleSaveBookmark (PopupController.js:470:5)
logError @ ErrorService.js:445
await in logError
(anonymous) @ PopupController.js:482
safeExecute @ BaseController.js:280
handleSaveBookmark @ PopupController.js:470
(anonymous) @ PopupController.js:189
ErrorService.js:445  [POP-RTKM-mdormesqg5ou] An unexpected error occurred. Please try again. Error: An unexpected error occurred. Please try again.
    at BookmarkService.createBookmark (BookmarkService.js:92:13)
    at async PopupController.js:482:27
    at async PopupController.safeExecute (BaseController.js:280:22)
    at async PopupController.handleSaveBookmark (PopupController.js:470:5)
logError @ ErrorService.js:445
await in logError
handleSaveBookmark @ PopupController.js:470
(anonymous) @ PopupController.js:189
BaseController.js:168  [PopupController.handleSaveBookmark] POP-RTKM-mdormesqg5ou: Error: An unexpected error occurred. Please try again.
    at BookmarkService.createBookmark (BookmarkService.js:92:13)
    at async PopupController.js:482:27
    at async PopupController.safeExecute (BaseController.js:280:22)
    at async PopupController.handleSaveBookmark (PopupController.js:470:5)

# Bookmark Manager
- Lets have just Search visible by default with a Filters button that then displays the other fields. 

# Other
- When I reset my email it takes me to email confirmed. It doesn't ask me for a new password. It says I'm signed in, but that doesn't help me reset my password?
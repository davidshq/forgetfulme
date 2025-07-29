- On the login screen the Sign In and Sign up may not be buttons, or if they are buttons they appear the same color as the background.
    - Maybe these should be tabs instead? Switching between them switches the UI
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
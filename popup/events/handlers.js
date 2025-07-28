// Event handlers for popup
export async function markAsRead(ctx) {
  try {
    // Validate context
    if (
      !ctx ||
      !ctx.supabaseService ||
      !ctx.UIComponents ||
      !ctx.UIMessages ||
      !ctx.BookmarkTransformer
    ) {
      const msg = '[markAsRead] Missing required context properties.';
      console.error(msg, ctx);
      if (ctx && ctx.UIMessages && ctx.appContainer) {
        ctx.UIMessages.error(msg, ctx.appContainer);
      }
      return;
    }

    // Safely get form values using DOM utilities
    const status = ctx.UIComponents.DOM.getValue('read-status') || 'read';
    const tags = ctx.UIComponents.DOM.getValue('tags') || '';

    // Get current tab info
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (
      !tab.url ||
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://')
    ) {
      ctx.UIMessages.error(
        'Cannot mark browser pages as read',
        ctx.appContainer
      );
      return;
    }

    const bookmark = ctx.BookmarkTransformer.fromCurrentTab(
      tab,
      status,
      tags.trim() ? tags.trim().split(',') : []
    );

    const result = await ctx.supabaseService.saveBookmark(bookmark);

    if (result.isDuplicate) {
      // Show edit interface for existing bookmark
      ctx.ui.showEditInterface(ctx, result);
    } else {
      ctx.UIMessages.success('Page marked as read!', ctx.appContainer);

      // Clear tags input safely
      ctx.UIComponents.DOM.setValue('tags', '');

      ctx.state.loadRecentEntries(ctx);

      // Notify background script about saved bookmark
      try {
        await chrome.runtime.sendMessage({
          type: 'BOOKMARK_SAVED',
          data: { url: bookmark.url },
        });
      } catch {
        // Error notifying background about saved bookmark
      }

      // Close popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1500);
    }
  } catch (error) {
    const errorResult = ctx.ErrorHandler.handle(error, 'popup.markAsRead');
    ctx.UIMessages.error(errorResult.userMessage, ctx.appContainer);
  }
}
export async function updateBookmark(ctx, bookmarkId) {
  try {
    const status = ctx.UIComponents.DOM.getValue('edit-read-status') || 'read';
    const tags = ctx.UIComponents.DOM.getValue('edit-tags') || '';

    const updates = {
      read_status: status,
      tags: tags.trim()
        ? tags
            .trim()
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag)
        : [],
      updated_at: new Date().toISOString(),
    };

    await ctx.supabaseService.updateBookmark(bookmarkId, updates);
    ctx.UIMessages.success('Bookmark updated successfully!', ctx.appContainer);

    // Notify background script about updated bookmark
    try {
      await chrome.runtime.sendMessage({
        type: 'BOOKMARK_UPDATED',
        data: { url: updates.url || ctx.currentBookmarkUrl },
      });
    } catch {
      // Error notifying background about updated bookmark
    }

    // Return to main interface after a short delay
    setTimeout(() => {
      ctx.ui.showMainInterface(ctx);
      ctx.state.loadRecentEntries(ctx);
    }, 1500);
  } catch (error) {
    const errorResult = ctx.ErrorHandler.handle(error, 'popup.updateBookmark');
    ctx.UIMessages.error(errorResult.userMessage, ctx.appContainer);
  }
}
export function openSettings(_ctx) {
  chrome.runtime.openOptionsPage();
}
export function showBookmarkManagement(_ctx) {
  // Open bookmark management page in a new tab
  chrome.tabs.create({
    url: chrome.runtime.getURL('bookmark-management.html'),
  });
}

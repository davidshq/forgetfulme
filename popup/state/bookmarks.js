// Bookmarks state management for popup
export async function loadRecentEntries(ctx) {
  try {
    const bookmarks = await ctx.supabaseService.getBookmarks({ limit: 5 });

    const recentListEl = document.getElementById('recent-list');
    if (!recentListEl) return;

    recentListEl.innerHTML = '';

    if (bookmarks.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'recent-item empty';
      emptyItem.setAttribute('role', 'listitem');
      emptyItem.setAttribute('aria-label', 'No recent entries');

      const emptyIcon = document.createElement('div');
      emptyIcon.textContent = '📚';
      emptyItem.appendChild(emptyIcon);

      const emptyTitle = document.createElement('div');
      emptyTitle.textContent = 'No entries yet';
      emptyItem.appendChild(emptyTitle);

      const emptyMeta = document.createElement('div');
      emptyMeta.innerHTML = '<small>No entries</small>';
      emptyItem.appendChild(emptyMeta);

      recentListEl.appendChild(emptyItem);
      return;
    }

    bookmarks.forEach((bookmark, index) => {
      const uiBookmark = ctx.BookmarkTransformer.toUIFormat(bookmark);
      const listItem = createRecentListItem(ctx, uiBookmark, index);
      recentListEl.appendChild(listItem);
    });
  } catch (error) {
    const errorResult = ctx.ErrorHandler.handle(
      error,
      'popup.loadRecentEntries'
    );
    const recentListEl = document.getElementById('recent-list');
    if (recentListEl) {
      const errorItem = document.createElement('div');
      errorItem.setAttribute('role', 'listitem');
      errorItem.setAttribute('aria-label', 'Error loading entries');

      const errorTitle = document.createElement('div');
      errorTitle.textContent = 'Error loading entries';
      errorItem.appendChild(errorTitle);

      const errorMeta = document.createElement('div');
      errorMeta.innerHTML = '<small>Error</small>';
      errorItem.appendChild(errorMeta);

      recentListEl.appendChild(errorItem);
    }

    if (errorResult.shouldShowToUser) {
      ctx.UIMessages.error(errorResult.userMessage, ctx.appContainer);
    }
  }
}

function createRecentListItem(ctx, bookmark, index) {
  const listItem = document.createElement('div');
  listItem.setAttribute('role', 'listitem');
  listItem.setAttribute(
    'aria-label',
    `Recent bookmark ${index + 1}: ${bookmark.title}`
  );

  // Add title
  const titleDiv = document.createElement('div');
  titleDiv.textContent = bookmark.title;
  titleDiv.setAttribute('title', bookmark.title);
  listItem.appendChild(titleDiv);

  // Add meta information
  const metaDiv = document.createElement('div');

  // Add status badge
  const statusSpan = document.createElement('small');
  statusSpan.textContent = ctx.formatStatus(bookmark.status);
  statusSpan.setAttribute(
    'aria-label',
    `Status: ${ctx.formatStatus(bookmark.status)}`
  );
  metaDiv.appendChild(statusSpan);

  // Add time
  const timeSpan = document.createElement('small');
  timeSpan.textContent = ctx.formatTime(
    new Date(bookmark.created_at).getTime()
  );
  timeSpan.setAttribute(
    'aria-label',
    `Created ${ctx.formatTime(new Date(bookmark.created_at).getTime())}`
  );
  metaDiv.appendChild(timeSpan);

  // Add tags if they exist
  if (bookmark.tags && bookmark.tags.length > 0) {
    const tagsSpan = document.createElement('small');
    tagsSpan.textContent = `Tags: ${bookmark.tags.join(', ')}`;
    tagsSpan.setAttribute('aria-label', `Tags: ${bookmark.tags.join(', ')}`);
    metaDiv.appendChild(tagsSpan);
  }

  listItem.appendChild(metaDiv);

  return listItem;
}
export async function loadCustomStatusTypes(ctx) {
  try {
    await ctx.configManager.initialize();
    const customStatusTypes = await ctx.configManager.getCustomStatusTypes();

    if (customStatusTypes.length > 0) {
      // Safely get the select element
      const readStatusSelectEl = ctx.UIComponents.DOM.getElement('read-status');
      if (readStatusSelectEl) {
        // Clear default options and add custom ones
        readStatusSelectEl.innerHTML = '';
        customStatusTypes.forEach(status => {
          const option = document.createElement('option');
          option.value = status;
          option.textContent = ctx.formatStatus(status);
          readStatusSelectEl.appendChild(option);
        });
      }
    }
  } catch (error) {
    ctx.ErrorHandler.handle(error, 'popup.loadCustomStatusTypes', {
      silent: true,
    });
    // Don't show user for this error as it's not critical
  }
}
export async function checkCurrentTabUrlStatus(ctx) {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab || !tab.url) {
      return;
    }

    // Skip browser pages and extension pages
    if (
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://') ||
      tab.url.startsWith('about:') ||
      tab.url.startsWith('moz-extension://')
    ) {
      return;
    }

    // Check if URL is already saved
    try {
      const bookmark = await ctx.supabaseService.getBookmarkByUrl(tab.url);
      const isSaved = !!bookmark;

      // Send result to background script
      await chrome.runtime.sendMessage({
        type: 'URL_STATUS_RESULT',
        data: { url: tab.url, isSaved },
      });
    } catch {
      // Error checking URL in database - send default state
      await chrome.runtime.sendMessage({
        type: 'URL_STATUS_RESULT',
        data: { url: tab.url, isSaved: false },
      });
    }
  } catch {
    // Error checking URL status
  }
}

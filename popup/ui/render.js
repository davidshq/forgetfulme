// UI rendering logic for popup
export function showMainInterface(ctx) {
  // Hide loading indicator and show main interface
  const loadingIndicator = document.getElementById('loading-indicator');
  const mainInterface = document.getElementById('main-interface');
  const appNavigation = document.getElementById('app-navigation');

  if (loadingIndicator) loadingIndicator.hidden = true;
  if (mainInterface) mainInterface.hidden = false;

  // Create navigation items for existing navigation element
  const navItems = [
    {
      text: '⚙️ Settings',
      onClick: () => ctx.events.openSettings(ctx),
      className: 'outline',
      title: 'Settings',
      'aria-label': 'Open settings',
    },
    {
      text: '📚 Manage URLs',
      onClick: () => ctx.events.showBookmarkManagement(ctx),
      className: 'outline',
      title: 'Manage Bookmarks',
      'aria-label': 'Manage bookmarks',
    },
  ];

  // Enhanced navigation in existing element
  if (appNavigation) {
    appNavigation.innerHTML = '';
    navItems.forEach(item => {
      const button = ctx.UIComponents.createButton(
        item.text,
        item.onClick,
        item.className,
        {
          title: item.title,
          'aria-label': item['aria-label'],
        }
      );
      appNavigation.appendChild(button);
    });
  }

  // Get main interface container for content
  const mainContent = mainInterface || document.createElement('div');

  // Create form card using UIComponents for better Pico integration
  const formCard = ctx.UIComponents.createFormCard(
    'Mark Current Page',
    [
      {
        type: 'select',
        id: 'read-status',
        label: 'Mark as:',
        options: {
          options: [
            { value: 'read', text: 'Read' },
            { value: 'good-reference', text: 'Good Reference' },
            { value: 'low-value', text: 'Low Value' },
            { value: 'revisit-later', text: 'Revisit Later' },
          ],
          helpText: 'Choose how you want to categorize this page',
          'aria-describedby': 'status-help',
        },
      },
      {
        type: 'text',
        id: 'tags',
        label: 'Tags (comma separated):',
        options: {
          placeholder: 'research, tutorial, important',
          helpText: 'Add tags to help organize your bookmarks',
          'aria-describedby': 'tags-help',
        },
      },
    ],
    e => {
      e.preventDefault();
      ctx.events.markAsRead(ctx);
    },
    'Mark as Read',
    'mark-as-read-card'
  );

  // Create recent entries card
  const recentList = document.createElement('div');
  recentList.id = 'recent-list';
  recentList.setAttribute('role', 'list');
  recentList.setAttribute('aria-label', 'Recent bookmarks');

  const recentCard = ctx.UIComponents.createListCard(
    'Recent Entries',
    [], // Empty array initially, will be populated by loadRecentEntries
    {},
    'recent-entries-card'
  );
  // Replace the default list container with our custom one
  const cardList = recentCard.querySelector('.card-list');
  if (cardList) {
    cardList.innerHTML = '';
    cardList.appendChild(recentList);
  }

  // Clear existing dynamic content and add both cards to main interface
  if (mainContent) {
    // Clear any existing dynamic content but keep static structure
    const existingContent = mainContent.querySelector('.dynamic-content');
    if (existingContent) {
      existingContent.remove();
    }

    // Create container for dynamic content - mark as read form first, then recent entries
    const dynamicContainer = document.createElement('div');
    dynamicContainer.className = 'dynamic-content';
    dynamicContainer.appendChild(formCard);
    dynamicContainer.appendChild(recentCard);

    // Add to main interface section
    mainContent.appendChild(dynamicContainer);
  }

  // Load recent entries
  ctx.state.loadRecentEntries(ctx);
}
export function showSetupInterface(ctx) {
  // Hide other interfaces and show setup
  const interfaces = ['main-interface', 'auth-interface', 'error-interface'];
  interfaces.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  });

  const setupInterface = document.getElementById('setup-interface');
  if (setupInterface) {
    setupInterface.hidden = false;

    // Clear existing content
    const existingContent = setupInterface.querySelector('.dynamic-content');
    if (existingContent) {
      existingContent.remove();
    }

    // Create setup section
    const setupSection = ctx.UIComponents.createSection(
      '🔧 Setup Required',
      'setup-section'
    );
    setupSection.innerHTML = `
    <p>To use this extension, you need to configure your Supabase backend:</p>
    <ol>
      <li>Create a Supabase project at <a href="https://supabase.com" target="_blank">supabase.com</a></li>
      <li>Get your Project URL and anon public key</li>
      <li>Open the extension settings to configure</li>
    </ol>
  `;

    const settingsBtn = ctx.UIComponents.createButton(
      'Open Settings',
      () => ctx.events.openSettings(ctx),
      'primary'
    );
    setupSection.appendChild(settingsBtn);

    // Create how it works section
    const howItWorksSection = ctx.UIComponents.createSection(
      '📚 How it works',
      'setup-section'
    );
    howItWorksSection.innerHTML = `
    <ul>
      <li>Click the extension icon to mark the current page</li>
      <li>Choose a status (Read, Good Reference, etc.)</li>
      <li>Add tags to organize your entries</li>
      <li>View your recent entries in the popup</li>
    </ul>
  `;

    // Create dynamic content container
    const dynamicContainer = document.createElement('div');
    dynamicContainer.className = 'dynamic-content';
    dynamicContainer.appendChild(setupSection);
    dynamicContainer.appendChild(howItWorksSection);

    // Add to setup interface
    setupInterface.appendChild(dynamicContainer);
  }
}
export function showAuthInterface(ctx) {
  // Hide other interfaces and show auth
  const interfaces = ['main-interface', 'setup-interface', 'error-interface'];
  interfaces.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  });

  const authInterface = document.getElementById('auth-interface');
  if (authInterface) {
    authInterface.hidden = false;

    // Clear existing content
    const existingContent = authInterface.querySelector('.dynamic-content');
    if (existingContent) {
      existingContent.remove();
    }

    // Create dynamic content container for auth form
    const dynamicContainer = document.createElement('div');
    dynamicContainer.className = 'dynamic-content';

    // Add auth form to dynamic container
    ctx.authUI.showLoginForm(dynamicContainer);
    authInterface.appendChild(dynamicContainer);
  }
}
export function showEditInterface(ctx, existingBookmark) {
  ctx.currentBookmarkUrl = existingBookmark.url;
  // Create header
  const header = document.createElement('header');
  const title = document.createElement('h1');
  title.textContent = 'Edit Bookmark';
  header.appendChild(title);

  const backBtn = ctx.UIComponents.createButton(
    '← Back',
    () => ctx.ui.showMainInterface(ctx),
    'secondary',
    { title: 'Back to main interface' }
  );
  header.appendChild(backBtn);

  // Create main content container
  const mainContent = document.createElement('div');
  mainContent.className = 'main-content';

  // Create info section
  const infoSection = ctx.UIComponents.createSection(
    'Bookmark Info',
    'info-section'
  );
  infoSection.innerHTML = `
    <div class="bookmark-info">
      <p><strong>Title:</strong> ${existingBookmark.title}</p>
      <p><strong>URL:</strong> <a href="${existingBookmark.url}" target="_blank">${existingBookmark.url}</a></p>
      <p><strong>Current Status:</strong> ${ctx.formatStatus(existingBookmark.read_status)}</p>
      <p><strong>Current Tags:</strong> ${existingBookmark.tags ? existingBookmark.tags.join(', ') : 'None'}</p>
      <p><strong>Created:</strong> ${ctx.formatTime(new Date(existingBookmark.created_at).getTime())}</p>
    </div>
  `;

  // Create edit form using UI components
  const statusOptions = [
    { value: 'read', text: 'Read' },
    { value: 'good-reference', text: 'Good Reference' },
    { value: 'low-value', text: 'Low Value' },
    { value: 'revisit-later', text: 'Revisit Later' },
  ];
  statusOptions.forEach(option => {
    if (option.value === existingBookmark.read_status) {
      option.selected = true;
    }
  });

  const editForm = ctx.UIComponents.createForm(
    'editBookmarkForm',
    e => {
      e.preventDefault();
      ctx.events.updateBookmark(ctx, existingBookmark.id);
    },
    [
      {
        type: 'select',
        id: 'edit-read-status',
        label: 'Update Status:',
        options: {
          options: statusOptions,
        },
      },
      {
        type: 'text',
        id: 'edit-tags',
        label: 'Update Tags (comma separated):',
        options: {
          placeholder: 'research, tutorial, important',
          value: existingBookmark.tags ? existingBookmark.tags.join(', ') : '',
        },
      },
    ],
    {
      submitText: 'Update Bookmark',
    }
  );

  // Assemble the interface
  ctx.appContainer.innerHTML = '';
  ctx.appContainer.appendChild(header);
  ctx.appContainer.appendChild(mainContent);
  mainContent.appendChild(infoSection);
  mainContent.appendChild(editForm);
}

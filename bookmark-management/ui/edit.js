// Edit interface logic for bookmark management

/**
 * Show edit interface for a bookmark
 * @param {Object} params
 * @param {Object} params.existingBookmark - The bookmark to edit
 * @param {Object} params.UIComponents - UI components utility
 * @param {HTMLElement} params.appContainer - Main app container
 * @param {Function} params.onBack - Handler for back button
 * @param {Function} params.onUpdate - Handler for update form submit
 * @param {Function} params.formatStatus - Status formatter
 * @param {Function} params.formatTime - Time formatter
 */
export function showEditInterface({
  existingBookmark,
  UIComponents,
  appContainer,
  onBack,
  onUpdate,
  formatStatus,
  formatTime,
}) {
  const header = document.createElement('header');
  const title = document.createElement('h1');
  title.textContent = 'Edit Bookmark';
  header.appendChild(title);
  const backBtn = UIComponents.createButton(
    '← Back to List',
    onBack,
    'secondary',
    { title: 'Back to bookmark list' }
  );
  header.appendChild(backBtn);
  const mainContent = document.createElement('div');
  mainContent.className = 'main-content';
  const infoSection = UIComponents.createSection(
    'Bookmark Info',
    'info-section'
  );
  infoSection.innerHTML = `
    <div class="bookmark-info">
      <p><strong>Title:</strong> ${existingBookmark.title}</p>
      <p><strong>URL:</strong> <a href="${existingBookmark.url}" target="_blank">${existingBookmark.url}</a></p>
      <p><strong>Current Status:</strong> ${formatStatus(existingBookmark.read_status)}</p>
      <p><strong>Current Tags:</strong> ${existingBookmark.tags ? existingBookmark.tags.join(', ') : 'None'}</p>
      <p><strong>Created:</strong> ${formatTime(new Date(existingBookmark.created_at).getTime())}</p>
    </div>
  `;
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
  const editForm = UIComponents.createForm(
    'editBookmarkForm',
    e => {
      e.preventDefault();
      onUpdate(existingBookmark.id);
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
  appContainer.innerHTML = '';
  appContainer.appendChild(header);
  appContainer.appendChild(mainContent);
  mainContent.appendChild(infoSection);
  mainContent.appendChild(editForm);
}

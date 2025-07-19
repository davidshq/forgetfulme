// UI Components for ForgetfulMe Extension
// Centralized component factory for consistent UI patterns

class UIComponents {
  // Component types
  static COMPONENT_TYPES = {
    BUTTON: 'button',
    FORM: 'form',
    INPUT: 'input',
    SELECT: 'select',
    LABEL: 'label',
    CONTAINER: 'container',
    HEADER: 'header',
    SECTION: 'section',
    LIST: 'list',
    LIST_ITEM: 'list-item',
    MESSAGE: 'message',
    CONFIRM: 'confirm',
    TOAST: 'toast'
  }

  // Button styles
  static BUTTON_STYLES = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    DANGER: 'danger',
    SUCCESS: 'success',
    WARNING: 'warning',
    INFO: 'info',
    SMALL: 'small',
    LARGE: 'large'
  }

  // Form field types
  static FIELD_TYPES = {
    TEXT: 'text',
    EMAIL: 'email',
    PASSWORD: 'password',
    URL: 'url',
    NUMBER: 'number',
    SELECT: 'select',
    TEXTAREA: 'textarea',
    CHECKBOX: 'checkbox',
    RADIO: 'radio'
  }

  /**
   * Create a button element
   * @param {string} text - Button text
   * @param {Function} onClick - Click handler
   * @param {string} className - Additional CSS classes
   * @param {Object} options - Additional options
   * @returns {HTMLButtonElement}
   */
  static createButton(text, onClick, className = '', options = {}) {
    const button = document.createElement('button')
    button.textContent = text
    button.className = `ui-btn ${className}`.trim()
    
    if (onClick) {
      button.addEventListener('click', onClick)
    }
    
    // Apply additional attributes
    if (options.type) button.type = options.type
    if (options.disabled) button.disabled = options.disabled
    if (options.title) button.title = options.title
    if (options.id) button.id = options.id
    
    return button
  }

  /**
   * Create a form field with label
   * @param {string} type - Field type
   * @param {string} id - Field ID
   * @param {string} label - Field label
   * @param {Object} options - Field options
   * @returns {HTMLElement} Form group container
   */
  static createFormField(type, id, label, options = {}) {
    const formGroup = document.createElement('div')
    formGroup.className = 'ui-form-group'
    
    // Create label
    const labelEl = document.createElement('label')
    labelEl.htmlFor = id
    labelEl.textContent = label
    formGroup.appendChild(labelEl)
    
    // Create input/select based on type
    let field
    if (type === 'select') {
      field = document.createElement('select')
      if (options.options) {
        options.options.forEach(option => {
          const optionEl = document.createElement('option')
          optionEl.value = option.value
          optionEl.textContent = option.text
          if (option.selected) optionEl.selected = true
          field.appendChild(optionEl)
        })
      }
    } else {
      field = document.createElement('input')
      field.type = type
    }
    
    // Apply common attributes
    field.id = id
    field.className = 'ui-form-control'
    
    if (options.placeholder) field.placeholder = options.placeholder
    if (options.required) field.required = options.required
    if (options.value) field.value = options.value
    if (options.disabled) field.disabled = options.disabled
    
    formGroup.appendChild(field)
    
    // Add help text if provided
    if (options.helpText) {
      const helpEl = document.createElement('small')
      helpEl.textContent = options.helpText
      formGroup.appendChild(helpEl)
    }
    
    return formGroup
  }

  /**
   * Create a form container
   * @param {string} id - Form ID
   * @param {Function} onSubmit - Submit handler
   * @param {Array} fields - Array of field configurations
   * @param {Object} options - Form options
   * @returns {HTMLFormElement}
   */
  static createForm(id, onSubmit, fields = [], options = {}) {
    const form = document.createElement('form')
    form.id = id
    form.className = `ui-form ${options.className || ''}`.trim()
    
    if (onSubmit) {
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        onSubmit(e)
      })
    }
    
    // Add fields
    fields.forEach(fieldConfig => {
      const field = this.createFormField(
        fieldConfig.type,
        fieldConfig.id,
        fieldConfig.label,
        fieldConfig.options || {}
      )
      form.appendChild(field)
    })
    
    // Add submit button if specified
    if (options.submitText) {
      const submitBtn = this.createButton(
        options.submitText,
        null,
        'ui-btn-primary',
        { type: 'submit' }
      )
      form.appendChild(submitBtn)
    }
    
    return form
  }

  /**
   * Create a container with header
   * @param {string} title - Container title
   * @param {string} subtitle - Container subtitle
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createContainer(title, subtitle = '', className = '') {
    const container = document.createElement('div')
    container.className = `ui-container ${className}`.trim()
    
    if (title) {
      const header = document.createElement('div')
      header.className = 'ui-container-header'
      
      const titleEl = document.createElement('h2')
      titleEl.textContent = title
      header.appendChild(titleEl)
      
      if (subtitle) {
        const subtitleEl = document.createElement('p')
        subtitleEl.textContent = subtitle
        header.appendChild(subtitleEl)
      }
      
      container.appendChild(header)
    }
    
    return container
  }

  /**
   * Create a list container
   * @param {string} id - List ID
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createList(id, className = '') {
    const list = document.createElement('div')
    list.id = id
    list.className = `list ${className}`.trim()
    return list
  }

  /**
   * Create a list item
   * @param {Object} data - Item data
   * @param {Object} options - Item options
   * @returns {HTMLElement}
   */
  static createListItem(data, options = {}) {
    const item = document.createElement('div')
    item.className = `list-item ${options.className || ''}`.trim()
    
    // Add title if provided
    if (data.title) {
      const title = document.createElement('div')
      title.className = 'item-title'
      title.textContent = data.title
      if (data.titleTooltip) title.title = data.titleTooltip
      item.appendChild(title)
    }
    
    // Add meta information
    if (data.meta) {
      const meta = document.createElement('div')
      meta.className = 'item-meta'
      
      if (data.meta.status) {
        const status = document.createElement('span')
        status.className = `status status-${data.meta.status}`
        status.textContent = data.meta.statusText || data.meta.status
        meta.appendChild(status)
      }
      
      if (data.meta.time) {
        const time = document.createElement('span')
        time.textContent = data.meta.time
        meta.appendChild(time)
      }
      
      if (data.meta.tags && data.meta.tags.length > 0) {
        const tags = document.createElement('span')
        tags.textContent = ` • ${data.meta.tags.join(', ')}`
        meta.appendChild(tags)
      }
      
      item.appendChild(meta)
    }
    
    // Add actions if provided
    if (data.actions) {
      const actions = document.createElement('div')
      actions.className = 'item-actions'
      
      data.actions.forEach(action => {
        const actionBtn = this.createButton(
          action.text,
          action.onClick,
          action.className || 'ui-btn-small'
        )
        actions.appendChild(actionBtn)
      })
      
      item.appendChild(actions)
    }
    
    return item
  }

  /**
   * Create a section with title
   * @param {string} title - Section title
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createSection(title, className = '') {
    const section = document.createElement('div')
    section.className = `section ${className}`.trim()
    
    if (title) {
      const titleEl = document.createElement('h3')
      titleEl.textContent = title
      section.appendChild(titleEl)
    }
    
    return section
  }

  /**
   * Create a grid layout
   * @param {Array} items - Grid items
   * @param {Object} options - Grid options
   * @returns {HTMLElement}
   */
  static createGrid(items, options = {}) {
    const grid = document.createElement('div')
    grid.className = `grid ${options.className || ''}`.trim()
    
    items.forEach(item => {
      const gridItem = document.createElement('div')
      gridItem.className = `grid-item ${item.className || ''}`.trim()
      gridItem.textContent = item.text
      grid.appendChild(gridItem)
    })
    
    return grid
  }

  /**
   * Create a confirmation dialog
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Confirm handler
   * @param {Function} onCancel - Cancel handler
   * @param {Object} options - Dialog options
   * @returns {HTMLElement}
   */
  static createConfirmDialog(message, onConfirm, onCancel, options = {}) {
    const dialog = document.createElement('div')
    dialog.className = 'confirm-dialog'
    
    const messageEl = document.createElement('div')
    messageEl.className = 'confirm-message'
    messageEl.textContent = message
    dialog.appendChild(messageEl)
    
    const buttonContainer = document.createElement('div')
    buttonContainer.className = 'confirm-buttons'
    
    const confirmBtn = this.createButton(
      options.confirmText || 'Confirm',
      onConfirm,
      'ui-btn-primary'
    )
    
    const cancelBtn = this.createButton(
      options.cancelText || 'Cancel',
      onCancel,
      'ui-btn-secondary'
    )
    
    buttonContainer.appendChild(confirmBtn)
    buttonContainer.appendChild(cancelBtn)
    dialog.appendChild(buttonContainer)
    
    return dialog
  }

  /**
   * Create a loading spinner
   * @param {string} text - Loading text
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createLoadingSpinner(text = 'Loading...', className = '') {
    const spinner = document.createElement('div')
    spinner.className = `loading-spinner ${className}`.trim()
    
    const spinnerEl = document.createElement('div')
    spinnerEl.className = 'spinner'
    spinner.appendChild(spinnerEl)
    
    if (text) {
      const textEl = document.createElement('div')
      textEl.className = 'spinner-text'
      textEl.textContent = text
      spinner.appendChild(textEl)
    }
    
    return spinner
  }

  /**
   * Create a status indicator
   * @param {string} status - Status type
   * @param {string} text - Status text
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createStatusIndicator(status, text, className = '') {
    const indicator = document.createElement('div')
    indicator.className = `status-indicator status-${status} ${className}`.trim()
    
    const icon = document.createElement('span')
    icon.className = 'status-icon'
    
    // Set appropriate icon based on status
    switch (status) {
      case 'success':
        icon.textContent = '✓'
        break
      case 'error':
        icon.textContent = '✗'
        break
      case 'warning':
        icon.textContent = '⚠'
        break
      case 'info':
        icon.textContent = 'ℹ'
        break
      default:
        icon.textContent = '•'
    }
    
    const textEl = document.createElement('span')
    textEl.className = 'status-text'
    textEl.textContent = text
    
    indicator.appendChild(icon)
    indicator.appendChild(textEl)
    
    return indicator
  }

  /**
   * Create a tabbed interface
   * @param {Array} tabs - Tab configurations
   * @param {Object} options - Tab options
   * @returns {HTMLElement}
   */
  static createTabs(tabs, options = {}) {
    const tabContainer = document.createElement('div')
    tabContainer.className = 'tab-container'
    
    const tabList = document.createElement('div')
    tabList.className = 'tab-list'
    
    const tabContent = document.createElement('div')
    tabContent.className = 'tab-content'
    
    tabs.forEach((tab, index) => {
      const tabButton = this.createButton(
        tab.title,
        () => this.switchTab(tabContainer, index),
        `tab-button ${index === 0 ? 'active' : ''}`
      )
      tabList.appendChild(tabButton)
      
      const tabPanel = document.createElement('div')
      tabPanel.className = `tab-panel ${index === 0 ? 'active' : ''}`
      tabPanel.innerHTML = tab.content
      tabContent.appendChild(tabPanel)
    })
    
    tabContainer.appendChild(tabList)
    tabContainer.appendChild(tabContent)
    
    return tabContainer
  }

  /**
   * Switch between tabs
   * @param {HTMLElement} tabContainer - Tab container
   * @param {number} activeIndex - Index of active tab
   */
  static switchTab(tabContainer, activeIndex) {
    const buttons = tabContainer.querySelectorAll('.tab-button')
    const panels = tabContainer.querySelectorAll('.tab-panel')
    
    buttons.forEach((button, index) => {
      button.classList.toggle('active', index === activeIndex)
    })
    
    panels.forEach((panel, index) => {
      panel.classList.toggle('active', index === activeIndex)
    })
  }

  /**
   * Create a modal dialog
   * @param {string} title - Modal title
   * @param {HTMLElement} content - Modal content
   * @param {Object} options - Modal options
   * @returns {HTMLElement}
   */
  static createModal(title, content, options = {}) {
    const modal = document.createElement('div')
    modal.className = 'modal'
    
    const modalContent = document.createElement('div')
    modalContent.className = 'modal-content'
    
    const header = document.createElement('div')
    header.className = 'modal-header'
    
    const titleEl = document.createElement('h3')
    titleEl.textContent = title
    header.appendChild(titleEl)
    
    const closeBtn = this.createButton(
      '×',
      () => this.closeModal(modal),
      'modal-close'
    )
    header.appendChild(closeBtn)
    
    const body = document.createElement('div')
    body.className = 'modal-body'
    body.appendChild(content)
    
    modalContent.appendChild(header)
    modalContent.appendChild(body)
    modal.appendChild(modalContent)
    
    // Add backdrop click to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal)
      }
    })
    
    return modal
  }

  /**
   * Close a modal dialog
   * @param {HTMLElement} modal - Modal element
   */
  static closeModal(modal) {
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal)
    }
  }

  /**
   * Show a modal dialog
   * @param {HTMLElement} modal - Modal element
   */
  static showModal(modal) {
    document.body.appendChild(modal)
  }

  /**
   * Create a tooltip
   * @param {HTMLElement} element - Element to attach tooltip to
   * @param {string} text - Tooltip text
   * @param {Object} options - Tooltip options
   */
  static createTooltip(element, text, options = {}) {
    const tooltip = document.createElement('div')
    tooltip.className = 'tooltip'
    tooltip.textContent = text
    
    element.addEventListener('mouseenter', () => {
      document.body.appendChild(tooltip)
      this.positionTooltip(element, tooltip, options)
    })
    
    element.addEventListener('mouseleave', () => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip)
      }
    })
  }

  /**
   * Position a tooltip relative to an element
   * @param {HTMLElement} element - Target element
   * @param {HTMLElement} tooltip - Tooltip element
   * @param {Object} options - Positioning options
   */
  static positionTooltip(element, tooltip, options = {}) {
    const rect = element.getBoundingClientRect()
    const position = options.position || 'top'
    
    let top, left
    
    switch (position) {
      case 'top':
        top = rect.top - tooltip.offsetHeight - 5
        left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)
        break
      case 'bottom':
        top = rect.bottom + 5
        left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)
        break
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltip.offsetHeight / 2)
        left = rect.left - tooltip.offsetWidth - 5
        break
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltip.offsetHeight / 2)
        left = rect.right + 5
        break
    }
    
    tooltip.style.top = `${top}px`
    tooltip.style.left = `${left}px`
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIComponents
} 
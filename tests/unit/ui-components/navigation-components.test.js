import { describe, test, expect, beforeEach, vi } from 'vitest';
import UIComponents from '../../../utils/ui-components.js';

describe('Navigation Components Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Tab Navigation', () => {
    test('should create accessible tab interface', () => {
      const tabs = [
        {
          id: 'bookmarks',
          label: 'Bookmarks',
          content: '<div>Bookmark content</div>',
        },
        {
          id: 'settings',
          label: 'Settings',
          content: '<div>Settings content</div>',
        },
        { id: 'help', label: 'Help', content: '<div>Help content</div>' },
      ];

      const tabContainer = UIComponents.createTabs({
        tabs,
        activeTab: 'bookmarks',
      });

      // Test tab list structure and accessibility
      const tabList = tabContainer.querySelector('[role="tablist"]');
      const tabButtons = tabContainer.querySelectorAll('[role="tab"]');
      const tabPanels = tabContainer.querySelectorAll('[role="tabpanel"]');

      expect(tabList).toBeTruthy();
      expect(tabButtons).toHaveLength(3);
      expect(tabPanels).toHaveLength(3);

      // Test active tab
      const activeTab = tabContainer.querySelector('[aria-selected="true"]');
      expect(activeTab.textContent).toBe('Bookmarks');
    });

    test('should switch tabs correctly', () => {
      const onTabChange = vi.fn();
      const tabs = [
        { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
        { id: 'tab2', label: 'Tab 2', content: 'Content 2' },
      ];

      const tabContainer = UIComponents.createTabs({
        tabs,
        activeTab: 'tab1',
        onTabChange,
      });

      document.body.appendChild(tabContainer);

      // Click on tab2
      const tab2Button = tabContainer.querySelector('[data-tab="tab2"]');
      tab2Button.click();

      // Test tab switching
      expect(onTabChange).toHaveBeenCalledWith('tab2');
      expect(tab2Button.getAttribute('aria-selected')).toBe('true');

      const tab2Panel = tabContainer.querySelector('#tab2-panel');
      expect(tab2Panel.style.display).not.toBe('none');
    });

    test('should support keyboard navigation', () => {
      const tabs = [
        { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
        { id: 'tab2', label: 'Tab 2', content: 'Content 2' },
        { id: 'tab3', label: 'Tab 3', content: 'Content 3' },
      ];

      const tabContainer = UIComponents.createTabs({ tabs, activeTab: 'tab1' });
      document.body.appendChild(tabContainer);

      const tab1 = tabContainer.querySelector('[data-tab="tab1"]');
      const tab2 = tabContainer.querySelector('[data-tab="tab2"]');

      tab1.focus();

      // Test arrow key navigation
      const rightArrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
      });
      tab1.dispatchEvent(rightArrowEvent);

      // Should move focus to next tab
      expect(document.activeElement).toBe(tab2);
    });
  });

  describe('Breadcrumb Navigation', () => {
    test('should create accessible breadcrumb navigation', () => {
      const breadcrumbItems = [
        { label: 'Home', href: '#home' },
        { label: 'Bookmarks', href: '#bookmarks' },
        { label: 'Category', href: '#category' },
        { label: 'Current Page' }, // No href for current page
      ];

      const breadcrumb = UIComponents.createBreadcrumb(breadcrumbItems);

      // Test breadcrumb structure
      expect(breadcrumb.getAttribute('aria-label')).toBe('Breadcrumb');

      const items = breadcrumb.querySelectorAll('li');
      expect(items).toHaveLength(4);

      // Test current page (last item) has aria-current
      const currentItem = items[items.length - 1];
      expect(currentItem.getAttribute('aria-current')).toBe('page');

      // Test links
      const links = breadcrumb.querySelectorAll('a');
      expect(links).toHaveLength(3); // Current page should not be a link
    });

    test('should handle breadcrumb click navigation', () => {
      const onNavigate = vi.fn();
      const breadcrumbItems = [
        { label: 'Home', href: '#home', onClick: () => onNavigate('home') },
        {
          label: 'Bookmarks',
          href: '#bookmarks',
          onClick: () => onNavigate('bookmarks'),
        },
      ];

      const breadcrumb = UIComponents.createBreadcrumb(breadcrumbItems);
      document.body.appendChild(breadcrumb);

      // Click on breadcrumb item
      const homeLink = breadcrumb.querySelector('a[href="#home"]');
      homeLink.click();

      expect(onNavigate).toHaveBeenCalledWith('home');
    });
  });

  describe('Menu Navigation', () => {
    test('should create accessible navigation menu', () => {
      const menuItems = [
        { id: 'bookmarks', label: 'My Bookmarks', icon: 'bookmark' },
        { id: 'categories', label: 'Categories', icon: 'folder' },
        { id: 'settings', label: 'Settings', icon: 'gear' },
        { id: 'help', label: 'Help', icon: 'question' },
      ];

      const menu = UIComponents.createNavMenu({
        items: menuItems,
        activeItem: 'bookmarks',
      });

      // Test menu structure
      expect(menu.getAttribute('role')).toBe('navigation');

      const menuLinks = menu.querySelectorAll('a');
      expect(menuLinks).toHaveLength(4);

      // Test active item
      const activeItem = menu.querySelector('.active');
      expect(activeItem.textContent).toContain('My Bookmarks');
    });

    test('should handle menu item selection', () => {
      const onSelect = vi.fn();
      const menuItems = [
        { id: 'item1', label: 'Item 1', onClick: () => onSelect('item1') },
        { id: 'item2', label: 'Item 2', onClick: () => onSelect('item2') },
      ];

      const menu = UIComponents.createNavMenu({ items: menuItems });
      document.body.appendChild(menu);

      // Click menu item
      const item1Link = menu.querySelector('[data-item="item1"]');
      item1Link.click();

      expect(onSelect).toHaveBeenCalledWith('item1');
    });
  });

  describe('Header with Navigation', () => {
    test('should create complete header with navigation', () => {
      const header = UIComponents.createHeaderWithNav({
        title: 'ForgetfulMe',
        subtitle: 'Bookmark Manager',
        navigation: [
          { id: 'home', label: 'Home' },
          { id: 'bookmarks', label: 'Bookmarks' },
        ],
        actions: [{ label: 'Sign Out', onClick: vi.fn() }],
      });

      // Test header structure
      expect(header.tagName).toBe('HEADER');

      const title = header.querySelector('h1');
      expect(title.textContent).toContain('ForgetfulMe');

      const nav = header.querySelector('nav');
      expect(nav).toBeTruthy();

      const navItems = nav.querySelectorAll('a');
      expect(navItems).toHaveLength(2);

      const actions = header.querySelector('.header-actions');
      expect(actions).toBeTruthy();
    });

    test('should be responsive and accessible', () => {
      const header = UIComponents.createHeaderWithNav({
        title: 'ForgetfulMe',
        navigation: [{ id: 'nav1', label: 'Navigation 1' }],
      });

      // Test mobile menu toggle if present
      const mobileToggle = header.querySelector('.mobile-menu-toggle');
      if (mobileToggle) {
        expect(mobileToggle.getAttribute('aria-expanded')).toBe('false');

        // Test toggle functionality
        mobileToggle.click();
        expect(mobileToggle.getAttribute('aria-expanded')).toBe('true');
      }
    });
  });

  describe('Navigation State Management', () => {
    test('should update navigation state correctly', () => {
      const tabs = [
        { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
        { id: 'tab2', label: 'Tab 2', content: 'Content 2' },
      ];

      const tabContainer = UIComponents.createTabs({ tabs, activeTab: 'tab1' });
      document.body.appendChild(tabContainer);

      // Switch to tab2 programmatically
      UIComponents.switchTab(tabContainer, 'tab2');

      // Test state update
      const tab1 = tabContainer.querySelector('[data-tab="tab1"]');
      const tab2 = tabContainer.querySelector('[data-tab="tab2"]');

      expect(tab1.getAttribute('aria-selected')).toBe('false');
      expect(tab2.getAttribute('aria-selected')).toBe('true');

      const panel1 = tabContainer.querySelector('#tab1-panel');
      const panel2 = tabContainer.querySelector('#tab2-panel');

      expect(panel1.style.display).toBe('none');
      expect(panel2.style.display).not.toBe('none');
    });
  });

  describe('Navigation Error Handling', () => {
    test('should handle invalid tab switching gracefully', () => {
      const tabs = [{ id: 'tab1', label: 'Tab 1', content: 'Content 1' }];

      const tabContainer = UIComponents.createTabs({ tabs, activeTab: 'tab1' });
      document.body.appendChild(tabContainer);

      // Try to switch to non-existent tab
      expect(() => {
        UIComponents.switchTab(tabContainer, 'nonexistent-tab');
      }).not.toThrow();

      // Original tab should remain active
      const tab1 = tabContainer.querySelector('[data-tab="tab1"]');
      expect(tab1.getAttribute('aria-selected')).toBe('true');
    });

    test('should handle empty navigation menus', () => {
      const menu = UIComponents.createNavMenu({ items: [] });

      expect(menu).toBeTruthy();
      expect(menu.tagName).toBe('NAV');

      const menuItems = menu.querySelectorAll('a');
      expect(menuItems).toHaveLength(0);
    });
  });
});

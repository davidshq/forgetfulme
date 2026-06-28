import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecentList } from '../../components/recent-list.js';

describe('RecentList', () => {
  let recentList;
  let onPageChange;

  beforeEach(() => {
    vi.clearAllMocks();
    onPageChange = vi.fn();
    recentList = new RecentList({ onPageChange });
    recentList.createCard();
  });

  it('hides pagination on the first page when there is no next page', () => {
    recentList.displayBookmarks([{ title: 'Example', read_status: 'read' }], {
      page: 1,
      hasNextPage: false,
    });

    expect(recentList.paginationContainer.hidden).toBe(true);
  });

  it('shows pagination controls when a next page exists', () => {
    recentList.displayBookmarks(
      Array.from({ length: 5 }, (_, index) => ({
        title: `Example ${index}`,
        read_status: 'read',
      })),
      { page: 1, hasNextPage: true },
    );

    expect(recentList.paginationContainer.hidden).toBe(false);
    expect(recentList.pageIndicator.textContent).toBe('Page 1');
    expect(recentList.prevButton.disabled).toBe(true);
    expect(recentList.nextButton.disabled).toBe(false);
  });

  it('requests the next page when Next is clicked', () => {
    recentList.updatePagination({ page: 1, hasNextPage: true });

    recentList.nextButton.click();

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('requests the previous page when Previous is clicked', () => {
    recentList.updatePagination({ page: 2, hasNextPage: true });

    recentList.prevButton.click();

    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});

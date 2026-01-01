/**
 * @fileoverview Unit tests for realtime manager
 * @module tests/unit/realtime-manager
 * @description Tests for RealtimeManager class
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { RealtimeManager } from '../../utils/realtime-manager.js';

describe('RealtimeManager', () => {
  let realtimeManager;
  let mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client with channel methods
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({}),
    };

    mockSupabase = {
      channel: vi.fn(() => mockChannel),
      removeChannel: vi.fn(),
    };

    realtimeManager = new RealtimeManager(mockSupabase);
  });

  describe('constructor', () => {
    test('should initialize with supabase client', () => {
      expect(realtimeManager.supabase).toBe(mockSupabase);
      expect(realtimeManager.subscriptions).toBeInstanceOf(Map);
    });

    test('should initialize with empty subscriptions map', () => {
      expect(realtimeManager.subscriptions.size).toBe(0);
    });
  });

  describe('subscribeToBookmarks', () => {
    test('should subscribe to bookmark changes', () => {
      const userId = 'user-123';
      const callback = vi.fn();

      const subscription = realtimeManager.subscribeToBookmarks(userId, callback);

      expect(mockSupabase.channel).toHaveBeenCalledWith('bookmarks');
      expect(subscription).toBeDefined();
      expect(realtimeManager.subscriptions.has('bookmarks')).toBe(true);
    });

    test('should configure postgres_changes listener', () => {
      const userId = 'user-123';
      const callback = vi.fn();
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({}),
      };
      mockSupabase.channel.mockReturnValue(mockChannel);

      realtimeManager.subscribeToBookmarks(userId, callback);

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        expect.any(Function),
      );
    });

    test('should call callback when change event occurs', () => {
      const userId = 'user-123';
      const callback = vi.fn();
      let eventCallback;

      const mockChannel = {
        on: vi.fn((event, config, cb) => {
          eventCallback = cb;
          return mockChannel;
        }),
        subscribe: vi.fn().mockReturnValue({}),
      };
      mockSupabase.channel.mockReturnValue(mockChannel);

      realtimeManager.subscribeToBookmarks(userId, callback);

      const payload = {
        eventType: 'INSERT',
        new: { id: '1', title: 'New Bookmark' },
      };

      eventCallback(payload);

      expect(callback).toHaveBeenCalledWith(payload);
    });

    test('should store subscription in subscriptions map', () => {
      const userId = 'user-123';
      const callback = vi.fn();
      const mockSubscription = { id: 'sub-123' };

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue(mockSubscription),
      };
      mockSupabase.channel.mockReturnValue(mockChannel);

      realtimeManager.subscribeToBookmarks(userId, callback);

      expect(realtimeManager.subscriptions.get('bookmarks')).toBe(mockSubscription);
    });

    test('should replace existing subscription if called twice', () => {
      const userId = 'user-123';
      const callback = vi.fn();
      const mockSubscription1 = { id: 'sub-1' };
      const mockSubscription2 = { id: 'sub-2' };

      const mockChannel1 = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue(mockSubscription1),
      };
      const mockChannel2 = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue(mockSubscription2),
      };
      mockSupabase.channel.mockReturnValueOnce(mockChannel1).mockReturnValueOnce(mockChannel2);

      realtimeManager.subscribeToBookmarks(userId, callback);
      realtimeManager.subscribeToBookmarks(userId, callback);

      expect(realtimeManager.subscriptions.get('bookmarks')).toBe(mockSubscription2);
    });
  });

  describe('unsubscribe', () => {
    test('should unsubscribe from channel', () => {
      const userId = 'user-123';
      const callback = vi.fn();
      const mockSubscription = { id: 'sub-123' };

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue(mockSubscription),
      };
      mockSupabase.channel.mockReturnValue(mockChannel);

      realtimeManager.subscribeToBookmarks(userId, callback);
      realtimeManager.unsubscribe('bookmarks');

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockSubscription);
      expect(realtimeManager.subscriptions.has('bookmarks')).toBe(false);
    });

    test('should not throw when unsubscribing from non-existent channel', () => {
      expect(() => realtimeManager.unsubscribe('non-existent')).not.toThrow();
    });

    test('should not call removeChannel when channel does not exist', () => {
      realtimeManager.unsubscribe('non-existent');

      expect(mockSupabase.removeChannel).not.toHaveBeenCalled();
    });

    test('should remove subscription from map after unsubscribe', () => {
      const userId = 'user-123';
      const callback = vi.fn();
      const mockSubscription = { id: 'sub-123' };

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue(mockSubscription),
      };
      mockSupabase.channel.mockReturnValue(mockChannel);

      realtimeManager.subscribeToBookmarks(userId, callback);
      expect(realtimeManager.subscriptions.size).toBe(1);

      realtimeManager.unsubscribe('bookmarks');
      expect(realtimeManager.subscriptions.size).toBe(0);
    });
  });
});

/**
 * Simple test suite for BookmarkTransformer
 * This can be run in the browser console to verify functionality
 */
class BookmarkTransformerTest {
  static runAllTests() {
    console.log('🧪 Running BookmarkTransformer tests...');

    const tests = [
      this.testToSupabaseFormat,
      this.testToUIFormat,
      this.testFromCurrentTab,
      this.testNormalizeTags,
      this.testValidate,
      this.testTransformMultiple,
    ];

    let passed = 0;
    let failed = 0;

    tests.forEach(test => {
      try {
        test();
        console.log(`✅ ${test.name} passed`);
        passed++;
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error.message);
        failed++;
      }
    });

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    return { passed, failed };
  }

  static testToSupabaseFormat() {
    const input = {
      url: 'https://example.com',
      title: 'Test Page',
      status: 'read',
      tags: ['test', 'demo'],
      timestamp: 1640995200000, // 2022-01-01
    };

    const result = BookmarkTransformer.toSupabaseFormat(input, 'user-123');

    if (!result.user_id || result.user_id !== 'user-123') {
      throw new Error('user_id not set correctly');
    }
    if (!result.url || result.url !== 'https://example.com') {
      throw new Error('url not preserved');
    }
    if (!result.read_status || result.read_status !== 'read') {
      throw new Error('read_status not set correctly');
    }
    if (!Array.isArray(result.tags) || result.tags.length !== 2) {
      throw new Error('tags not normalized correctly');
    }
    if (!result.created_at || !result.updated_at) {
      throw new Error('timestamps not set');
    }
  }

  static testToUIFormat() {
    const input = {
      id: 'bookmark-123',
      url: 'https://example.com',
      title: 'Test Page',
      description: 'Test description',
      read_status: 'read',
      tags: ['test', 'demo'],
      created_at: '2022-01-01T00:00:00Z',
      updated_at: '2022-01-01T00:00:00Z',
      last_accessed: '2022-01-01T00:00:00Z',
      access_count: 5,
    };

    const result = BookmarkTransformer.toUIFormat(input);

    if (result.status !== 'read') {
      throw new Error('status not mapped correctly');
    }
    if (!Array.isArray(result.tags) || result.tags.length !== 2) {
      throw new Error('tags not preserved');
    }
    if (result.id !== 'bookmark-123') {
      throw new Error('id not preserved');
    }
  }

  static testFromCurrentTab() {
    const tab = {
      url: 'https://example.com',
      title: 'Test Page',
    };

    const result = BookmarkTransformer.fromCurrentTab(tab, 'read', ['test']);

    if (result.url !== 'https://example.com') {
      throw new Error('url not preserved');
    }
    if (result.title !== 'Test Page') {
      throw new Error('title not preserved');
    }
    if (result.status !== 'read') {
      throw new Error('status not set');
    }
    if (!Array.isArray(result.tags) || result.tags.length !== 1) {
      throw new Error('tags not set correctly');
    }
    if (!result.timestamp) {
      throw new Error('timestamp not set');
    }
  }

  static testNormalizeTags() {
    // Test string input
    const result1 = BookmarkTransformer.normalizeTags('tag1, tag2, tag3');
    if (!Array.isArray(result1) || result1.length !== 3) {
      throw new Error('string tags not normalized correctly');
    }

    // Test array input
    const result2 = BookmarkTransformer.normalizeTags(['tag1', 'tag2']);
    if (!Array.isArray(result2) || result2.length !== 2) {
      throw new Error('array tags not normalized correctly');
    }

    // Test empty input
    const result3 = BookmarkTransformer.normalizeTags('');
    if (!Array.isArray(result3) || result3.length !== 0) {
      throw new Error('empty tags not handled correctly');
    }
  }

  static testValidate() {
    // Test valid bookmark
    const validBookmark = {
      url: 'https://example.com',
      title: 'Test Page',
      tags: ['test'],
    };

    const validResult = BookmarkTransformer.validate(validBookmark);
    if (!validResult.isValid) {
      throw new Error('valid bookmark should pass validation');
    }

    // Test invalid bookmark
    const invalidBookmark = {
      title: 'Test Page',
      // Missing URL
    };

    const invalidResult = BookmarkTransformer.validate(invalidBookmark);
    if (invalidResult.isValid) {
      throw new Error('invalid bookmark should fail validation');
    }
    if (invalidResult.errors.length === 0) {
      throw new Error('validation should return errors');
    }
  }

  static testTransformMultiple() {
    const bookmarks = [
      { url: 'https://example1.com', title: 'Page 1', status: 'read' },
      { url: 'https://example2.com', title: 'Page 2', status: 'unread' },
    ];

    const result = BookmarkTransformer.transformMultiple(bookmarks, 'user-123');

    if (!Array.isArray(result) || result.length !== 2) {
      throw new Error(
        'transformMultiple should return array with correct length'
      );
    }

    result.forEach((bookmark, index) => {
      if (bookmark.user_id !== 'user-123') {
        throw new Error(`bookmark ${index} should have correct user_id`);
      }
      if (!bookmark.url || !bookmark.title) {
        throw new Error(`bookmark ${index} should have required fields`);
      }
    });
  }
}

// Export for use in browser console
window.BookmarkTransformerTest = BookmarkTransformerTest;

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined' && window.BookmarkTransformer) {
  console.log(
    '🧪 BookmarkTransformer tests available. Run BookmarkTransformerTest.runAllTests() to test.'
  );
}

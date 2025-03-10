# How to Update the Rectangle Drawer Extension

If you've already installed the extension and want to update it with these new changes, follow these steps:

## Method 1: Reload the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Find the "Rectangle Drawer" extension in the list
3. Click the refresh/reload button (circular arrow icon) on the extension card
4. The extension will be updated with the latest code changes

## Method 2: Remove and Re-install

If the simple reload doesn't apply all changes correctly, you can:

1. Open Chrome and navigate to `chrome://extensions/`
2. Find the "Rectangle Drawer" extension in the list
3. Click "Remove" to uninstall it
4. Click "Load unpacked" and select the extension directory again
5. The extension will be installed with all the latest changes

## Testing After Update

After updating the extension:

1. Visit a webpage and try drawing some rectangles
2. Verify that the rectangles are saved per-page
3. Test the new enable/disable checkboxes
4. Check that rectangles appear immediately when visiting a page

## Common Issues

- **Storage conflicts**: If you experience strange behavior with saved rectangles, try clearing the extension's storage by right-clicking the extension icon, selecting "Options" and then looking for a storage reset option or manually removing it and reinstalling.
- **Cached content scripts**: Sometimes Chrome might cache old versions of content scripts. If you're not seeing the changes take effect, try closing and reopening Chrome completely.

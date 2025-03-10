// Settings and state
let settings = {
  color: '#FF0000',
  opacity: 0.5,
  drawingMode: false
};

// Get current page URL as a key for storing rectangles
const pageKey = window.location.href;

let rectangles = [];
let isDrawing = false;
let startX, startY;
let currentRectangle = null;
let canvasOverlay = null;
let ctx = null;

// Initialize the extension
function initialize() {
  // Create canvas overlay
  createCanvasOverlay();
  
  // Start drawing immediately (don't wait for everything to load)
  // Load page-specific rectangles using the URL as key
  chrome.storage.local.get([`rectangles_${pageKey}`, 'rectangleDrawerSettings'], (result) => {
    if (result[`rectangles_${pageKey}`]) {
      rectangles = result[`rectangles_${pageKey}`];
      drawAllRectangles();
    }
    
    if (result.rectangleDrawerSettings) {
      settings = result.rectangleDrawerSettings;
      
      // Apply active class if drawing mode is enabled
      if (settings.drawingMode && canvasOverlay) {
        canvasOverlay.classList.add('active');
      }
    }
  });
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'updateSettings':
        settings = message.settings;
        // Update canvas class based on drawing mode
        if (settings.drawingMode) {
          canvasOverlay.classList.add('active');
        } else {
          canvasOverlay.classList.remove('active');
        }
        break;
      case 'clearAll':
        rectangles = [];
        // Store with page-specific key
        const clearData = {};
        clearData[`rectangles_${pageKey}`] = rectangles;
        chrome.storage.local.set(clearData);
        drawAllRectangles();
        break;
      case 'deleteRectangle':
        if (message.index >= 0 && message.index < rectangles.length) {
          rectangles.splice(message.index, 1);
          // Store with page-specific key
          const deleteData = {};
          deleteData[`rectangles_${pageKey}`] = rectangles;
          chrome.storage.local.set(deleteData);
          drawAllRectangles();
        }
        break;
      case 'toggleRectangle':
        if (message.index >= 0 && message.index < rectangles.length) {
          rectangles[message.index].enabled = message.enabled;
          // Store with page-specific key
          const toggleData = {};
          toggleData[`rectangles_${pageKey}`] = rectangles;
          chrome.storage.local.set(toggleData);
          drawAllRectangles();
        }
        break;
    }
  });
}

// Create canvas overlay for drawing
function createCanvasOverlay() {
  // Remove existing canvas if any
  if (canvasOverlay) {
    document.body.removeChild(canvasOverlay);
  }
  
  // Create new canvas
  canvasOverlay = document.createElement('canvas');
  canvasOverlay.className = 'rectangle-drawer-overlay';
  
  // Set canvas size to match viewport
  canvasOverlay.width = window.innerWidth;
  canvasOverlay.height = window.innerHeight;
  
  // Append to document
  document.body.appendChild(canvasOverlay);
  
  // Get context for drawing
  ctx = canvasOverlay.getContext('2d');
  
  // Add event listeners
  canvasOverlay.addEventListener('mousedown', handleMouseDown);
  canvasOverlay.addEventListener('mousemove', handleMouseMove);
  canvasOverlay.addEventListener('mouseup', handleMouseUp);
  
  // Handle window resize
  window.addEventListener('resize', () => {
    // Adjust canvas size
    canvasOverlay.width = window.innerWidth;
    canvasOverlay.height = window.innerHeight;
    
    // Redraw all rectangles
    drawAllRectangles();
  });
}

// Mouse event handlers
function handleMouseDown(e) {
  if (!settings.drawingMode) return;
  
  isDrawing = true;
  startX = e.clientX;
  startY = e.clientY;
  
  // Create a new rectangle
  currentRectangle = {
    x: startX,
    y: startY,
    width: 0,
    height: 0,
    color: settings.color,
    opacity: settings.opacity
  };
}

function handleMouseMove(e) {
  if (!isDrawing || !settings.drawingMode) return;
  
  // Calculate dimensions
  const width = e.clientX - startX;
  const height = e.clientY - startY;
  
  // Update current rectangle
  currentRectangle.width = width;
  currentRectangle.height = height;
  
  // Redraw
  drawAllRectangles();
  drawRectangle(currentRectangle);
}

function handleMouseUp(e) {
  if (!isDrawing || !settings.drawingMode) return;
  
  isDrawing = false;
  
  // Finalize the rectangle dimensions
  currentRectangle.width = e.clientX - startX;
  currentRectangle.height = e.clientY - startY;
  
  // Only save if it has actual dimensions
  if (Math.abs(currentRectangle.width) > 5 && Math.abs(currentRectangle.height) > 5) {
    // Normalize rectangle coordinates if drawn from bottom right to top left
    if (currentRectangle.width < 0) {
      currentRectangle.x += currentRectangle.width;
      currentRectangle.width = Math.abs(currentRectangle.width);
    }
    
    if (currentRectangle.height < 0) {
      currentRectangle.y += currentRectangle.height;
      currentRectangle.height = Math.abs(currentRectangle.height);
    }
    
    // Add enabled property to the rectangle
    currentRectangle.enabled = true;
    
    // Save the rectangle
    rectangles.push(currentRectangle);
    
    // Store in chrome.storage with page-specific key
    const storageData = {};
    storageData[`rectangles_${pageKey}`] = rectangles;
    chrome.storage.local.set(storageData);
    
    // Notify popup
    chrome.runtime.sendMessage({
      action: 'rectanglesUpdated',
      rectangles: rectangles,
      pageUrl: pageKey
    });
  }
  
  // Reset current rectangle
  currentRectangle = null;
  
  // Redraw all rectangles
  drawAllRectangles();
}

// Drawing functions
function drawRectangle(rect) {
  if (!ctx) return;
  
  // Skip disabled rectangles
  if (rect.enabled === false) return;
  
  ctx.fillStyle = hexToRgba(rect.color, rect.opacity);
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  
  // Draw border
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
}

function drawAllRectangles() {
  if (!ctx) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
  
  // Draw all saved rectangles
  rectangles.forEach(rect => drawRectangle(rect));
}

// Utility function to convert hex color to rgba
function hexToRgba(hex, opacity) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Initialize when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

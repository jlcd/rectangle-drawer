// Store current page URL
let currentPageUrl = '';

// Default settings
let currentSettings = {
  color: '#FF0000',
  opacity: 0.5,
  drawingMode: false
};

// Store DOM elements
const colorPicker = document.getElementById('rectangle-color');
const opacitySlider = document.getElementById('rectangle-opacity');
const opacityValue = document.getElementById('opacity-value');
const drawingModeToggle = document.getElementById('drawing-mode');
const clearAllButton = document.getElementById('clear-all');
const savedRectanglesContainer = document.getElementById('saved-rectangles');

// Initialize popup with stored settings and get current page URL
function initializePopup() {
  // Get the active tab to find current URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const pageKey = `rectangles_${currentTab.url}`;
    
    // Pass the URL to get page-specific rectangles
    chrome.storage.local.get(['rectangleDrawerSettings', pageKey], (result) => {
      if (result.rectangleDrawerSettings) {
        currentSettings = result.rectangleDrawerSettings;
        colorPicker.value = currentSettings.color;
        opacitySlider.value = currentSettings.opacity;
        opacityValue.textContent = currentSettings.opacity;
        drawingModeToggle.checked = currentSettings.drawingMode;
      }

      // Display rectangles for current page if any
      if (result[pageKey]) {
        displaySavedRectangles(result[pageKey], currentTab.url);
      } else {
        displaySavedRectangles([], currentTab.url);
      }
    });
  });
}

// Update settings in storage and send to active tab
function updateSettings(settings) {
  chrome.storage.local.set({ rectangleDrawerSettings: settings });
  
  // Send updated settings to the content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'updateSettings',
      settings: settings
    });
  });
}

// Display saved rectangles in the popup
function displaySavedRectangles(rectangles, pageUrl) {
  // Store current URL for later use
  currentPageUrl = pageUrl;
  
  savedRectanglesContainer.innerHTML = '';
  
  if (rectangles.length === 0) {
    savedRectanglesContainer.innerHTML = '<p>No saved rectangles</p>';
    return;
  }
  
  rectangles.forEach((rect, index) => {
    const rectElement = document.createElement('div');
    rectElement.className = 'saved-rect';
    rectElement.style.backgroundColor = `rgba(240, 240, 240, 0.9)`;
    rectElement.style.display = 'flex';
    rectElement.style.alignItems = 'center';
    
    // Enable/disable checkbox
    const enableCheckbox = document.createElement('input');
    enableCheckbox.type = 'checkbox';
    enableCheckbox.checked = rect.enabled !== false; // Default to true if not specified
    enableCheckbox.style.marginRight = '5px';
    enableCheckbox.title = 'Enable/disable rectangle';
    enableCheckbox.addEventListener('change', () => {
      toggleRectangle(index, enableCheckbox.checked);
    });
    
    const colorPreview = document.createElement('span');
    colorPreview.className = 'color-preview';
    colorPreview.style.backgroundColor = rect.color;
    
    const rectInfo = document.createElement('span');
    rectInfo.textContent = `${Math.round(rect.width)}x${Math.round(rect.height)}`;
    rectInfo.style.flex = '1';
    rectInfo.style.marginLeft = '5px';
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'X';
    deleteButton.style.width = 'auto';
    deleteButton.style.padding = '2px 6px';
    deleteButton.addEventListener('click', () => {
      deleteRectangle(index);
    });
    
    rectElement.appendChild(enableCheckbox);
    rectElement.appendChild(colorPreview);
    rectElement.appendChild(rectInfo);
    rectElement.appendChild(deleteButton);
    savedRectanglesContainer.appendChild(rectElement);
  });
}

// Toggle rectangle visibility
function toggleRectangle(index, enabled) {
  const pageKey = `rectangles_${currentPageUrl}`;
  
  chrome.storage.local.get([pageKey], (result) => {
    const rectangles = result[pageKey] || [];
    
    if (index >= 0 && index < rectangles.length) {
      rectangles[index].enabled = enabled;
      
      // Store updated rectangles
      const storageData = {};
      storageData[pageKey] = rectangles;
      chrome.storage.local.set(storageData);
      
      // Send message to content script to update the rectangle
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleRectangle',
          index: index,
          enabled: enabled
        });
      });
    }
  });
}

// Delete a rectangle
function deleteRectangle(index) {
  const pageKey = `rectangles_${currentPageUrl}`;
  
  chrome.storage.local.get([pageKey], (result) => {
    const rectangles = result[pageKey] || [];
    
    if (index >= 0 && index < rectangles.length) {
      rectangles.splice(index, 1);
      
      // Store updated rectangles
      const storageData = {};
      storageData[pageKey] = rectangles;
      chrome.storage.local.set(storageData);
      
      // Update display
      displaySavedRectangles(rectangles, currentPageUrl);
      
      // Send message to content script to remove the rectangle
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'deleteRectangle',
          index: index
        });
      });
    }
  });
}

// Event Listeners
colorPicker.addEventListener('change', () => {
  currentSettings.color = colorPicker.value;
  updateSettings(currentSettings);
});

opacitySlider.addEventListener('input', () => {
  currentSettings.opacity = parseFloat(opacitySlider.value);
  opacityValue.textContent = currentSettings.opacity;
  updateSettings(currentSettings);
});

drawingModeToggle.addEventListener('change', () => {
  currentSettings.drawingMode = drawingModeToggle.checked;
  updateSettings(currentSettings);
});

clearAllButton.addEventListener('click', () => {
  const pageKey = `rectangles_${currentPageUrl}`;
  
  // Clear page-specific rectangles
  const clearData = {};
  clearData[pageKey] = [];
  chrome.storage.local.set(clearData);
  
  // Update display
  displaySavedRectangles([], currentPageUrl);
  
  // Send clear message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'clearAll' });
  });
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'rectanglesUpdated') {
    displaySavedRectangles(message.rectangles, message.pageUrl);
  }
});

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);

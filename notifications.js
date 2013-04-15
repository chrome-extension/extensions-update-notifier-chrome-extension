// TODO: Handle 2x images
var iconSize = 48;
var notificationSize = 80;

// Helper function which returns a basic notification options object.
function getNotificationOptions(extensionId) {
  return {
    type: 'basic',
    iconUrl: 'chrome://extension-icon/'+ extensionId +'/'+ iconSize +'/1'
  };
}

// Helper function which returns extension Icon Data Url.
function getExtensionIconDataUrl(url, callback) {
  var icon = new Image();
  icon.onload = function() {
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = notificationSize;

    var context = canvas.getContext('2d');
    context.fillStyle = '#EEE';
    context.fillRect(0, 0, canvas.width, canvas.height);

    var iconLeft = iconTop = (notificationSize - iconSize) / 2;
    context.drawImage(icon, iconLeft, iconTop);
    callback(canvas.toDataURL("image/png"));
  } 
  icon.src = url;
}

// Helper function which displays a notification.
function showNotification(notificationId, options) {
  getExtensionIconDataUrl(options.iconUrl, function(iconDataUrl) {
    options.iconUrl = iconDataUrl;
    chrome.notifications.create(notificationId, options, function(){ });
  });
}

// Show a notification when an extension has been updated.
function showExtensionUpdateNotification(extension, oldVersion) {
  var options = getNotificationOptions(extension.id);
  options.title = chrome.i18n.getMessage('updatedExtensionTitle', [extension.name]),
  options.message = chrome.i18n.getMessage('updatedExtensionMessage',
      [extension.name, oldVersion, extension.version]),
  options.buttons = [];

  // Add a "Visit website" button if it has one website.
  if (extension.homepageUrl !== '') {
    options.buttons.push({
      title: chrome.i18n.getMessage('websiteButtonTitle'),
      iconUrl: chrome.extension.getURL('images/website_16.png')
    });
    // And add a "Show changelog" button if the extension is enabled.
    if (extension.enabled) {
      options.buttons.push({
        title: chrome.i18n.getMessage('changelogButtonTitle'),
        iconUrl: chrome.extension.getURL('images/action_16.png')
      }); 
    }
  }
  // Make the icon gray and add an "Enable" button if the extension is disabled.
  if (!extension.enabled) {
    options.iconUrl += '?grayscale=true';
    options.buttons.push({
      title: chrome.i18n.getMessage('enableButtonTitle'),
      iconUrl: chrome.extension.getURL('images/action_16.png')
    });
  }
  showNotification(extension.id, options);
}

// Show a notification when an extension has been explicitely enabled.
function showExtensionEnabledNotification(extension) {
  var options = getNotificationOptions(extension.id);
  options.title = chrome.i18n.getMessage('updatedExtensionTitle', [extension.name]);
  options.message = chrome.i18n.getMessage('enabledExtensionMessage', [extension.name]);

  showNotification(extension.id, options);
}

// Handle notifications actions on button Click.
function onNotificationsButtonClicked(extensionId, buttonIndex) {
  chrome.management.get(extensionId, function(extension) {
    if (extension.homepageUrl) {
      if (buttonIndex === 0) {
        chrome.tabs.create({ 'url': extension.homepageUrl });
      } else if (buttonIndex === 1) {
        if (extension.enabled) {
          chrome.tabs.create({ 'url': chrome.extension.getURL('changelog.html#'+ extensionId) });
        } else {
          enableExtension(extension, showExtensionEnabledNotification);
        }
      }
    } else {
      enableExtension(extension, showExtensionEnabledNotification);
    }
  });
}

// Clear notification if user clicks on it.
function onNotificationsClicked(notificationId) {
  chrome.notifications.clear(notificationId, function(){ });
}

chrome.runtime.onInstalled.addListener(function(details) {
  // Display a Welcome notification if this extension is installed for the first time.
  if (details.reason === 'install') {
    var options = getNotificationOptions(chrome.runtime.id);
    options.title = chrome.i18n.getMessage('welcomeTitle');
    options.message = chrome.i18n.getMessage('welcomeText');

    showNotification('welcome', options);
  }
});

// Register all notifications event listeners.
chrome.notifications.onButtonClicked.addListener(onNotificationsButtonClicked);
chrome.notifications.onClicked.addListener(onNotificationsClicked);

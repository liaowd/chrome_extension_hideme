const DEFAULT_CONFIG = {
  enabled: true,
  targetUrls: [],
  fakePages: [
    'https://www.baidu.com',
    'https://www.google.com',
    'https://github.com',
    'https://stackoverflow.com',
    'https://docs.python.org'
  ],
  blurProtection: true,
  mouseLeaveProtection: false,
  cornerProtection: false,
  cornerSize: 50,
  autoRestore: true,
  fakeTitle: '',
  fakeFavicon: ''
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG), (result) => {
    const updates = {};
    for (const key of Object.keys(DEFAULT_CONFIG)) {
      if (!(key in result)) {
        updates[key] = DEFAULT_CONFIG[key];
      }
    }
    if (Object.keys(updates).length > 0) {
      chrome.storage.sync.set(updates);
    }
  });

  chrome.storage.sync.get(['targetUrl', 'targetUrls'], ({ targetUrl, targetUrls }) => {
    if (targetUrl && !targetUrls) {
      chrome.storage.sync.set({
        targetUrls: targetUrl ? [targetUrl] : [],
        targetUrl: undefined
      });
    }
  });
});

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  if (command === 'toggle-protection') {
    const { enabled } = await chrome.storage.sync.get('enabled');
    await chrome.storage.sync.set({ enabled: !enabled });
    chrome.tabs.sendMessage(tab.id, { action: 'toggle', enabled: !enabled });
  } else if (command === 'emergency-cover') {
    chrome.tabs.sendMessage(tab.id, { action: 'emergency' });
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (tab.url) {
    chrome.tabs.sendMessage(tabId, { action: 'checkVisibility' }).catch(() => {});
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    const tabs = await chrome.tabs.query({ active: true });
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { action: 'checkVisibility' }).catch(() => {});
    }
  }
});

const $ = (sel) => document.querySelector(sel);

chrome.storage.sync.get(['enabled', 'targetUrls'], ({ enabled, targetUrls }) => {
  $('#statusDot').className = 'status-dot ' + (enabled ? 'on' : 'off');
  $('#mainToggle').classList.toggle('on', enabled);

  const container = $('#targetUrls');
  const urls = targetUrls || [];
  if (urls.length === 0) {
    container.innerHTML = '<span style="color:#999;">未设置</span>';
  } else {
    container.innerHTML = urls.map(u => `<span class="target-tag" title="${u}">${u}</span>`).join('');
  }
});

$('#mainToggle').onclick = () => {
  chrome.storage.sync.get('enabled', ({ enabled }) => {
    const newState = !enabled;
    chrome.storage.sync.set({ enabled: newState });
    $('#statusDot').className = 'status-dot ' + (newState ? 'on' : 'off');
    $('#mainToggle').classList.toggle('on', newState);

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) chrome.tabs.sendMessage(tab.id, { action: 'toggle', enabled: newState });
    });
  });
};

$('#emergencyBtn').onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab) chrome.tabs.sendMessage(tab.id, { action: 'emergency' });
  });
};

$('#optionsBtn').onclick = () => {
  chrome.runtime.openOptionsPage();
};

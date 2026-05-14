const $ = (sel) => document.querySelector(sel);

let config = {};

function renderUrlList() {
  const list = $('#urlList');
  list.innerHTML = '';
  const urls = config.targetUrls || [];
  urls.forEach((url, idx) => {
    const row = document.createElement('div');
    row.className = 'url-row';
    row.innerHTML = `
      <input type="text" value="${url}" placeholder="https://example.com/*" data-idx="${idx}">
      <button class="btn-icon remove" data-idx="${idx}">-</button>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('.btn-icon.remove').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.idx);
      config.targetUrls.splice(idx, 1);
      renderUrlList();
    };
  });
}

function loadConfig() {
  chrome.storage.sync.get([
    'targetUrls', 'fakePages', 'blurProtection', 'mouseLeaveProtection',
    'cornerProtection', 'cornerSize', 'autoRestore', 'fakeTitle', 'fakeFavicon'
  ], (result) => {
    config = {
      targetUrls: result.targetUrls || [],
      fakePages: result.fakePages || [],
      blurProtection: result.blurProtection ?? true,
      mouseLeaveProtection: result.mouseLeaveProtection ?? false,
      cornerProtection: result.cornerProtection ?? false,
      cornerSize: result.cornerSize ?? 50,
      autoRestore: result.autoRestore ?? true,
      fakeTitle: result.fakeTitle || '',
      fakeFavicon: result.fakeFavicon || ''
    };

    renderUrlList();
    $('#fakePages').value = config.fakePages.join('\n');
    $('#blurToggle').classList.toggle('on', config.blurProtection);
    $('#mouseToggle').classList.toggle('on', config.mouseLeaveProtection);
    $('#cornerToggle').classList.toggle('on', config.cornerProtection);
    $('#autoRestoreToggle').classList.toggle('on', config.autoRestore);
    $('#cornerSize').value = config.cornerSize;
    $('#fakeTitle').value = config.fakeTitle;
    $('#fakeFavicon').value = config.fakeFavicon;
  });
}

function toggleSwitch(id, key) {
  $(id).onclick = () => {
    config[key] = !config[key];
    $(id).classList.toggle('on', config[key]);
  };
}

$('#addUrlBtn').onclick = () => {
  config.targetUrls.push('');
  renderUrlList();
};

toggleSwitch('#blurToggle', 'blurProtection');
toggleSwitch('#mouseToggle', 'mouseLeaveProtection');
toggleSwitch('#cornerToggle', 'cornerProtection');
toggleSwitch('#autoRestoreToggle', 'autoRestore');

$('#saveBtn').onclick = () => {
  const rows = $('#urlList').querySelectorAll('.url-row');
  const targetUrls = [];
  rows.forEach(row => {
    const val = row.querySelector('input').value.trim();
    if (val) targetUrls.push(val);
  });

  const fakePages = $('#fakePages').value.split('\n').map(s => s.trim()).filter(Boolean);

  const newConfig = {
    targetUrls,
    fakePages: fakePages.length > 0 ? fakePages : config.fakePages,
    blurProtection: config.blurProtection,
    mouseLeaveProtection: config.mouseLeaveProtection,
    cornerProtection: config.cornerProtection,
    cornerSize: parseInt($('#cornerSize').value) || 50,
    autoRestore: config.autoRestore,
    fakeTitle: $('#fakeTitle').value.trim(),
    fakeFavicon: $('#fakeFavicon').value.trim()
  };

  chrome.storage.sync.set(newConfig, () => {
    const toast = $('#toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  });
};

loadConfig();

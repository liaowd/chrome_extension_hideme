(function () {
  'use strict';

  let config = null;
  let isCovered = false;
  let coverEl = null;
  let indicatorEl = null;
  let mouseX = 0, mouseY = 0;
  let checkInterval = null;
  let lastCoverTime = 0;
  let lastUncoverTime = 0;

  function matchUrl(url, patterns) {
    if (!patterns || patterns.length === 0) return false;

    // 生成去掉端口的 URL 版本（如 http://host:8080/path → http://host/path）
    const urlWithoutPort = url.replace(/(https?:\/\/[^\/]+):\d+/, '$1');

    for (const pattern of patterns) {
      if (!pattern) continue;
      if (pattern === '*') return true;

      // pattern 是否包含端口
      const patternHasPort = /\/\/[^\/]+:\d+/.test(pattern);

      // 精确匹配
      if (url === pattern) return true;
      if (!patternHasPort && urlWithoutPort === pattern) return true;

      // 前缀匹配（无通配符）
      if (!pattern.includes('*') && url.startsWith(pattern)) return true;
      if (!patternHasPort && !pattern.includes('*') && urlWithoutPort.startsWith(pattern)) return true;

      // 通配符匹配
      if (pattern.includes('*')) {
        const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
        const regex = new RegExp('^' + escaped + '$');
        if (regex.test(url)) return true;
        if (!patternHasPort && regex.test(urlWithoutPort)) return true;
      }
    }
    return false;
  }

  function isTargetPage() {
    const result = config && config.enabled && matchUrl(location.href, config.targetUrls);
    console.log('isTargetPage', { href: location.href, enabled: config?.enabled, result });
    return result;
  }

  function createIndicator() {
    if (indicatorEl) return;
    if (!document.documentElement) return;
    indicatorEl = document.createElement('div');
    indicatorEl.id = 'hideme-indicator';
    Object.assign(indicatorEl.style, {
      position: 'fixed',
      top: '12px',
      right: '12px',
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      background: '#22c55e',
      boxShadow: '0 0 8px #22c55e88, 0 0 16px #22c55e44',
      zIndex: '2147483646',
      pointerEvents: 'none',
      transition: 'opacity 0.3s',
      opacity: '0'
    });
    document.documentElement.appendChild(indicatorEl);
  }

  function showIndicator() {
    if (!indicatorEl) createIndicator();
    if (indicatorEl) indicatorEl.style.opacity = '1';
  }

  function hideIndicator() {
    if (indicatorEl) indicatorEl.style.opacity = '0';
  }

  function updateIndicator() {
    if (isTargetPage()) {
      showIndicator();
    } else {
      hideIndicator();
    }
  }

  function pickFakePage() {
    const pages = config.fakePages || [];
    if (pages.length === 0) return 'about:blank';
    return pages[Math.floor(Math.random() * pages.length)];
  }

  function createCover() {
    if (coverEl) {
      coverEl.remove();
      coverEl = null;
    }
    const url = pickFakePage();
    console.log('createCover', url);

    coverEl = document.createElement('div');
    coverEl.id = 'hideme-cover';
    Object.assign(coverEl.style, {
      position: 'fixed',
      top: '0', left: '0',
      width: '100vw', height: '100vh',
      zIndex: '2147483647',
      background: '#fff',
      border: 'none'
    });

    const div = document.createElement('div');
    div.src = url;
    Object.assign(div.style, {
      width: '100%', height: '100%',
      border: 'none'
    });
    coverEl.appendChild(div);

    coverEl.addEventListener('click', () => {
      uncover();
    });

    if (config.fakeTitle) {
      document.title = config.fakeTitle;
    }
    if (config.fakeFavicon) {
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = config.fakeFavicon;
    }

    document.documentElement.appendChild(coverEl);
    isCovered = true;
    lastCoverTime = Date.now();
    hideIndicator();
  }

  function removeCover() {
    if (coverEl) {
      coverEl.remove();
      coverEl = null;
    }
    isCovered = false;
    lastUncoverTime = Date.now();
    updateIndicator();
  }

  function cover() {
    // console.log('cover called', { isTarget: isTargetPage(), isCovered });
    // if (!isTargetPage() || isCovered) return;
    createCover();
  }

  function uncover() {
    // if (!isCovered) return;
    removeCover();
  }

  const DEBOUNCE_MS = 400;

  // function handleBlur() {
  //   console.log('blur event');
  //   return;
  //   if (config?.blurProtection && Date.now() - lastUncoverTime > DEBOUNCE_MS) {
  //     cover();
  //   }
  // }

  function handleVisibilityChange() {
    console.log('visibilitychange', document.hidden);
    if (document.hidden) {
      if (config?.blurProtection) cover();
    } else {
      if (config?.autoRestore) uncover();
    }
  }

  function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (config?.cornerProtection) {
      const size = config.cornerSize || 50;
      const inCorner =
        (mouseX < size && mouseY < size) ||
        (mouseX > window.innerWidth - size && mouseY < size) ||
        (mouseX < size && mouseY > window.innerHeight - size) ||
        (mouseX > window.innerWidth - size && mouseY > window.innerHeight - size);
      if (inCorner) cover();
    }
  }

  function handleMouseLeave() {
    if (config?.mouseLeaveProtection) cover();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && isCovered) {
      uncover();
    }
  }

  // function startFocusCheck() {
  //   if (checkInterval) return;
  //   let lastFocused = document.hasFocus();
  //   checkInterval = setInterval(() => {
  //     const currentlyFocused = document.hasFocus();
  //     console.log('focusCheck: ', lastFocused, currentlyFocused );
  //     if (lastFocused && !currentlyFocused) {
  //       console.log('focusCheck: lost focus');
  //       if (config?.blurProtection && Date.now() - lastUncoverTime > DEBOUNCE_MS) {
  //         cover();
  //       }
  //     }
  //     lastFocused = currentlyFocused;
  //   }, 200);
  // }

  function applyConfig(newConfig) {
    config = newConfig;
    console.log('config loaded', { targetUrls: config?.targetUrls, enabled: config?.enabled, blurProtection: config?.blurProtection });
    if (!config.enabled && isCovered) {
      uncover();
    }
    updateIndicator();
  }

  function init() {
    console.log('init', location.href);
    chrome.storage.sync.get([
      'enabled', 'targetUrls', 'fakePages', 'blurProtection',
      'mouseLeaveProtection', 'cornerProtection', 'cornerSize',
      'autoRestore', 'fakeTitle', 'fakeFavicon'
    ], (result) => {
      applyConfig(result);
    });

    // window.addEventListener('blur', handleBlur);
    // window.addEventListener('focus', () => {
    //   console.log('focus event');
    //   if (config?.autoRestore && Date.now() - lastCoverTime > DEBOUNCE_MS) {
    //     uncover();
    //   }
    // });
    // document.addEventListener('visibilitychange', handleVisibilityChange);
    // document.addEventListener('mousemove', handleMouseMove);
    // document.addEventListener('mouseleave', handleMouseLeave);
    // document.addEventListener('keydown', handleKeydown);

    // startFocusCheck();

    chrome.runtime.onMessage.addListener((msg) => {
      console.log('message', msg);
      if (msg.action === 'toggle') {
        config.enabled = msg.enabled;
        if (!config.enabled && isCovered) uncover();
        updateIndicator();
      } else if (msg.action === 'emergency') {
        cover();
      } else if (msg.action === 'checkVisibility') {
        handleVisibilityChange();
      }
    });

    chrome.storage.onChanged.addListener((changes) => {
      for (const key in changes) {
        config[key] = changes[key].newValue;
      }
      if (!config.enabled && isCovered) uncover();
      updateIndicator();
    });







      checkInterval = setInterval(() => {
        const currentlyFocused = document.hasFocus();
        if (currentlyFocused){
          coverEl && coverEl.remove();
        }else{
          cover();
        }
      }, 2000);



  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

var script = document.createElement('script');
script.src = chrome.runtime.getURL('scripts/url-change-event.js');
script.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);
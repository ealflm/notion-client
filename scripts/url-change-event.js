// #region url change event

class UrlChangeEvent extends Event {
  constructor(option = {}) {
    super('urlchangeevent', { cancelable: true, ...option });
    this.newURL = option.newURL;
    this.oldURL = option.oldURL;
    this.action = option.action;
  }

  get [Symbol.toStringTag]() {
    return 'UrlChangeEvent'
  }
}

const originPushState = window.history.pushState.bind(window.history);
window.history.pushState = function (state, title, url) {
  const nowURL = new URL(url || '', window.location.href);
  const notCanceled = window.dispatchEvent(
    new UrlChangeEvent({
      newURL: nowURL,
      oldURL: cacheURL,
      action: 'pushState',
    })
  );

  if (notCanceled) {
    originPushState({ _index: cacheIndex + 1, ...state }, title, url);
    updateCacheState();
  }
};

const originReplaceState = window.history.replaceState.bind(
  window.history
);
window.history.replaceState = function (state, title, url) {
  const nowURL = new URL(url || '', window.location.href);
  const notCanceled = window.dispatchEvent(
    new UrlChangeEvent({
      newURL: nowURL,
      oldURL: cacheURL,
      action: 'replaceState',
    })
  );

  if (notCanceled) {
    originReplaceState({ _index: cacheIndex, ...state }, title, url);
    updateCacheState();
  }
};

let cacheURL;
let cacheIndex;

function initState() {
  const state = window.history.state;
  if (!state || typeof state._index !== 'number') {
    originReplaceState({ _index: window.history.length, ...state }, null, null);
  }
}

function updateCacheState() {
  cacheURL = new URL(window.location.href);
  cacheIndex = window.history.state._index;
}

initState();
updateCacheState();

window.addEventListener('popstate', function (e) {
  initState();
  const nowIndex = window.history.state._index;
  const nowURL = new URL(window.location);
  if (nowIndex === cacheIndex) {
    e.stopImmediatePropagation();
    return
  }

  const notCanceled = window.dispatchEvent(
    new UrlChangeEvent({
      oldURL: cacheURL,
      newURL: nowURL,
      action: 'popstate',
    })
  );

  if (!notCanceled) {
    e.stopImmediatePropagation();
    window.history.go(cacheIndex - nowIndex);
    return
  }
  updateCacheState();
});

window.addEventListener('beforeunload', function (e) {
  const notCanceled = window.dispatchEvent(
    new UrlChangeEvent({
      oldURL: cacheURL,
      newURL: null,
      action: 'beforeunload',
    })
  );

  if (!notCanceled) {
    e.preventDefault();
    const confirmationMessage = 'o/';
    e.returnValue = confirmationMessage;
    return confirmationMessage
  }
});
// #endregion

// #region init update button

function getUpdateButton() {
  // Create the button element
  var updateButton = document.createElement('button');
  updateButton.className = 'update-button';

  // Create the spinner element
  var spinner = document.createElement('span');
  spinner.className = 'spinner';
  spinner.style.display = 'none';

  // Create the text element
  var textElement = document.createElement('span');
  textElement.textContent = 'Update';

  // Add the spinner and text elements to the button
  updateButton.appendChild(spinner);
  updateButton.appendChild(document.createTextNode(' ')); // Add a space between the spinner and the text
  updateButton.appendChild(textElement);

  // Add a click event listener
  updateButton.addEventListener('click', function () {
    // Disable the button and add the 'disabled' class
    updateButton.disabled = true;
    updateButton.classList.add('disabled');

    // Show the spinner
    spinner.style.display = 'inline-block';

    // Re-enable the button, remove the 'disabled' class, and hide the spinner after 2 seconds
    setTimeout(function () {
      updateButton.disabled = false;
      updateButton.classList.remove('disabled');
      spinner.style.display = 'none';
    }, 2000);
  });

  return updateButton;
}

var query = [
  "#notion-app > div > div:nth-child(1) > div > div:nth-child(2) > div:nth-child(1) > div.notion-topbar > div > div.notion-topbar-action-buttons > div:nth-child(2)",
  "#notion-app > div > div:nth-child(1) > div > div.notion-peek-renderer > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(3)",
  "#notion-app > div > div.notion-overlay-container.notion-default-overlay-container > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3)"
]

function getPageType(url) {
  var pm = url.searchParams.get('pm')

  var pageType = 0
  if (pm == 'c') {
    pageType = 2
  } if (pm == 's') {
    pageType = 1
  }

  return pageType;
}

function insertButton(pageType) {
  console.log('1. insert call')
  var updateButton = getUpdateButton();
  var observer = new MutationObserver(function (mutations) {
    console.log('2. observer call')
    var targetElement = document.querySelector(query[pageType]);
    if (targetElement != null) {
      if (document.querySelectorAll(query[pageType] + " > .update-button").length == 0) {
        console.log('3. new button insert -> ' + pageType)
        try {
          targetElement.insertBefore(updateButton, targetElement.querySelector('div.notion-topbar-share-menu').nextElementSibling);
        } catch (e) {
        }
      } else {
        console.log('3. button already exists -> ' + pageType)
      }
    }
    observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

// #endregion

// #region add button by url change event

window.addEventListener('urlchangeevent', function (event) {
  const url = event.newURL
  if (url.href.includes('ealflm') && !url.searchParams.has('pvs')) {
    console.log('URL HAS CHANGED TO: ' + url.href)
    insertButton(getPageType(url))
  }
});

// #endregion

// #region add button by first load page

const checkTargetElement = () => {
  var url = new URL(window.location.href);

  var pageType = getPageType(url);
  const targetElement = document.querySelector(query[pageType] + " > div.notion-topbar-share-menu");
  console.log('pageType is: ' + pageType)

  if (targetElement !== null) {
    console.log("Target element found!");
    insertButton(pageType);
    clearInterval(interval);
  } else {
    console.log("Target element not found yet.");
  }
};

const intervalTime = 200;
const interval = setInterval(checkTargetElement, intervalTime);

// #endregion
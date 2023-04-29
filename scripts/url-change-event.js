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

window.addEventListener('urlchangeevent', function (event) {
  const url = event.newURL
  if (!url.searchParams.has('pvs')) {
    console.log('Url changed to: ' + url)
  }
});

function insertButton() {
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

  // Get the target element where you want to insert the button
  var targetElement = document.querySelector("#notion-app > div > div:nth-child(1) > div > div:nth-child(2) > div:nth-child(1) > div.notion-topbar > div > div.notion-topbar-action-buttons > div:nth-child(2)");

  // Check if the target element exists
  if (targetElement) {
    // Insert the button as the third child of the target element
    targetElement.insertBefore(updateButton, targetElement.children[2]);
    return true;
  }
  return false;
}

var observer = new MutationObserver(function (mutations) {
  if (insertButton()) {
    observer.disconnect();
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });
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

        // Send a message to the background.js to perform the POST request and listen for the response
        chrome.runtime.sendMessage({ action: 'makePostRequest' }, (response) => {
            // Re-enable the button, remove the 'disabled' class, and hide the spinner
            updateButton.disabled = false;
            updateButton.classList.remove('disabled');
            spinner.style.display = 'none';
            if (response && response.status === 'completed') {
                // SUCCESS
            } else {
                // FAILED
            }
        });
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
    var updateButton = getUpdateButton();
    var observer = new MutationObserver(function (mutations) {
        var targetElement = document.querySelector(query[pageType]);
        if (targetElement != null) {
            if (document.querySelectorAll(query[pageType] + " > .update-button").length == 0) {
                try {
                    targetElement.insertBefore(updateButton, targetElement.querySelector('div.notion-topbar-share-menu').nextElementSibling);
                } catch (e) {
                }
            }
        }
        observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
}

// #endregion

// #region add button by url change event

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'url_change_event') {
        insertButton(getPageType(new URL(request.data)));
    }
});

// #endregion

// #region add button by first load page

const checkTargetElement = () => {
    var url = new URL(window.location.href);

    var pageType = getPageType(url);
    const targetElement = document.querySelector(query[pageType] + " > div.notion-topbar-share-menu");

    if (targetElement !== null) {
        insertButton(pageType);
        clearInterval(interval);
    } else {
    }
};

const intervalTime = 200;
const interval = setInterval(checkTargetElement, intervalTime);

  // #endregion

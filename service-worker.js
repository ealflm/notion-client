// Listen to state updated
chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    var url = new URL(details.url);

    if (url.hostname === 'www.notion.so' && url.pathname.startsWith('/ealflm') && !url.searchParams.has('pvs')) {
        const message = { message: 'url_change_event', data: details.url };

        chrome.tabs.sendMessage(details.tabId, message);
    }
});

// Function to make the POST request
function makePostRequest() {
    console.log('POST: https://ealflm-n8n.herokuapp.com/webhook/add-database')
    return fetch('https://ealflm-n8n.herokuapp.com/webhook/add-database', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            // Add any data you want to send as JSON here
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log('POST request succeeded:', data);
        })
        .catch(error => {
            console.error('POST request failed:', error);
        });
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'makePostRequest') {
        makePostRequest()
            .then(() => {
                sendResponse({ status: 'completed' });
            })
            .catch(() => {
                sendResponse({ status: 'failed' });
            })

        return true; // Keep the message channel open for the asynchronous response
    }
});

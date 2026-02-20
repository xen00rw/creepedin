let dataList = [];
let isAutoscrolling = false;
let scrollInterval = null;

// Check if URL is the correct one (needed to work without reloading the page)
function checkURL() {
    const regex = /^https:\/\/www\.linkedin\.com\/company\/[^\/]+\/people\//;
    return regex.test(window.location.href);
}

// Fetch names and analyze changes
function checkDivChanges() {
    if (checkURL()) {
        const targetDivs = document.querySelectorAll(
            ".ember-view.lt-line-clamp.lt-line-clamp--single-line"
        );
        dataList = [];

        for (let div of targetDivs) {
            let textContent = div.innerText;
            if (!textContent.toLowerCase().includes("linkedin")) {
                dataList.push(textContent);
            }
        }

        chrome.storage.local.set({ dataList });
        chrome.runtime.sendMessage({
            type: "DOM_MUTATION",
            details: "checkLiveChanges",
        });
    }
}

// Handle button "show more people"
function clickButtonsWhenAppear() {
  const selector = "div.display-flex.p5 button";

  const observer = new MutationObserver(() => {
    const buttons = document.querySelectorAll(selector);
    if (buttons.length > 0) {
      buttons.forEach(btn => btn.click());
      observer.disconnect();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

// Handle messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "AUTOSCROLL") {
        if (message.active) {
            // Start autoscroll
            isAutoscrolling = true;
            scrollInterval = setInterval(() => {
                window.scrollBy(0, 10); // Scroll down by 10 pixels
                // Check if button with class
                // 'scaffold-finite-scroll__load-button' is visible
                const loadMoreButton = document.querySelector(
                    ".scaffold-finite-scroll__load-button"
                );
                if (loadMoreButton) {
                    loadMoreButton.click();
                }
            }, 25); // Adjust the scroll speed
        } else {
            // Stop autoscroll
            isAutoscrolling = false;
            clearInterval(scrollInterval);
        }
    }
});


// MutationObserver to monitor changes in the DOM
const config = { childList: true, subtree: true };
const callback = function (mutationsList) {
    for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
            checkDivChanges();
        }
    }
};

// Observe changes in the DOM body
const targetNode = document.body;
const observer = new MutationObserver(callback);
observer.observe(targetNode, config);

// Initial check when the content script runs
checkDivChanges();

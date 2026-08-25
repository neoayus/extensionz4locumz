chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "bigDoxx",
    title: "Doximity Search: %s",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== "bigDoxx") return;

  const selectedText = info.selectionText?.trim();
  if (!selectedText) return;

  const query = `${selectedText} Doximity Emergency Medicine`;

  const googleLuckyUrl =
    `https://www.google.com/search?q=${encodeURIComponent(query)}&btnI=1`;

  chrome.tabs.create({
    url: googleLuckyUrl,
  });
});
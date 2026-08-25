chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "npiLookup",
    title: "NPI Lookup: %s",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== "npiLookup") return;

  const selectedText = info.selectionText?.trim();
  if (!selectedText) return;

  const npiUrl = `https://npiregistry.cms.hhs.gov/provider-view/${encodeURIComponent(
    selectedText
  )}`;

  chrome.tabs.create({ url: npiUrl });
});
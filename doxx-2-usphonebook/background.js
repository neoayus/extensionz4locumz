chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "doxximityName",
    title: "copy phonebook url!",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "doxximityName") return;

  const selectedText = info.selectionText?.trim();
  if (!selectedText) return;

  const text = selectedText.replace(/\u00A0/g, " ");

  // Get the doctor's name: everything before MD.
  const nameMatch = text.match(/^([\s\S]*?)\s+MD\b/i);

  if (!nameMatch) {
    console.error("Could not find doctor's name.");
    return;
  }

  const name = nameMatch[1]
    .trim()
    .split("\n")[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Get City and State.
  const cleanText = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "");

  const locationMatch = cleanText.match(
    /([A-Za-z .'-]+),\s*([A-Z]{2})\b/
  );

  if (!locationMatch) {
    console.error("Could not find city and state.");
    return;
  }

  const city = locationMatch[1]
    .replace(/^.*•/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const state = locationMatch[2].toLowerCase();

  const phonebookUrl =
    `https://www.usphonebook.com/${name}/${state}/${city}`;

  // Copy URL to clipboard from the active page.
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async (url) => {
      await navigator.clipboard.writeText(url);
    },
    args: [phonebookUrl],
  });

  console.log("Copied:", phonebookUrl);
});
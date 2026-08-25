chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "phoneLookup",
    title: "US Phonebook Lookup: %s",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== "phoneLookup") return;

  const selectedText = info.selectionText?.trim();
  if (!selectedText) return;

  // Normalize non-breaking spaces.
  const text = selectedText.replace(/\u00A0/g, " ");

  // -------------------------
  // GET NAME
  // Everything before " MD"
  // -------------------------
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

  // -------------------------
  // GET CITY + STATE
  // -------------------------
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

  // -------------------------
  // BUILD URL
  // -------------------------
  const phonebookUrl =
    `https://www.usphonebook.com/${name}/${state}/${city}`;

  chrome.tabs.create({
    url: phonebookUrl,
  });
});
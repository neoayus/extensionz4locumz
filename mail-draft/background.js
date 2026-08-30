const DEFAULT_SUBJECT = "Emergency Medicine Locums Position";

const DEFAULT_BODY = `Hi Dr. {{last_name}},
I wanted to check in and see if you’re currently open to Emergency Medicine locum opportunities.

We have openings in FL, TX, TN, GA, KY, MO, SC, CT, and more, with flexible scheduling options, including opportunities for 4–5 shifts per month.

If you’re interested, just let me know your preferred locations and availability, and I can send you the most relevant openings.

Looking forward to connecting with you.`;


/* =========================================================
   INSTALL / STARTUP
   ========================================================= */

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get([
    "subject",
    "body"
  ]);

  if (!current.subject || !current.body) {
    await chrome.storage.local.set({
      subject: DEFAULT_SUBJECT,
      body: DEFAULT_BODY
    });
  }

  createContextMenu();
});


chrome.runtime.onStartup.addListener(() => {
  createContextMenu();
});


function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "createLocumsDraft",
      title: "create reach out draft !!",
      contexts: ["selection"]
    });
  });
}


/* =========================================================
   RIGHT-CLICK MENU
   ========================================================= */

chrome.contextMenus.onClicked.addListener(async (info) => {

  if (info.menuItemId !== "createLocumsDraft") {
    return;
  }

  const selectedText =
    (info.selectionText || "").trim();

  if (!selectedText) {
    await showErrorTab(
      "No text was selected. Select the physician's name and email first."
    );
    return;
  }

  await createDraftFromSelection(
    selectedText
  );
});


/* =========================================================
   EXTENSION ICON
   ========================================================= */

chrome.action.onClicked.addListener(async (tab) => {

  if (!tab.id) {
    return;
  }

  try {

    const result =
      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },

        func: () => {
          return window.getSelection()?.toString() || "";
        }
      });


    const selectedText =
      (result?.[0]?.result || "").trim();


    if (!selectedText) {

      await showErrorTab(
        "Select the physician's name and email first, then click the extension icon."
      );

      return;
    }


    await createDraftFromSelection(
      selectedText
    );


  } catch (error) {

    console.error(
      "Selection error:",
      error
    );


    await showErrorTab(
      "Could not read the selected text. Try right-clicking the selection and choosing Create Emergency Medicine Locums Draft."
    );
  }
});


/* =========================================================
   CREATE PENDING DRAFT
   ========================================================= */

async function createDraftFromSelection(
  selectedText
) {

  const parsed =
    parseSelection(selectedText);


  if (!parsed.email) {

    await showErrorTab(
      "No email address was found in the selected text."
    );

    return;
  }


  const email =
    parsed.email;

  const name =
    parsed.name;

  const lastName =
    parsed.lastName;


  const template =
    await chrome.storage.local.get({
      subject: DEFAULT_SUBJECT,
      body: DEFAULT_BODY
    });


  const subject =
    replaceVariables(
      template.subject,
      {
        email,
        name,
        lastName
      }
    );


  const body =
    replaceVariables(
      template.body,
      {
        email,
        name,
        lastName
      }
    );


  /*
   * Create a unique ID for THIS particular draft.
   */

  const draftId =
    crypto.randomUUID();


  /*
   * Store the draft.
   *
   * IMPORTANT:
   * content.js will CLAIM this draft exactly once.
   */

  await chrome.storage.local.set({

    pendingDraft: {

      id: draftId,

      email,

      name,

      lastName,

      subject,

      body,

      createdAt: Date.now()
    }

  });


  /*
   * Open normal Gmail.
   */

  await chrome.tabs.create({

    url:
      "https://mail.google.com/mail/u/0/#inbox",

    active: true

  });
}


/* =========================================================
   CLAIM PENDING DRAFT
   =========================================================
   
   THIS IS THE IMPORTANT FIX.

   Instead of:

       GET pendingDraft
       process pendingDraft
       CLEAR pendingDraft

   we now do:

       CLAIM pendingDraft

   The background script immediately removes it from storage
   and gives it to the FIRST requester.

   Any second Gmail content script gets null.

   ========================================================= */

chrome.runtime.onMessage.addListener(
  async (message, sender, sendResponse) => {

    if (
      message?.action ===
      "CLAIM_PENDING_DRAFT"
    ) {

      try {

        const data =
          await chrome.storage.local.get([
            "pendingDraft"
          ]);


        const draft =
          data.pendingDraft;


        /*
         * Nothing waiting.
         */

        if (!draft) {

          sendResponse({
            draft: null
          });

          return;
        }


        /*
         * IMPORTANT:
         *
         * Remove it BEFORE responding.
         *
         * This means another Gmail content script
         * cannot retrieve the same draft.
         */

        await chrome.storage.local.remove(
          "pendingDraft"
        );


        console.log(
          "Pending draft claimed:",
          draft.id
        );


        sendResponse({
          draft
        });


      } catch (error) {

        console.error(
          "Failed to claim pending draft:",
          error
        );


        sendResponse({
          draft: null
        });
      }


      return true;
    }
  }
);


/* =========================================================
   PARSE SELECTED TEXT
   ========================================================= */

function parseSelection(
  selectedText
) {

  const text =
    selectedText || "";


  /*
   * -------------------------------------------------------
   * EMAIL
   * -------------------------------------------------------
   */

  const emailMatch =
    text.match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    );


  const email =
    emailMatch
      ? emailMatch[0].trim()
      : "";


  /*
   * -------------------------------------------------------
   * NAME
   * -------------------------------------------------------
   *
   * Example:
   *
   * [Lancaster](https://nexus.laboredge.com/...)
   *
   * becomes:
   *
   * Lancaster
   */

  let name = "";


  const markdownLinkMatch =
    text.match(
      /\[([^\]]+)\]\([^)]+\)/
    );


  if (markdownLinkMatch) {

    name =
      markdownLinkMatch[1].trim();
  }


  /*
   * -------------------------------------------------------
   * FALLBACK NAME PARSING
   * -------------------------------------------------------
   */

  if (!name && email) {

    name =
      text
        .replace(email, "")
        .trim();


    name =
      name
        .replace(
          /\[([^\]]+)\]\([^)]+\)/g,
          "$1"
        )
        .replace(/\\/g, "")
        .replace(/__/g, "")
        .replace(/`/g, "")
        .replace(
          /[|<>()[\],]/g,
          " "
        )
        .replace(
          /\b(email|e-mail)\b/gi,
          ""
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();
  }


  /*
   * Remove Dr. / Doctor.
   */

  name =
    name
      .replace(
        /^dr\.?\s*/i,
        ""
      )
      .replace(
        /^doctor\s*/i,
        ""
      )
      .trim();


  /*
   * Remove table leftovers.
   */

  name =
    name
      .replace(
        /^[\s|:;,\-]+/,
        ""
      )
      .replace(
        /[\s|:;,\-]+$/,
        ""
      )
      .trim();


  /*
   * -------------------------------------------------------
   * LAST NAME
   * -------------------------------------------------------
   */

  let lastName = "";


  if (name) {

    const parts =
      name
        .split(/\s+/)
        .map(
          part => part.trim()
        )
        .filter(Boolean);


    if (parts.length) {

      lastName =
        parts[parts.length - 1];
    }
  }


  return {
    email,
    name,
    lastName
  };
}


/* =========================================================
   REPLACE TEMPLATE VARIABLES
   ========================================================= */

function replaceVariables(
  text,
  data
) {

  return (text || "")

    .replaceAll(
      "{{email}}",
      data.email || ""
    )

    .replaceAll(
      "{{full_name}}",
      data.name || ""
    )

    .replaceAll(
      "{{last_name}}",
      data.lastName || ""
    );
}


/* =========================================================
   ERROR PAGE
   ========================================================= */

async function showErrorTab(
  message
) {

  const safeMessage =
    escapeHtml(message);


  await chrome.tabs.create({

    url:
      "data:text/html;charset=utf-8," +
      encodeURIComponent(`

        <!DOCTYPE html>

        <html>

        <head>
          <title>Cynet Locums Gmail Draft</title>
        </head>

        <body
          style="
            font-family: Arial, sans-serif;
            padding: 40px;
            line-height: 1.6;
          "
        >

          <h2>
            Cynet Locums Gmail Draft
          </h2>

          <p>
            ${safeMessage}
          </p>

          <p>
            Select the physician's name and email address,
            then right-click and choose:
          </p>

          <p>
            <b>
              Create Emergency Medicine Locums Draft
            </b>
          </p>

        </body>

        </html>

      `)
  });
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
  text
) {

  return String(text || "")

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}
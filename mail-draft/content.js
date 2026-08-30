console.log(
  "Cynet Locums Gmail Draft - Gmail content script loaded."
);


/* =========================================================
   START
   ========================================================= */

initialize();


async function initialize() {

  await wait(1500);

  try {

    const response =
      await chrome.runtime.sendMessage({
        action: "CLAIM_PENDING_DRAFT"
      });


    if (!response?.draft) {

      console.log(
        "No pending Cynet draft."
      );

      return;
    }


    console.log(
      "Draft claimed:",
      response.draft.id
    );


    await createGmailDraft(
      response.draft
    );


  } catch (error) {

    console.error(
      "Could not claim pending draft:",
      error
    );
  }
}


/* =========================================================
   CREATE GMAIL DRAFT
   ========================================================= */

async function createGmailDraft(draft) {

  let compose =
    findComposeWindow();


  if (!compose) {

    const composeButton =
      await waitForElement(
        findComposeButton,
        15000
      );


    if (!composeButton) {

      throw new Error(
        "Could not find Gmail Compose button."
      );
    }


    composeButton.click();
  }


  compose =
    await waitForElement(
      findComposeWindow,
      15000
    );


  if (!compose) {

    throw new Error(
      "Gmail compose window did not appear."
    );
  }


  /*
   * Give Gmail time to insert its own signature.
   */

  await waitForSignatureOrBody(
    compose
  );


  /*
   * Fill recipient.
   */

  fillRecipient(
    compose,
    draft.email
  );


  /*
   * Fill subject.
   */

  fillSubject(
    compose,
    draft.subject
  );


  /*
   * Insert our message above Gmail's signature.
   */

  insertBodyAboveSignature(
    compose,
    draft.body
  );


  console.log(
    "Draft completed successfully."
  );
}


/* =========================================================
   FIND COMPOSE BUTTON
   ========================================================= */

function findComposeButton() {

  const selectors = [

    'div[role="button"][gh="cm"]',

    'div[role="button"][aria-label="Compose"]',

    '[aria-label="Compose"]'

  ];


  for (
    const selector of selectors
  ) {

    const element =
      document.querySelector(
        selector
      );


    if (element) {
      return element;
    }
  }


  const buttons =
    document.querySelectorAll(
      '[role="button"]'
    );


  for (
    const button of buttons
  ) {

    const text =
      (button.innerText || "")
        .trim()
        .toLowerCase();


    if (text === "compose") {
      return button;
    }
  }


  return null;
}


/* =========================================================
   FIND COMPOSE WINDOW
   ========================================================= */

function findComposeWindow() {

  const dialogs =
    document.querySelectorAll(
      '[role="dialog"]'
    );


  for (
    const dialog of dialogs
  ) {

    const body =
      dialog.querySelector(
        '[contenteditable="true"]'
      );


    const recipient =
      dialog.querySelector(
        'input[name="to"]'
      ) ||
      dialog.querySelector(
        'input[aria-label*="Recipients"]'
      );


    const subject =
      dialog.querySelector(
        'input[name="subjectbox"]'
      ) ||
      dialog.querySelector(
        'input[placeholder*="Subject"]'
      );


    if (
      body &&
      (recipient || subject)
    ) {

      return dialog;
    }
  }


  /*
   * Fallback for Gmail layouts without role="dialog".
   */

  const subject =
    document.querySelector(
      'input[name="subjectbox"]'
    );


  const body =
    document.querySelector(
      '[contenteditable="true"][aria-label*="Message Body"]'
    );


  if (
    subject &&
    body
  ) {

    let parent =
      subject.parentElement;


    for (
      let i = 0;
      i < 8 && parent;
      i++
    ) {

      if (
        parent.contains(body)
      ) {

        return parent;
      }


      parent =
        parent.parentElement;
    }


    return document.body;
  }


  return null;
}


/* =========================================================
   FIND MESSAGE BODY
   ========================================================= */

function findMessageBody(compose) {

  const selectors = [

    '[contenteditable="true"][aria-label*="Message Body"]',

    '[contenteditable="true"][role="textbox"]',

    '[contenteditable="true"]'

  ];


  for (
    const selector of selectors
  ) {

    const element =
      compose.querySelector(
        selector
      );


    if (element) {
      return element;
    }
  }


  if (
    compose === document.body
  ) {

    for (
      const selector of selectors
    ) {

      const element =
        document.querySelector(
          selector
        );


      if (element) {
        return element;
      }
    }
  }


  return null;
}


/* =========================================================
   FIND RECIPIENT
   ========================================================= */

function findRecipientField(compose) {

  const selectors = [

    'input[name="to"]',

    'input[aria-label*="Recipients"]',

    'input[aria-label*="To"]',

    'input[placeholder*="Recipients"]'

  ];


  for (
    const selector of selectors
  ) {

    const element =
      compose.querySelector(
        selector
      );


    if (element) {
      return element;
    }
  }


  if (
    compose === document.body
  ) {

    for (
      const selector of selectors
    ) {

      const element =
        document.querySelector(
          selector
        );


      if (element) {
        return element;
      }
    }
  }


  return null;
}


/* =========================================================
   FILL RECIPIENT
   ========================================================= */

function fillRecipient(
  compose,
  email
) {

  const field =
    findRecipientField(
      compose
    );


  if (!field) {

    console.error(
      "Gmail recipient field not found."
    );

    return false;
  }


  field.focus();


  const setter =
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;


  /*
   * Clear the field first.
   */

  if (setter) {

    setter.call(
      field,
      ""
    );

  } else {

    field.value = "";
  }


  field.dispatchEvent(
    new Event(
      "input",
      {
        bubbles: true
      }
    )
  );


  /*
   * Insert exactly one email.
   */

  if (setter) {

    setter.call(
      field,
      email
    );

  } else {

    field.value = email;
  }


  field.dispatchEvent(
    new Event(
      "input",
      {
        bubbles: true
      }
    )
  );


  field.dispatchEvent(
    new Event(
      "change",
      {
        bubbles: true
      }
    )
  );


  /*
   * Confirm the recipient.
   */

  setTimeout(() => {

    field.dispatchEvent(
      new KeyboardEvent(
        "keydown",
        {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true
        }
      )
    );

  }, 100);


  return true;
}


/* =========================================================
   FILL SUBJECT
   ========================================================= */

function fillSubject(
  compose,
  subject
) {

  let field =
    compose.querySelector(
      'input[name="subjectbox"]'
    );


  if (!field) {

    field =
      compose.querySelector(
        'input[placeholder*="Subject"]'
      );
  }


  if (
    !field &&
    compose === document.body
  ) {

    field =
      document.querySelector(
        'input[name="subjectbox"]'
      );
  }


  if (!field) {

    console.error(
      "Gmail subject field not found."
    );

    return false;
  }


  field.focus();


  const setter =
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;


  if (setter) {

    setter.call(
      field,
      subject
    );

  } else {

    field.value = subject;
  }


  field.dispatchEvent(
    new Event(
      "input",
      {
        bubbles: true
      }
    )
  );


  field.dispatchEvent(
    new Event(
      "change",
      {
        bubbles: true
      }
    )
  );


  return true;
}


/* =========================================================
   WAIT FOR GMAIL BODY / SIGNATURE
   ========================================================= */

async function waitForSignatureOrBody(
  compose
) {

  const start =
    Date.now();


  const timeout =
    10000;


  while (
    Date.now() - start <
    timeout
  ) {

    const body =
      findMessageBody(
        compose
      );


    if (body) {

      /*
       * Allow Gmail's signature to finish rendering.
       */

      await wait(800);

      return body;
    }


    await wait(250);
  }


  return null;
}


/* =========================================================
   INSERT BODY ABOVE SIGNATURE
   ========================================================= */

function insertBodyAboveSignature(
  compose,
  text
) {

  const body =
    findMessageBody(
      compose
    );


  if (!body) {

    console.error(
      "Gmail message body not found."
    );

    return false;
  }


  body.focus();


  /*
   * =======================================================
   * CLEAN UP THE TEMPLATE SPACING
   * =======================================================
   *
   * This removes accidental leading/trailing blank lines
   * from the stored template.
   */

  const cleanedText =
    String(text || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/^\s*\n+/, "")
      .replace(/\n+\s*$/, "");


  /*
   * Split into individual lines.
   */

  const lines =
    cleanedText.split("\n");


  /*
   * =======================================================
   * CREATE THE MESSAGE
   * =======================================================
   *
   * We use divs for normal lines and only use <br>
   * for intentionally blank lines.
   *
   * This gives:
   *
   * Hi Dr. Grippa,
   *
   * I wanted to check in...
   *
   * instead of:
   *
   * Hi Dr. Grippa,
   *
   *
   * I wanted to check in...
   */

  const fragment =
    document.createDocumentFragment();


  lines.forEach(
    (line, index) => {

      const div =
        document.createElement(
          "div"
        );


      /*
       * FORCE TREBUCHET MS.
       */

      div.style.fontFamily =
        '"Trebuchet MS", sans-serif';


      div.style.fontSize =
        "medium";


      if (
        line.trim() === ""
      ) {

        /*
         * One intentional blank line.
         */

        div.appendChild(
          document.createElement(
            "br"
          )
        );

      } else {

        div.textContent =
          line;
      }


      fragment.appendChild(
        div
      );
    }
  );


  /*
   * =======================================================
   * PUT CURSOR AT BEGINNING
   * =======================================================
   */

  const range =
    document.createRange();


  range.selectNodeContents(
    body
  );


  range.collapse(
    true
  );


  const selection =
    window.getSelection();


  selection.removeAllRanges();


  selection.addRange(
    range
  );


  /*
   * =======================================================
   * INSERT MESSAGE
   * =======================================================
   */

  range.insertNode(
    fragment
  );


  /*
   * =======================================================
   * FORCE FONT ON OUR ENTIRE INSERTED MESSAGE
   * =======================================================
   *
   * We only apply this to the content generated by
   * the extension. Gmail's own signature is untouched.
   */

  const insertedNodes =
    Array.from(
      body.querySelectorAll(
        'div'
      )
    );


  /*
   * Find the newly inserted content at the top
   * and make sure it uses Trebuchet MS.
   */

  let child =
    body.firstElementChild;


  let safety =
    0;


  while (
    child &&
    safety < lines.length + 2
  ) {

    child.style.fontFamily =
      '"Trebuchet MS", sans-serif';


    child =
      child.nextElementSibling;


    safety++;
  }


  /*
   * Notify Gmail that the editor changed.
   */

  body.dispatchEvent(
    new InputEvent(
      "input",
      {
        bubbles: true,
        inputType: "insertText",
        data: cleanedText
      }
    )
  );


  body.dispatchEvent(
    new Event(
      "change",
      {
        bubbles: true
      }
    )
  );


  return true;
}


/* =========================================================
   WAIT FOR ELEMENT
   ========================================================= */

async function waitForElement(
  finder,
  timeout = 10000
) {

  const start =
    Date.now();


  while (
    Date.now() - start <
    timeout
  ) {

    const element =
      finder();


    if (element) {
      return element;
    }


    await wait(250);
  }


  return null;
}


/* =========================================================
   WAIT
   ========================================================= */

function wait(
  milliseconds
) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        milliseconds
      )
  );
}

// import { test } from "@playwright/test";
const readline = require("readline");
const { chromium, selectors } = require("playwright");
class Expenditure {
  constructor(day, month, year, time, card, description, type, cost) {
    this.day = day;
    // this.month = month;
    switch (month) {
      case "марта":
        this.month = "март";
      case "мая":
        this.month = "май";
      case "августа":
        this.month = "август";
      default:
        this.month = month.slice(0, -1) + "ь";
    }
    this.year = year;
    this.time = time;
    // this.date = date;
    this.card = card;
    this.description = description;
    this.type = type;
    this.cost = cost;
  }
  print() {
    // console.log("Date: " + this.date);
    console.log("Card: " + this.card);
    console.log("Description: " + this.description);
    console.log("Type: " + this.type);
    console.log("Cost: " + this.cost);
  }
}
async function inputPhoneNumber(page) {
  await page.waitForSelector('input[type="tel"]');
  await page.screenshot({ path: "page1.png" });
  await page.fill('input[type="tel"]', "89966368841");
  await page.click("#submit-button");
  await page.waitForSelector('input[type="tel"]');
  console.log("Phone number succesfully entered");
}
async function enterAccessCode(page) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const accessCode = await new Promise((resolve) => {
    rl.question("Please enter the access code: ", (code) => {
      resolve(code);
    });
  });

  await page.screenshot({ path: "secondPage.png" });
  await page.fill('input[type="tel"]', accessCode);
  await page.screenshot({ path: "page2.png" });
  await page.waitForSelector("#password");
  console.log("Code succesfully entered");

  rl.close();
}
async function inputPassword(page) {
  await page.fill("#password", "password");
  await page.click("#submit-button");
  await page.screenshot({ path: "page3.png" });
  await page.waitForSelector("#skip-button");
  console.log("Password succesfully entered");
}
async function skipButton(page) {
  await page.screenshot({ path: "page4.png" });
  await page.click("#skip-button");
}

async function authenticate(page) {
  await page.goto("https://www.tinkoff.ru/login/");

  await inputPhoneNumber(page);
  await enterAccessCode(page);
  await inputPassword(page);
  await skipButton(page);
}
async function allExpenditures(page) {
  await page.waitForSelector("a", { hasText: "Личный кабинет" });
  console.log("Successfully authenticated");
  await page.locator("a", { hasText: "Личный кабинет" }).click();
  await page.locator("a", { hasText: "События" }).click();
  await page.waitForSelector('div[data-qa-type="timeline-operations-list"]');
  await page.screenshot({ path: "page5.png" });

  let list = [];
  const expenditures = await page
    .locator(
      'div[class="TimelineList__item_aGjSGN TimelineList__item_default_bGjSGN"]'
    )
    .all();

  let i = 0;
  console.log("Getting data");

  for (const e of expenditures) {
    await e.click();
    await page.screenshot({ path: "transactionInfoBeforeLoad.png" });
    await page.waitForSelector('span[data-qa-type="operation-popup-time"]');

    const date = (
      await page
        .locator('span[data-qa-type="operation-popup-time"]')
        .textContent()
    )
      .replace(",", "")
      .split(" ");
    list.push(
      new Expenditure(
        date[0],
        date[1],
        date[2],
        date[3],
        await page
          .locator('span[data-qa-type="uikit/link.inner"]')
          .first()
          .textContent(),
        await page
          .locator('p[data-qa-type="details-card-baseInfo-description"]')
          .textContent(),
        await page
          .locator('span[data-qa-type="default-category"]')
          .textContent(),
        await page
          .locator(
            'span[data-qa-type="uikit/money.details-card-baseInfo-value"]'
          )
          .textContent()
      )
    );
    await page.click('button[data-qa-type="details-card-close"]');
    // console.log(list);

    await page.waitForSelector(
      'div[class="TimelineList__item_aGjSGN TimelineList__item_default_bGjSGN"]'
    );
    await page.screenshot({ path: "transactionInfoAfterLoad.png" });
    await page.mouse.wheel(0, 300);
    ++i;

    await page.screenshot({ path: "afterScroll.png" });
  }
  console.log(list);
  await page.mouse.wheel(0, -300 * i);
}

async function investResults(page) {
  await page.waitForSelector("a", { hasText: "Инвестиции" });
  await page.screenshot({ path: "invest.png" });
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Инвестиции" })
    .click();
  await page.mouse.wheel(0, 3000);
  await page.waitForSelector("a", { hasText: "Последние события" });
  await page.locator("a", { hasText: "Последние события" }).click();
  await page.screenshot({ path: "invest2.png" });
  await page.waitForSelector('input[data-qa-type="uikit/inlineInput.input"]');
  await page
    .locator('input[data-qa-type="uikit/inlineInput.input"]')
    .fill("Пополнение брокерского счет");
  await page.waitForSelector("div", {
    hasText: "Пополнение брокерского счета",
  });
  await page.screenshot({ path: "newInvest.png" });
  await page
    .locator("div", { hasText: "Пополнение брокерского счета" })
    .click();
  await page.screenshot({ path: "newInvest2.png" });

  await page.waitForSelector('tr[class="OperationsTableItem__tr_Xot0P"]');
  const replenishment = page
    .locator('span[class="Money-module__money_p_VHJ"]')
    .all();
  for (let e of replenishment) {
    console.log(e.textContent());
  }
  // await page
  //   .locator('input[data-qa-type="uikit/inlineInput.input"]')
  //   .fill("Вывод с брокерского счета");
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: "./recordings",
    },
  });
  const page = await context.newPage();

  await authenticate(page);
  // await allExpenditures(page);
  await investResults(page);
  console.log("end");
})();

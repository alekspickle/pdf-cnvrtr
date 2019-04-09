const fs = require("fs");
const hummus = require("hummus");
const stdin = process.stdin;
const puppeteer = require("puppeteer");
const path = require("path");

//create folder if none
const outputFolder = "./output";
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder);
}

stdin.setEncoding("utf-8");

async function generatePdf(url, outputDir, filename) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: ["domcontentloaded", "networkidle0", "load"]
  });

  try {
    const gotItPath = `//div[contains(@class, "CookieConsent__Button")]`;

    console.log(`confirming cookies`);
    const gitItButton = await page.waitForXPath(gotItPath);
    await gitItButton.click();
    await page.waitFor(500);
  } catch (e) {
    console.log("err", e);
  }

  try {
    await page.pdf({
      path: path.join(outputDir, filename),
      format: "A4"
    });
  } catch (e) {
    console.log("err", e);
  }
  browser.close();
}

function combinePdfs(files) {
  const pdfWriter = hummus.createWriter("./output/combined.pdf");
  files
    .filter(file => file.endsWith(".pdf"))
    .forEach(fn => pdfWriter.appendPDFPagesFromPDF(fn));
  pdfWriter.end();
}

console.log("Please enter the url, you wish to get in PDF: ");
stdin.on("data", data => {
  //get actual data, instead of data+0D+0A
  const actualData = decodeURI(encodeURI(data).replace(/\%0D\%0A/, ""));

  //combine pdf
  if (actualData === "combine") {
    fs.readdir("./output", (err, items) => {
      console.log(items);
      if (items.length) combinePdfs(items);
    });
    //exit
  } else if (actualData === "exit" || actualData === "q") {
    console.log("Process completed.");
    process.exit();
    //generate PDF
  } else if (actualData.includes("http://") || actualData.includes("https://")) {
    const date = Date.now()
      .toString()
      .slice(9);
    generatePdf(actualData, "./output", `newpdf${date}.pdf`);
    console.log("enter another url, or type q to exit. ");
  }
});

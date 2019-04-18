const puppeteer = require("puppeteer");
const hummus = require("hummus");
const path = require("path");
const fs = require("fs");

const config = require("./config");
const stdin = process.stdin;

//create folder if none
const outputFolder = "./output";
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder);
}

stdin.setEncoding("utf-8");

const start_count = () => {
  let i = 0;
  let load_interval = setInterval(() => {
    if (i % 5 === 0) console.log(`${i}s`);
    i++;
  }, 1000);
  let load_timeout_termination = setTimeout(() => {
    clearInterval(load_interval);
    log.error(`Timeout failed`);
  }, 12000);

  return { load_interval, load_timeout_termination };
};
const stop_count = ({ load_interval, load_timeout_termination }) => {
  clearTimeout(load_timeout_termination);
  clearInterval(load_interval);
};

/**
 * Launch puppeteer helper function
 */
const launch_puppeteer = () => {
  const browserArgs = config.get("BROWSER_ARGS");
  if (global.debug) {
    browserArgs.headless = false;
  }
  const browser = puppeteer.launch(browserArgs);

  return browser;
};

/**
 * GENERATE A PDF
 *
 * @param {*} url
 * @param {*} outputDir
 * @param {*} filename
 */
const generatePdf = async (url, outputDir, filename) => {
  const browser = await launch_puppeteer();
  const page = await browser.newPage();
  const { load_interval, load_timeout_termination } = start_count();
  await page.goto(url, {
    waitUntil: ["domcontentloaded", "networkidle0", "load"]
  });

  try {
    await page.pdf({
      path: path.join(outputDir, filename),
      format: "A4"
    });
  } catch (e) {
    console.log("err", e);
  }

  stop_count({ load_interval, load_timeout_termination });
  return browser.close();
};

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

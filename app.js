const puppeteer = require("puppeteer");
const hummus = require("hummus");
const standard_input = process.stdin;
standard_input.setEncoding("utf-8");

async function generatePdf(url, outputDir, filename) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // await page.setRequestInterceptionEnabled(true);
  // page.on("request", request => {
  //   if (request.url.includes("name-you-can-filter")) request.abort();
  //   else request.continue();
  // });

  await page.goto(url, {
    waitUntil: "networkidle",
    networkIdleTimeout: 5000,
    timeout: 30000
  });
  await page.pdf({
    path: path.join(outputDir, filename),
    format: "A4"
  });
  browser.close()
}

function combinePdfs(files){
  const pdfWriter = hummus.createWriter('newsletter.pdf');
  files
      .filter(file => file.endsWith(".pdf"))
      .forEach(fn => {
          pdfWriter.appendPDFPagesFromPDF(file);
      });

  pdfWriter.end();
}
console.log("Please enter the url, you wish to get in PDF: ");
standard_input.on("data", data => {
  if (data === "exit\n") {
    console.log("Process completed.");
    process.exit();
  } else if(data.includes('http://') || data.includes('https://')){
    generatePdf(data, './output','newpdf.pdf')
  } else {
    console.log("User Input Data : " + data);
  }
});

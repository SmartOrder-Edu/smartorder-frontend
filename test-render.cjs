const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to page...');
  await page.goto('http://localhost:5172/exam/session?sessionId=2075918253113921538&rawStatus=doing&spaceId=2074879890340634625&title=%E6%8E%92%E5%BA%8F%E6%B5%8B%E8%AF%84', { waitUntil: 'networkidle0' });
  
  console.log('Waiting for network idle...');
  await new Promise(r => setTimeout(r, 5000));
  
  await page.screenshot({ path: 'screenshot.png' });
  const html = await page.content();
  fs.writeFileSync('page.html', html);
  
  console.log('Done.');
  await browser.close();
})();

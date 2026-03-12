// services/ntesService.js
// Node.js module to fetch NTES running status using Playwright.
// Exports: async function getTrainStatus(trainNumber) -> normalized object or null

const { chromium } = require('playwright');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 30 }); // 30s TTL

async function scrapeNTES(trainNumber) {
  const cached = cache.get(`ntes:${trainNumber}`);
  if (cached) {
    console.log(`[NTES Cache] Hit for train ${trainNumber}`);
    return cached;
  }

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    // NTES page that provides running info (adjust if the URL differs)
    const url = `https://enquiry.indianrail.gov.in/mntes/`;
    console.log(`[NTES] Fetching train ${trainNumber}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Find the input and type the train number
    // (selectors may differ: we try generic approach)
    const inputSelectors = [
      'input[name*="train"]',
      'input[placeholder*="train"]',
      'input[aria-label*="train"]',
      'input[id*="train"]'
    ];

    let inputFound = false;
    for (const selector of inputSelectors) {
      try {
        const inputs = await page.locator(selector).all();
        if (inputs.length > 0) {
          await inputs[0].fill(trainNumber);
          console.log(`[NTES] Filled train number in: ${selector}`);
          inputFound = true;
          break;
        }
      } catch (e) {
        // continue to next selector
      }
    }

    if (!inputFound) {
      console.warn('[NTES] Could not find train number input');
      await browser.close();
      return null;
    }

    // Press Enter or click search button
    try {
      await page.keyboard.press('Enter');
      console.log('[NTES] Pressed Enter');
    } catch (e) {
      try {
        const buttons = await page.locator('button').all();
        for (const btn of buttons) {
          const btnText = await btn.innerText();
          if (btnText.toLowerCase().includes('search')) {
            await btn.click();
            console.log('[NTES] Clicked search button');
            break;
          }
        }
      } catch (e2) {}
    }

    // Wait for expected results element - tune timeout if needed
    await page.waitForTimeout(3500);
    // Prefer waiting for specific selector
    // await page.waitForSelector('.running-status, #runningStatus', { timeout: 9000 }).catch(() => {});

    // Try to extract structured JSON if present in DOM scripts
    const pageContent = await page.content();

    // Often pages inject JSON in script tags. Try to find a JSON block with "train" or "running" keys
    const scriptTexts = await page.$$eval('script', scripts => scripts.map(s => s.textContent || ''));

    // Try to parse any JSON-looking script
    for (const txt of scriptTexts) {
      if (!txt) continue;
      if (txt.includes('train') || txt.includes('delay')) {
        // Try to find JSON object inside
        const matches = txt.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
        if (matches) {
          for (const match of matches) {
            try {
              const parsed = JSON.parse(match);
              // If parsed has train info, normalize and return
              if (parsed && (parsed.train || parsed.train_number || parsed.train_no || parsed.trainNo)) {
                const out = {
                  train_number: parsed.train_no || parsed.train || parsed.train_number || parsed.trainNo,
                  train_name: parsed.name || parsed.train_name || parsed.trainName || '',
                  delay_minutes: parsed.delay || parsed.delay_minutes || 0,
                  status: parsed.status || 'Unknown',
                  raw: parsed
                };
                cache.set(`ntes:${trainNumber}`, out);
                await browser.close();
                console.log(`[NTES] Extracted data for ${trainNumber}: delay=${out.delay_minutes}min`);
                return out;
              }
            } catch (e) {
              // ignore JSON parse errors
            }
          }
        }
      }
    }

    // If no embedded JSON, try scraping visible fields
    // Attempt to extract fields by label text
    const text = await page.innerText('body').catch(() => '');

    // Basic heuristics — adjust selectors to actual NTES HTML
    const delayMatch = text.match(/Delay[:\s]+(\d+)\s*min/i) || text.match(/Delay[:\s]+(\d+)/i);
    const delay = delayMatch ? parseInt(delayMatch[1], 10) : 0;

    // Try to extract train name/text near the train number
    let trainName = '';
    try {
      const tnEl = await page.locator(`text=${trainNumber}`).first();
      if (tnEl) {
        // get parent container text and guess name
        const parentText = await tnEl.evaluate(el => el.parentElement ? el.parentElement.textContent : el.textContent);
        // crude cleanup
        trainName = (parentText || '').replace(trainNumber, '').trim().split('\n')[0];
      }
    } catch (e) {}

    // Also try to find heading or title that matches train name pattern
    try {
      const headings = await page.locator('h1, h2, h3, .train-name, [class*="name"]').allTextContents();
      const validNames = headings.filter(h => h.length > 5 && h.length < 150 && !h.match(/^\d+$/));
      if (validNames.length > 0) {
        trainName = validNames[0];
      }
    } catch (e) {}

    const result = {
      train_number: trainNumber,
      train_name: trainName || null,
      delay_minutes: delay,
      status: delay > 0 ? 'Delayed' : (delay === 0 ? 'On Time' : 'Running'),
    };

    cache.set(`ntes:${trainNumber}`, result);
    await browser.close();
    console.log(`[NTES] Scraped train ${trainNumber}: name=${result.train_name}, delay=${result.delay_minutes}min`);
    return result;
  } catch (err) {
    try {
      await browser.close();
    } catch (e) {}
    // return null so code using this falls back to railYatri/mock
    console.warn('[NTES] Scrape failed:', err.message || err);
    return null;
  }
}

module.exports = {
  getTrainStatus: scrapeNTES
};

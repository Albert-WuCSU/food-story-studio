const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 assert.equal(await page.locator('#exportPNG').isDisabled(),true);
 await page.locator('#sampleBtn').click();
 assert.equal(await page.locator('#sourceLabel').innerText(),'规则草稿');
 await page.locator('#reviewConfirm').check();await page.locator('#headline').fill('给生活留一点空白');
 assert.equal(await page.locator('#reviewConfirm').isChecked(),false);
 await page.locator('#product').fill('另一件商品');assert.equal(await page.locator('#exportPNG').isDisabled(),true);
 await page.locator('#sampleBtn').click();await page.locator('#handoffBtn').click();
 await page.locator('#importText').fill('{"headline":"缺少字段"}');await page.locator('#applyImport').click();
 assert.match(await page.locator('#importError').innerText(),/必须且只能/);
 await page.locator('#importText').fill(JSON.stringify({headline:'给日常留一点空白',story:'每盒12枚，独立包装。为一次平常的分享，准备一份小心意。',cta:'为下一次见面备一份'}));
 await page.locator('#applyImport').click();assert.match(await page.locator('#sourceLabel').innerText(),/用户声明/);
 await page.locator('#closeDialog').click();await page.locator('#ratio').selectOption('square');
 assert.equal(await page.locator('#poster').evaluate(c=>c.width+','+c.height),'1080,1080');
 const dl=page.waitForEvent('download');await page.locator('#exportPNG').click();assert.match((await dl).suggestedFilename(),/待审核/);
 for(const width of [320,390,768,1024,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
 assert.equal(errors.length,0);
 console.log('PASS: offline UI, sources, review invalidation, stale Brief, JSON import, PNG download, responsive layout; no runtime errors.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

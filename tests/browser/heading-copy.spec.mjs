import {test,expect} from './fixtures.mjs';

for (const width of [375,1440]) test(`heading icon copies the full section URL at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  await page.addInitScript(()=>{
    window.copiedSectionLinks=[];
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.copiedSectionLinks.push(value);}}});
  });
  await page.goto('/?source=share#project-rules');
  const link=page.locator('#project-fit-title > a');
  await link.hover();
  await link.locator('svg').click();
  await expect(page.getByRole('status')).toHaveText('Link copied');
  expect(await page.evaluate(()=>window.copiedSectionLinks)).toEqual([page.url()]);
  await expect(page).toHaveURL(/\?source=share#project-rules$/);
  await link.focus(); await page.keyboard.press('Enter');
  await expect.poll(()=>page.evaluate(()=>window.copiedSectionLinks.length)).toBe(2);

  // Clipboard refusal must keep the native link usable and report honestly.
  await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw new Error('Clipboard denied');};});
  await link.locator('svg').click();
  await expect(page.getByRole('status')).toHaveText('Copy the link from the address bar');
  await expect(page).toHaveURL(/\?source=share#project-rules$/);
});

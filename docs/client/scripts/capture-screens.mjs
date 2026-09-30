import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'screenshots');
const base = 'http://localhost:5173';

const shots = [];

async function shot(page, name, label) {
  const file = `${name}.png`;
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(outDir, file), fullPage: true });
  shots.push({ file, label, url: page.url() });
  console.log(`saved ${file}`);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 920 },
    deviceScaleFactor: 1,
  });

  await page.goto(`${base}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel(/email/i).waitFor();
  await shot(page, '01-login', 'Sign in');

  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL((url) => url.pathname === '/', { timeout: 20000 });
  await page.getByText(/active work|team size|my work/i).first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(1200);
  await shot(page, '02-home', 'Home dashboard');

  await page.goto(`${base}/my-work`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /my work/i }).waitFor();
  await shot(page, '03-my-work', 'My work');

  await page.getByRole('tab', { name: /kanban/i }).click();
  await page.waitForTimeout(800);
  await shot(page, '04-my-work-kanban', 'My work — board');

  await page.goto(`${base}/work`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /all work/i }).waitFor();
  await page.waitForTimeout(800);
  await shot(page, '05-all-work', 'All work');

  const firstRow = page.locator('.MuiDataGrid-row').first();
  if (await firstRow.count()) {
    await firstRow.click();
    await page.waitForURL(/\/work\/.+/, { timeout: 15000 });
    await page.getByRole('heading').first().waitFor();
    await page.waitForTimeout(800);
    await shot(page, '06-work-detail', 'Work item detail');
  }

  await page.goto(`${base}/work/new`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /new work/i }).waitFor();
  await shot(page, '07-new-work', 'Create work');

  await page.goto(`${base}/processes`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /processes/i }).waitFor();
  await shot(page, '08-processes', 'Processes');

  const processCard = page.locator('.MuiCard-root').first();
  if (await processCard.count()) {
    await processCard.click();
    await page.waitForURL(/\/processes\/.+/, { timeout: 15000 });
    await page.waitForTimeout(700);
    await shot(page, '09-process-detail', 'Process detail');
  }

  await page.goto(`${base}/resources`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /people/i }).waitFor();
  await page.waitForTimeout(700);
  await shot(page, '10-people', 'People and workload');

  await page.goto(`${base}/documents`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /documents/i }).waitFor();
  await page.waitForTimeout(700);
  await shot(page, '11-documents', 'Documents');

  await page.goto(`${base}/reports`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /reports/i }).waitFor();
  await page.waitForTimeout(900);
  await shot(page, '12-reports', 'Reports');

  await page.goto(`${base}/notifications`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /alerts/i }).waitFor();
  await shot(page, '13-alerts', 'Alerts');

  await page.goto(`${base}/admin/users`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /users/i }).waitFor();
  await page.waitForTimeout(700);
  await shot(page, '14-users', 'Users');

  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(shots, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

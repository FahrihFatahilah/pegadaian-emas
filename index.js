const puppeteer = require('puppeteer');

module.exports = async (req, res) => {
  if (req.url !== '/harga-emas') {
    return res.end('Gunakan endpoint /harga-emas');
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Tambahkan user-agent & viewport untuk hindari bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto('https://www.pegadaian.co.id/', { waitUntil: 'networkidle2', timeout: 60000 });

    // Tunggu elemen muncul, kasih timeout
    await page.waitForSelector('.box-jual-beli__left p', { timeout: 15000 });
    await page.waitForSelector('.box-jual-beli__right p', { timeout: 15000 });

    const hargaBeliRaw = await page.$eval('.box-jual-beli__left p', el => el.textContent.trim());
    const hargaJualRaw = await page.$eval('.box-jual-beli__right p', el => el.textContent.trim());

    await browser.close();

    // Convert ke angka
    const toNumber = (str) => {
      const match = str.match(/Rp\s*([\d.,]+)/);
      if (!match) return null;
      return parseInt(match[1].replace(/\./g, '').replace(/,/g, ''));
    };

    const hargaBeli = toNumber(hargaBeliRaw);
    const hargaJual = toNumber(hargaJualRaw);

    if (!hargaBeli || !hargaJual) throw new Error('Parsing gagal');

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      hargaBeli,
      hargaJual,
      sumber: 'https://www.pegadaian.co.id/',
      waktu: new Date().toISOString()
    }));
  } catch (err) {
    console.error('[SCRAPER ERROR]', err.message);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Gagal mengambil data harga emas dari Pegadaian' }));
  }
};
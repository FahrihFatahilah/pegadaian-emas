const puppeteer = require('puppeteer');

module.exports = async (req, res) => {
  if (req.url !== '/harga-emas') {
    return res.end('Gunakan endpoint /harga-emas untuk mendapatkan data');
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://www.pegadaian.co.id/', { waitUntil: 'networkidle2' });

    await page.waitForSelector('.box-jual-beli__left p');
    await page.waitForSelector('.box-jual-beli__right p');

    const hargaBeliRaw = await page.$eval('.box-jual-beli__left p', el => el.textContent.trim());
    const hargaJualRaw = await page.$eval('.box-jual-beli__right p', el => el.textContent.trim());

    await browser.close();

    const toNumber = (str) => {
      const match = str.match(/Rp\s*([\d.,]+)/);
      if (!match) return null;
      return parseInt(match[1].replace(/\./g, '').replace(/,/g, ''));
    };

    const hargaBeli = toNumber(hargaBeliRaw);
    const hargaJual = toNumber(hargaJualRaw);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      hargaBeli,
      hargaJual,
      sumber: 'https://www.pegadaian.co.id/',
      waktu: new Date().toISOString(),
    }));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Gagal mengambil data harga emas dari Pegadaian' }));
  }
};

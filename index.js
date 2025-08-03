const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.get('/harga-emas', async (req, res) => {
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

    // Convert to number: 'Rp 18.680,00/ 0,01 gr' → 18680
    const toNumber = (str) => {
      const match = str.match(/Rp\s*([\d.,]+)/);
      if (!match) return null;
      return parseInt(match[1].replace(/\./g, '').replace(/,/g, ''));
    };

    const hargaBeli = toNumber(hargaBeliRaw);
    const hargaJual = toNumber(hargaJualRaw);

    res.json({
      hargaBeli,
      hargaJual,
      sumber: 'https://www.pegadaian.co.id/',
      waktu: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil data harga emas dari Pegadaian' });
  }
});

app.get('/', (req, res) => {
  res.send('Gunakan endpoint /harga-emas untuk mendapatkan data');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
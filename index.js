const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/check/:id', async (req, res) => {
    const playerID = req.params.id;

    if (!playerID) {
        return res.status(400).json({ error: "Debes proporcionar un ID" });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process'
            ],
            headless: "new"
        });

        const page = await browser.newPage();
        
        // Ajustamos el User Agent para que Pagostore no nos bloquee
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        // Vamos a la página de login por ID
        await page.goto('https://pagostore.com/app/100067/login', { waitUntil: 'networkidle2' });

        // Escribimos el ID del cliente
        await page.waitForSelector('input[name="player_id"]');
        await page.type('input[name="player_id"]', playerID);
        
        // Click en el botón de entrar
        await page.click('button[type="submit"]');

        // Esperamos a que cargue el nombre del jugador (ajustar selector si Garena lo cambia)
        await page.waitForSelector('.player-name', { timeout: 10000 });

        const nickname = await page.$eval('.player-name', el => el.innerText);

        res.json({
            success: true,
            id: playerID,
            nickname: nickname
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "No se pudo encontrar el ID o el sitio está lento.",
            error: error.message
        });
    } finally {
        if (browser) await browser.close();
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});

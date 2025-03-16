const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const { Document, Packer, Paragraph, TextRun } = require('docx');

const app = express();
const port = 3000;

app.use(express.json());

// Подключение к MySQL
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Dima03112003!',
    database: 'terms_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Маршрут для поиска терминов
app.get('/search', async (req, res) => {
    try {
        const query = req.query.q.toLowerCase();
        const [rows] = await db.query("SELECT * FROM terms WHERE LOWER(Термин) LIKE ?", [`%${query}%`]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при запросе к БД' });
    }
});

// Маршрут для получения определения по термину
app.get('/term/:term', async (req, res) => {
    try {
        const term = req.params.term;
        const [rows] = await db.query("SELECT * FROM terms WHERE Термин = ?", [term]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'Термин не найден' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при запросе к БД' });
    }
});

// Маршрут для скачивания DOCX
app.post('/download', async (req, res) => {
    const selectedTerms = req.body;
    if (!selectedTerms || selectedTerms.length === 0) {
        return res.status(400).json({ error: 'Нет выбранных терминов' });
    }

    // Создаем документ
    const doc = new Document({
        sections: [{
            properties: {},
            children: selectedTerms.map(term =>
                new Paragraph({
                    children: [
                        new TextRun({ text: `${term.Термин}`, bold: true, font: "Times New Roman", size: 28 }),
                        new TextRun({ text: `\n ${term.Определение || 'Нет данных'}`, font: "Times New Roman", size: 28 }),
                        new TextRun({ text: `\nГОСТ: ${term.ГОСТ || 'Нет'}`, font: "Times New Roman", size: 28 }),
                        new TextRun({ text: '\n\n', font: "Times New Roman", size: 28 }),
                    ],
                })
            ),
        }],
    });

    // Генерация и отправка файла
    Packer.toBuffer(doc).then(buffer => {
        res.setHeader('Content-Disposition', 'attachment; filename=termsoutput.docx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);
    });
});

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

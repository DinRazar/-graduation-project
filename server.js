const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const { Document, Packer, Paragraph, TextRun } = require('docx');

const app = express();
const port = 3000;

app.use(express.json()); // Для обработки JSON-запросов

// Путь к файлу Excel
const filePath = path.join(__dirname, 'terms.xlsx');

// Чтение Excel-файла
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0]; 
const worksheet = workbook.Sheets[sheetName];

// Преобразование данных из Excel в массив объектов
const terms = xlsx.utils.sheet_to_json(worksheet);

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Маршрут для поиска терминов
app.get('/search', (req, res) => {
    const query = req.query.q.toLowerCase();
    const results = terms.filter(term => term.Термин.toLowerCase().includes(query));
    res.json(results);
});

// Маршрут для получения определения по термину
app.get('/term/:term', (req, res) => {
    const term = req.params.term;
    const result = terms.find(t => t.Термин === term);
    if (result) {
        res.json(result);
    } else {
        res.status(404).json({ error: 'Термин не найден' });
    }
});

// 📥 Маршрут для скачивания DOCX
app.post('/download', (req, res) => {
    const selectedTerms = req.body; // Получаем массив терминов

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
                        new TextRun({ text: `Термин: ${term.Термин}`, bold: true }),
                        new TextRun(`\nОпределение: ${term.Определение || 'Нет данных'}`),
                        new TextRun(`\nГОСТ: ${term.ГОСТ || 'Нет'}`),
                        new TextRun('\n\n'),
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

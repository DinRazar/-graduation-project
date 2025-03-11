const express = require('express');
const xlsx = require('xlsx');
const path = require('path');

const app = express();
const port = 3000;

// Путь к файлу Excel
const filePath = path.join(__dirname, 'terms.xlsx');

// Чтение Excel-файла
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0]; // Предполагаем, что данные находятся на первом листе
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

// Обслуживание статических файлов (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const { Document, Packer, Paragraph, TextRun } = require('docx');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// Настройка сессий
app.use(session({
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: true
}));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Поиск терминов
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

// Получение определения термина
app.get('/term/:term', async (req, res) => {
    try {
        const term = req.params.term;
        const [rows] = await db.query("SELECT * FROM terms WHERE Термин = ?", [term]);
        res.json(rows.length > 0 ? rows[0] : { error: 'Термин не найден' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при запросе к БД' });
    }
});

// Скачивание DOCX
app.post('/download', async (req, res) => {
    const selectedTerms = req.body;
    if (!selectedTerms || selectedTerms.length === 0) {
        return res.status(400).json({ error: 'Нет выбранных терминов' });
    }

    // Генерация DOCX
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
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Disposition', 'attachment; filename=terms.docx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
});

// Обратная связь (сохранение сообщений)
app.post('/feedback', async (req, res) => {
    try {
        const message = req.body.message;
        if (!message) return res.status(400).json({ error: 'Сообщение не может быть пустым' });

        await db.query('INSERT INTO feedback (message) VALUES (?)', [message]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при сохранении сообщения' });
    }
});

app.delete('/delete-feedback/:id', async (req, res) => {
    const feedbackId = req.params.id;

    try {
        const [result] = await db.query("DELETE FROM feedback WHERE id = ?", [feedbackId]);

        if (result.affectedRows > 0) {
            res.sendStatus(200); // Успешно удалено
        } else {
            res.status(404).json({ error: 'Уведомление не найдено' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при удалении уведомления' });
    }
});


// Страница входа в админку
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Авторизация админа
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password') {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Неверные данные' });
    }
});

// Выход из админки
app.post('/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.sendStatus(200);
    });
});


// Страница админки (только для авторизованных)
app.get('/admin', (req, res) => {
    if (!req.session.isAdmin) {
        return res.redirect('/admin/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Получение сообщений пользователей
app.get('/admin/messages', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'Нет доступа' });

    try {
        const [rows] = await db.query('SELECT * FROM feedback ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при запросе сообщений' });
    }
});

// Добавление нового термина
app.post('/admin/add-term', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'Нет доступа' });

    try {
        const { term, definition, gost } = req.body;
        if (!term || !definition) return res.status(400).json({ error: 'Заполните все поля' });

        await db.query('INSERT INTO terms (Термин, Определение, ГОСТ) VALUES (?, ?, ?)', [term, definition, gost]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при добавлении термина' });
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

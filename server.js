const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');

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

// Получение всех терминов
app.get('/terms', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM terms ORDER BY Термин ASC");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при запросе к БД' });
    }
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

// Получение определения термина по id
app.get('/term/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await db.query("SELECT * FROM terms WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Термин не найден' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при запросе к БД' });
    }
});

app.post('/download', async (req, res) => {
    const selectedTerms = req.body;

    if (!selectedTerms || selectedTerms.length === 0) {
        return res.status(400).json({ error: 'Нет выбранных терминов' });
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: selectedTerms.flatMap(term => {
                // Приведение даты к формату YYYY-MM-DD
                const formattedDate = term.ДатаВведения
                    ? new Date(term.ДатаВведения).toISOString().split('T')[0]
                    : 'не указана';

                return [
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { line: 360 }, // 1.5 интервал
                        children: [
                            new TextRun({
                                text: `${term.Термин} - ${term.Определение || 'Нет данных'}`,
                                font: "Times New Roman",
                                size: 28
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { line: 360 },
                        children: [
                            new TextRun({
                                text: `${term.ГОСТ || 'ГОСТ не указан'}. ${term.Наименование || 'Нет наименования'}. Дата введения ${formattedDate}. – М.: Стандартинформ. – ${term.Страниц || 'X'} с.`,
                                font: "Times New Roman",
                                size: 28
                            })
                        ]
                    }),
                    new Paragraph({ // пустая строка между терминами
                        children: [new TextRun({ text: "", font: "Times New Roman", size: 28 })]
                    })
                ];
            }),
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

// Удаление сообщения обратной связи
app.delete('/delete-feedback/:id', async (req, res) => {
    const feedbackId = req.params.id;

    try {
        const [result] = await db.query("DELETE FROM feedback WHERE id = ?", [feedbackId]);

        if (result.affectedRows > 0) {
            res.sendStatus(200);
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

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await db.query('SELECT * FROM admin WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Неверные данные' });
        }

        const admin = rows[0];

        const match = await bcrypt.compare(password, admin.password);
        if (match) {
            req.session.isAdmin = true;
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Неверные данные' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
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
        const { term, definition, gost, name, introduction_date, page_count } = req.body;
        if (!term || !definition) return res.status(400).json({ error: 'Заполните все поля' });

        await db.query('INSERT INTO terms (Термин, Определение, ГОСТ, Наименование, ДатаВведения, Страниц) VALUES (?, ?, ?, ?, ?, ?)', [term, definition, gost, name, introduction_date, page_count ]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при добавлении термина' });
    }
});

app.put('/admin/update-term', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'Нет доступа' });

    try {
        const { id, term, definition, gost } = req.body;
        if (!id || !term || !definition) return res.status(400).json({ error: 'Некорректные данные' });

        await db.query('UPDATE terms SET Термин = ?, Определение = ?, ГОСТ = ? WHERE id = ?', [term, definition, gost, id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при обновлении термина' });
    }
});

app.delete('/admin/delete-term/:id', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'Нет доступа' });

    try {
        const id = req.params.id;
        if (!id) return res.status(400).json({ error: 'Некорректные данные' });

        const [result] = await db.query('DELETE FROM terms WHERE id = ?', [id]);

        if (result.affectedRows > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Термин не найден' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при удалении термина' });
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

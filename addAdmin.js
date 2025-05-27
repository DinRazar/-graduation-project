const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function addAdmin(username, plainPassword) {
    // Параметры подключения к БД — подкорректируй под себя
    const db = await mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'Dima03112003!',
        database: 'terms_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(plainPassword, saltRounds);

        const [result] = await db.query('INSERT INTO admin (username, password) VALUES (?, ?)', [username, hash]);
        console.log(`Админ ${username} добавлен в базу.`);
    } catch (err) {
        console.error('Ошибка при добавлении админа:', err);
    } finally {
        await db.end();
    }
}

// Заменяй на нужный логин и пароль
addAdmin('admin', 'password');

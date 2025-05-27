// Загрузка сообщений пользователей
async function fetchMessages() {
    const response = await fetch('/admin/messages');
    const messages = await response.json();
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '';

    messages.forEach(msg => {
        const li = document.createElement('li');
        li.textContent = `${msg.message} (${msg.date})`;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить';
        deleteButton.addEventListener('click', async () => {
            await deleteMessage(msg.id, li);
        });

        li.appendChild(deleteButton);
        messagesList.appendChild(li);
    });
}

async function deleteMessage(id, element) {
    const response = await fetch(`/delete-feedback/${id}`, { method: 'DELETE' });
    if (response.ok) {
        element.remove();
    } else {
        alert('Ошибка при удалении сообщения');
    }
}

// Добавление нового термина
document.getElementById('addTermForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const term = document.getElementById('term').value;
    const definition = document.getElementById('definition').value;
    const gost = document.getElementById('gost').value;

    const response = await fetch('/admin/add-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, definition, gost })
    });

    if (response.ok) {
        document.getElementById('successMessage').textContent = 'Термин добавлен!';
        loadTerms();
    } else {
        alert('Ошибка при добавлении термина');
    }
});

async function loadTerms() {
    const response = await fetch('/terms');
    const terms = await response.json();
    const termsList = document.getElementById('termsList');
    termsList.innerHTML = '';

    terms.forEach(term => {
        const termDiv = document.createElement('div');
        termDiv.className = 'term-item';

        const termInput = document.createElement('input');
        termInput.value = term.Термин;

        const definitionInput = document.createElement('textarea');
        definitionInput.value = term.Определение;

        const gostInput = document.createElement('input');
        gostInput.value = term.ГОСТ || '';

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'buttons';

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Сохранить';
        saveButton.addEventListener('click', async () => {
            await updateTerm(term.id, termInput.value, definitionInput.value, gostInput.value);
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить';
        deleteButton.style.color = 'black';
        deleteButton.addEventListener('click', async () => {
            if (confirm('Вы уверены, что хотите удалить этот термин?')) {
                await deleteTerm(term.id);
            }
        });

        buttonsDiv.appendChild(saveButton);
        buttonsDiv.appendChild(deleteButton);

        termDiv.appendChild(termInput);
        termDiv.appendChild(definitionInput);
        termDiv.appendChild(gostInput);
        termDiv.appendChild(buttonsDiv);

        termsList.appendChild(termDiv);
    });
}

// Удаление термина
async function deleteTerm(id) {
    const response = await fetch(`/admin/delete-term/${id}`, {
        method: 'DELETE',
    });

    if (response.ok) {
        alert('Термин удалён!');
        loadTerms();
    } else {
        alert('Ошибка при удалении термина');
    }
}

// Обновление термина
async function updateTerm(id, term, definition, gost) {
    const response = await fetch('/admin/update-term', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, term, definition, gost })
    });

    if (response.ok) {
        alert('Термин обновлён!');
        loadTerms();
    } else {
        alert('Ошибка при обновлении');
    }
}

// Поиск терминов
document.getElementById('searchInput').addEventListener('input', async (event) => {
    const query = event.target.value.toLowerCase();
    const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
    const terms = await response.json();
    const termsList = document.getElementById('termsList');
    termsList.innerHTML = '';

    terms.forEach(term => {
        const termDiv = document.createElement('div');
        termDiv.className = 'term-item';

        const termInput = document.createElement('input');
        termInput.value = term.Термин;

        const definitionInput = document.createElement('textarea');
        definitionInput.value = term.Определение;

        const gostInput = document.createElement('input');
        gostInput.value = term.ГОСТ || '';

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'buttons';

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Сохранить';
        saveButton.addEventListener('click', async () => {
            await updateTerm(term.id, termInput.value, definitionInput.value, gostInput.value);
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить';
        deleteButton.style.color = 'black';
        deleteButton.addEventListener('click', async () => {
            if (confirm(`Вы уверены, что хотите удалить термин "${term.Термин}"?`)) {
                await deleteTerm(term.id);
            }
        });

        buttonsDiv.appendChild(saveButton);
        buttonsDiv.appendChild(deleteButton);

        termDiv.appendChild(termInput);
        termDiv.appendChild(definitionInput);
        termDiv.appendChild(gostInput);
        termDiv.appendChild(buttonsDiv);

        termsList.appendChild(termDiv);
    });
});

// Кнопка выхода
document.getElementById('logoutButton').addEventListener('click', async () => {
    await fetch('/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
});

// Открыть/закрыть панель сообщений
document.getElementById('toggleMessagesButton').addEventListener('click', () => {
    const panel = document.getElementById('messagesPanel');
    panel.classList.toggle('hidden');
});

// Автоматический выход при закрытии вкладки
window.addEventListener("beforeunload", function () {
    navigator.sendBeacon("/logout");
});

// Инициализация
fetchMessages();
loadTerms();

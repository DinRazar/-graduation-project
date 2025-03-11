const searchInput = document.getElementById('searchInput');
const termList = document.getElementById('termList');

searchInput.addEventListener('input', function() {
    const query = searchInput.value;
    if (query.length > 0) { // Изменено условие на > 0
        fetch(`/search?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                termList.innerHTML = '';
                data.forEach(term => {
                    const li = document.createElement('li');
                    li.textContent = term.Термин;

                    // Создаем кнопку для отображения определения
                    const button = document.createElement('button');
                    button.textContent = 'Показать определение';
                    button.addEventListener('click', () => {
                        // Проверяем, есть ли уже отображение определения
                        const existingDefinition = li.querySelector('.definition');
                        if (existingDefinition) {
                            // Если определение уже есть, удаляем его
                            li.removeChild(existingDefinition);
                            button.textContent = 'Показать определение'; // Меняем текст кнопки
                        } else {
                            // Запрашиваем данные термина
                            fetch(`/term/${encodeURIComponent(term.Термин)}`)
                                .then(response => response.json())
                                .then(termData => {
                                    // Создаем элемент для отображения определения
                                    const definition = document.createElement('div');
                                    definition.classList.add('definition'); // Добавляем класс для определения
                                    definition.innerHTML = `
                                        <h2>${termData.Термин}</h2>
                                        <p>${termData.Определение}</p>
                                        <p>${termData.ГОСТ ? `ГОСТ: ${termData.ГОСТ}` : ''}</p>
                                    `;
                                    li.appendChild(definition);
                                    button.textContent = 'Скрыть определение'; // Меняем текст кнопки
                                });
                        }
                    });

                    li.appendChild(button);
                    termList.appendChild(li);
                });
            });
    } else {
        termList.innerHTML = '';
    }
});

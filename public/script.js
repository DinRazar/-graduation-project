const searchInput = document.getElementById('searchInput');
const termList = document.getElementById('termList');
const selectedTerms = document.getElementById('selectedTerms');
const downloadDocxButton = document.getElementById('downloadDocx');

let selectedTermsData = [];

searchInput.addEventListener('input', function() {
    const query = searchInput.value;
    if (query.length > 0) {
        fetch(`/search?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                termList.innerHTML = '';
                data.forEach(term => {
                    const li = document.createElement('li');
                    li.textContent = term.Термин;

                    const button = document.createElement('button');
                    button.textContent = 'Показать определение';
                    button.addEventListener('click', () => {
                        const existingDefinition = li.querySelector('.definition');
                        if (existingDefinition) {
                            li.removeChild(existingDefinition);
                            button.textContent = 'Показать определение';
                        } else {
                            fetch(`/term/${encodeURIComponent(term.Термин)}`)
                                .then(response => response.json())
                                .then(termData => {
                                    const definition = document.createElement('div');
                                    definition.classList.add('definition');
                                    definition.innerHTML = `
                                        <h2>${termData.Термин}</h2>
                                        <p>${termData.Определение}</p>
                                        <p>${termData.ГОСТ ? `ГОСТ: ${termData.ГОСТ}` : ''}</p>
                                    `;
                                    li.appendChild(definition);
                                    button.textContent = 'Скрыть определение';
                                });
                        }
                    });

                    const addButton = document.createElement('button');
                    addButton.textContent = 'Добавить в список';
                    addButton.addEventListener('click', () => {
                        if (selectedTermsData.length < 10 && !selectedTermsData.some(t => t.Термин === term.Термин)) {
                            selectedTermsData.push(term);
                            updateSelectedTerms();
                        }
                    });

                    li.appendChild(button);
                    li.appendChild(addButton);
                    termList.appendChild(li);
                });
            });
    } else {
        termList.innerHTML = '';
    }
});

function updateSelectedTerms() {
    selectedTerms.innerHTML = '';
    selectedTermsData.forEach(term => {
        const li = document.createElement('li');
        li.textContent = term.Термин;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Удалить';
        removeButton.addEventListener('click', () => {
            selectedTermsData = selectedTermsData.filter(t => t.Термин !== term.Термин);
            updateSelectedTerms();
        });

        li.appendChild(removeButton);
        selectedTerms.appendChild(li);
    });
}

downloadDocxButton.addEventListener('click', () => {
    fetch('/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTermsData)
    })
    .then(response => response.blob())
    .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'термины.docx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});



const searchInput = document.getElementById('searchInput');
const termList = document.getElementById('termList');
const selectedTerms = document.getElementById('selectedTerms');
const downloadDocxButton = document.getElementById('downloadDocx');
const backToTopButton = document.getElementById('backToTop');

let selectedTermsData = [];

// Загрузка всех терминов при старте
fetch('/terms')
    .then(response => response.json())
    .then(data => {
        termList.innerHTML = '';
        organizeTermsByLetter(data);
    });

// Функция для добавления термина в список
function addTermToList(term) {
    const li = document.createElement('li');
    li.textContent = term.Термин;
    // li.textContent = term.term;

    const button = document.createElement('button');
    button.textContent = 'Показать определение';
    button.addEventListener('click', () => {
        const existingDefinition = li.querySelector('.definition');
        if (existingDefinition) {
            li.removeChild(existingDefinition);
            button.textContent = 'Показать определение';
        } else {
            fetch(`/term/${term.id}`)
                .then(response => response.json())
                .then(termData => {
                    const definition = document.createElement('div');
                    definition.classList.add('definition');
                    definition.innerHTML = `
                        <h2>${termData.Термин}</h2>
                        <p>${termData.Определение}</p>
                        <p>${termData.ГОСТ ? `ГОСТ: ${termData.ГОСТ}` : ''}</p>
                    `;
                    //   definition.innerHTML = `
                    //     <h2>${termData.term}</h2>
                    //     <p>${termData.definition}</p>
                    //     <p>${termData.gost ? `ГОСТ: ${termData.gost}` : ''}</p>
                    // `;
                    li.appendChild(definition);
                    button.textContent = 'Скрыть определение';
                });
        }
    });

    const addButton = document.createElement('button');
    addButton.textContent = 'Добавить в список';
    addButton.addEventListener('click', () => {
        if (selectedTermsData.length < 10 && !selectedTermsData.some(t => t.id === term.id)) {
            selectedTermsData.push(term);
            updateSelectedTerms();
        }
    });
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('term-buttons');
    buttonContainer.appendChild(button);
    buttonContainer.appendChild(addButton);

    li.appendChild(buttonContainer);
    return li;
}

// Организация терминов по первой букве
function organizeTermsByLetter(terms) {
    const termsByLetter = {};

    terms.forEach(term => {
        const firstLetter = term.Термин[0].toUpperCase();
        // const firstLetter = term.term[0].toUpperCase();

        if (!termsByLetter[firstLetter]) {
            termsByLetter[firstLetter] = [];
        }
        termsByLetter[firstLetter].push(term);
    });

    Object.keys(termsByLetter).sort().forEach(letter => {
        const section = document.createElement('section');
        const heading = document.createElement('h2');
        heading.textContent = letter;
        section.appendChild(heading);

        const list = document.createElement('ul');
        termsByLetter[letter].forEach(term => {
            const li = addTermToList(term);
            list.appendChild(li);
        });
        section.appendChild(list);
        termList.appendChild(section);
    });
}

// Поиск терминов

searchInput.addEventListener('input', function() {
    const query = searchInput.value;
    fetch(`/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            termList.innerHTML = '';
            organizeTermsByLetter(data);
        });
});

function updateSelectedTerms() {
    selectedTerms.innerHTML = '';
    selectedTermsData.forEach(term => {
        const li = document.createElement('li');
        li.textContent = term.Термин;
        // li.textContent = term.term;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Удалить';
        removeButton.addEventListener('click', () => {
            selectedTermsData = selectedTermsData.filter(t => t.id !== term.id);
            updateSelectedTerms();
        });

        li.appendChild(removeButton);
        selectedTerms.appendChild(li);
    });
}

// Скачать DOCX
downloadDocxButton.addEventListener('click', () => {
    if (selectedTermsData.length === 0) {
        alert('Вы не выбрали ни одного термина!');
        return;
    }
    
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
    })
    .catch(error => alert(`Ошибка: ${error.message}`));
});

// Кнопка "Вернуться вверх"
backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

        document.getElementById('feedbackButton').addEventListener('click', () => {
            document.getElementById('feedbackFormContainer').classList.remove('hidden');
        });

        document.getElementById('closeFeedbackForm').addEventListener('click', () => {
            document.getElementById('feedbackFormContainer').classList.add('hidden');
        });

        document.getElementById('sendFeedback').addEventListener('click', async () => {
            const message = document.getElementById('feedbackMessage').value.trim();
            if (!message) {
                alert('Введите сообщение!');
                return;
            }

            const response = await fetch('/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (response.ok) {
                alert('Сообщение отправлено!');
                document.getElementById('feedbackMessage').value = '';
                document.getElementById('feedbackFormContainer').classList.add('hidden');
            } else {
                alert('Ошибка отправки сообщения');
            }
        });


// const searchInput = document.getElementById('searchInput');
// const termList = document.getElementById('termList');
// const selectedTerms = document.getElementById('selectedTerms');
// const downloadDocxButton = document.getElementById('downloadDocx');
// const backToTopButton = document.getElementById('backToTop');

// let selectedTermsData = [];

// // Загрузка всех терминов при старте
// fetch('/terms')
//     .then(response => response.json())
//     .then(data => {
//         termList.innerHTML = '';
//         organizeTermsByLetter(data);
//     });

// // Функция для добавления термина в список
// function addTermToList(term) {
//     const li = document.createElement('li');
//     // li.textContent = term.Термин;
//     li.textContent = term.term;

//     const button = document.createElement('button');
//     button.textContent = 'Показать определение';
//     button.addEventListener('click', () => {
//         const existingDefinition = li.querySelector('.definition');
//         if (existingDefinition) {
//             li.removeChild(existingDefinition);
//             button.textContent = 'Показать определение';
//         } else {
//             fetch(`/term/${term.id}`)
//                 .then(response => response.json())
//                 .then(termData => {
//                     const definition = document.createElement('div');
//                     definition.classList.add('definition');
//                     definition.innerHTML = `
//                          <h2>${termData.term}</h2>
//                          <p>${termData.definition}</p>
//                          <p>${termData.gost ? `ГОСТ: ${termData.gost}` : ''}</p>
//                     `;
//                     li.appendChild(definition);
//                     button.textContent = 'Скрыть определение';
//                 });
//         }
//     });

//     const addButton = document.createElement('button');
//     addButton.textContent = 'Добавить в список';
//     addButton.addEventListener('click', () => {
//         if (selectedTermsData.length < 10 && !selectedTermsData.some(t => t.id === term.id)) {
//             selectedTermsData.push(term);
//             updateSelectedTerms();
//         }
//     });
//     const buttonContainer = document.createElement('div');
//     buttonContainer.classList.add('term-buttons');
//     buttonContainer.appendChild(button);
//     buttonContainer.appendChild(addButton);

//     li.appendChild(buttonContainer);
//     return li;
// }

// // Организация терминов по первой букве
// function organizeTermsByLetter(terms) {
//     const termsByLetter = {};

//     terms.forEach(term => {
//         // const firstLetter = term.Термин[0].toUpperCase();
//         const firstLetter = term.term[0].toUpperCase();

//         if (!termsByLetter[firstLetter]) {
//             termsByLetter[firstLetter] = [];
//         }
//         termsByLetter[firstLetter].push(term);
//     });

//     Object.keys(termsByLetter).sort().forEach(letter => {
//         const section = document.createElement('section');
//         const heading = document.createElement('h2');
//         heading.textContent = letter;
//         section.appendChild(heading);

//         const list = document.createElement('ul');
//         termsByLetter[letter].forEach(term => {
//             const li = addTermToList(term);
//             list.appendChild(li);
//         });
//         section.appendChild(list);
//         termList.appendChild(section);
//     });
// }

// // Поиск терминов

// searchInput.addEventListener('input', function() {
//     const query = searchInput.value;
//     fetch(`/search?q=${encodeURIComponent(query)}`)
//         .then(response => response.json())
//         .then(data => {
//             termList.innerHTML = '';
//             organizeTermsByLetter(data);
//         });
// });

// function updateSelectedTerms() {
//     selectedTerms.innerHTML = '';
//     selectedTermsData.forEach(term => {
//         const li = document.createElement('li');
//         // li.textContent = term.Термин;
//         li.textContent = term.term;

//         const removeButton = document.createElement('button');
//         removeButton.textContent = 'Удалить';
//         removeButton.addEventListener('click', () => {
//             selectedTermsData = selectedTermsData.filter(t => t.id !== term.id);
//             updateSelectedTerms();
//         });

//         li.appendChild(removeButton);
//         selectedTerms.appendChild(li);
//     });
// }

// // Скачать DOCX
// downloadDocxButton.addEventListener('click', () => {
//     if (selectedTermsData.length === 0) {
//         alert('Вы не выбрали ни одного термина!');
//         return;
//     }
    
//     fetch('/download', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(selectedTermsData)
//     })
//     .then(response => response.blob())
//     .then(blob => {
//         const link = document.createElement('a');
//         link.href = URL.createObjectURL(blob);
//         link.download = 'термины.docx';
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     })
//     .catch(error => alert(`Ошибка: ${error.message}`));
// });

// // Кнопка "Вернуться вверх"
// backToTopButton.addEventListener('click', () => {
//     window.scrollTo({ top: 0, behavior: 'smooth' });
// });

//         document.getElementById('feedbackButton').addEventListener('click', () => {
//             document.getElementById('feedbackFormContainer').classList.remove('hidden');
//         });

//         document.getElementById('closeFeedbackForm').addEventListener('click', () => {
//             document.getElementById('feedbackFormContainer').classList.add('hidden');
//         });

//         document.getElementById('sendFeedback').addEventListener('click', async () => {
//             const message = document.getElementById('feedbackMessage').value.trim();
//             if (!message) {
//                 alert('Введите сообщение!');
//                 return;
//             }

//             const response = await fetch('/feedback', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ message })
//             });

//             if (response.ok) {
//                 alert('Сообщение отправлено!');
//                 document.getElementById('feedbackMessage').value = '';
//                 document.getElementById('feedbackFormContainer').classList.add('hidden');
//             } else {
//                 alert('Ошибка отправки сообщения');
//             }
//         });

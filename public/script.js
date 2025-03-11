const searchInput = document.getElementById('searchInput');
const termList = document.getElementById('termList');
const termTitle = document.getElementById('termTitle');
const termDefinition = document.getElementById('termDefinition');
const termGost = document.getElementById('termGost');

searchInput.addEventListener('input', function() {
    const query = searchInput.value;
    if (query.length > 2) {
        fetch(`/search?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                termList.innerHTML = '';
                data.forEach(term => {
                    const li = document.createElement('li');
                    li.textContent = term.Термин;
                    li.addEventListener('click', () => {
                        fetch(`/term/${encodeURIComponent(term.Термин)}`)
                            .then(response => response.json())
                            .then(termData => {
                                termTitle.textContent = termData.Термин;
                                termDefinition.textContent = termData.Определение;
                                termGost.textContent = termData.ГОСТ ? `ГОСТ: ${termData.ГОСТ}` : '';
                            });
                    });
                    termList.appendChild(li);
                });
            });
    } else {
        termList.innerHTML = '';
    }
});
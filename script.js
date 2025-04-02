// Inicialização dos gráficos
const ctx1 = document.getElementById('graficoNivelConceitual').getContext('2d');
const ctx2 = document.getElementById('graficoDisponibilidade').getContext('2d');

const graficoNivelConceitual = new Chart(ctx1, {
    type: 'bar',
    data: {
        labels: ['Pré Silábico', 'Silábico sem valor', 'Silábico com valor', 'Silábico alfabético'],
        datasets: [{
            label: 'Quantidade de Alunos',
            data: [0, 0, 0, 0],
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    }
});

const graficoDisponibilidade = new Chart(ctx2, {
    type: 'bar',
    data: {
        labels: ['Pouco Interesse', 'Requer Ajuda', 'Requer Ajuda e Atenção', 'Autonomia e Interesse'],
        datasets: [{
            label: 'Quantidade de Alunos',
            data: [0, 0, 0, 0],
            backgroundColor: [
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)',
                'rgba(255, 99, 132, 0.7)',
                'rgba(75, 192, 192, 0.7)'
            ],
            borderColor: [
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    }
});

// Função para atualizar os gráficos
function updateCharts() {
    const table = document.getElementById('tabelaSondagem');
    const nivelConceitualData = [0, 0, 0, 0];
    const disponibilidadeData = [0, 0, 0, 0];

    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        
        if (row.cells[2].querySelector('input').checked) nivelConceitualData[0]++;
        if (row.cells[3].querySelector('input').checked) nivelConceitualData[1]++;
        if (row.cells[4].querySelector('input').checked) nivelConceitualData[2]++;
        if (row.cells[5].querySelector('input').checked) nivelConceitualData[3]++;
        
        if (row.cells[6].querySelector('input').checked) disponibilidadeData[0]++;
        if (row.cells[7].querySelector('input').checked) disponibilidadeData[1]++;
        if (row.cells[8].querySelector('input').checked) disponibilidadeData[2]++;
        if (row.cells[9].querySelector('input').checked) disponibilidadeData[3]++;
    }

    graficoNivelConceitual.data.datasets[0].data = nivelConceitualData;
    graficoDisponibilidade.data.datasets[0].data = disponibilidadeData;
    graficoNivelConceitual.update();
    graficoDisponibilidade.update();
}

// Adicionar aluno ao pressionar Enter
document.getElementById('nomeAluno').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const nomeAluno = this.value.trim();
        if (nomeAluno) {
            document.getElementById('addButton').click();
        } else {
            alert('Por favor, insira o nome do aluno.');
        }
    }
});

// Adicionar novo aluno
document.getElementById('addButton').addEventListener('click', function() {
    const nomeAluno = document.getElementById('nomeAluno').value.trim();
    if (!nomeAluno) {
        alert('Por favor, insira o nome do aluno.');
        return;
    }

    const tableBody = document.querySelector("#tabelaSondagem tbody");
    const row = tableBody.insertRow();
    const rowIndex = tableBody.rows.length;
    row.insertCell(0).innerText = rowIndex;
    const nomeCell = row.insertCell(1);
    nomeCell.innerText = nomeAluno;
    nomeCell.style.textAlign = 'left';

    for (let i = 2; i <= 9; i++) {
        const cell = row.insertCell(i);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input';
        checkbox.addEventListener('change', updateCharts);
        cell.appendChild(checkbox);
    }

    const cellAcoes = row.insertCell(10);
    const btnExcluir = document.createElement('button');
    btnExcluir.className = 'btn btn-danger btn-sm btn-excluir';
    btnExcluir.innerHTML = 'Excluir';
    btnExcluir.addEventListener('click', function() {
        if (confirm(`Deseja realmente excluir o aluno ${nomeAluno}?`)) {
            row.remove();
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach((row, index) => {
                row.cells[0].innerText = index + 1;
            });
            updateCharts();
        }
    });
    cellAcoes.appendChild(btnExcluir);

    document.getElementById('nomeAluno').value = '';
    updateCharts();
});

// Exportar para XML
function exportTableToXML() {
    const table = document.getElementById('tabelaSondagem');
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<alunos>\n';

    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        xml += '  <aluno>\n';
        xml += `    <id>${row.cells[0].innerText}</id>\n`;
        xml += `    <nome>${row.cells[1].innerText}</nome>\n`;

        const columnNames = [
            'pré_silábico', 'silábico_sem_valor_sonoro', 'silábico_com_valor_sonoro', 
            'silábico_alfabético', 'pouco_interesse', 'requer_ajuda', 
            'requer_ajuda_e_atencão', 'autonomia_e_interesse'
        ];

        for (let j = 0; j < columnNames.length; j++) {
            xml += `    <${columnNames[j]}>${row.cells[j+2].querySelector('input').checked ? 'true' : 'false'}</${columnNames[j]}>\n`;
        }
        xml += '  </aluno>\n';
    }
    xml += '</alunos>';

    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sondagem_alunos.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Importar de XML
function importXML() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    if (!file) {
        alert('Por favor, selecione um arquivo XML para importar.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(event.target.result, "text/xml");
            const alunos = xmlDoc.getElementsByTagName("aluno");

            const tableBody = document.querySelector("#tabelaSondagem tbody");
            tableBody.innerHTML = '';

            for (let i = 0; i < alunos.length; i++) {
                const aluno = alunos[i];
                const nome = aluno.getElementsByTagName("nome")[0]?.textContent || '';
                
                document.getElementById('nomeAluno').value = nome;
                document.getElementById('addButton').click();
                
                const row = tableBody.rows[tableBody.rows.length - 1];
                
                const columnNames = [
                    'pré_silábico', 'silábico_sem_valor_sonoro', 'silábico_com_valor_sonoro', 
                    'silábico_alfabético', 'pouco_interesse', 'requer_ajuda', 
                    'requer_ajuda_e_atencão', 'autonomia_e_interesse'
                ];

                for (let j = 0; j < columnNames.length; j++) {
                    const field = aluno.getElementsByTagName(columnNames[j])[0];
                    if (field) {
                        row.cells[j+2].querySelector('input').checked = field.textContent === 'true';
                    }
                }
            }

            updateCharts();
            alert('Dados importados com sucesso!');
        } catch (error) {
            alert('Erro ao importar o arquivo XML: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Event listeners para botões
document.getElementById('exportButton').addEventListener('click', exportTableToXML);
document.getElementById('importButton').addEventListener('click', importXML);
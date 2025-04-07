// Variáveis globais
let categorias = {
    "Nível Conceitual": ["Pré-Silábico", "Silábico S/ Valor", "Silábico C/ Valor", "Silábico Alfabético", "Alfabético"],
    "Repertório de Letras": ["Apenas do Nome", "Apenas Vogais", "Apenas Consoantes", "Repertório Vasto"],
    "Disponibilidade para Escrever": ["Pouco Interesse", "Requer Ajuda", "Requer Atenção", "Autonomia e Interesse"]
};

let dados = {};
Object.values(categorias).flat().forEach(cat => dados[cat] = 0);

let contador = 1;
let graficos = {};

// Funções principais
function adicionarAluno() {
    let nomeInput = document.getElementById("nomeAluno");
    let nome = nomeInput.value.trim();
    if (nome === "") return;

    let tabela = document.getElementById("tabelaAlunos").querySelector("tbody");
    let novaLinha = tabela.insertRow();

    let colunas = [...categorias["Nível Conceitual"], ...categorias["Repertório de Letras"], ...categorias["Disponibilidade para Escrever"]];

    novaLinha.innerHTML = `<td>${contador++}</td><td>${nome}</td>` +
        colunas.map(categoria => `<td><input type="checkbox" class="nivel-checkbox" data-nivel="${categoria}"></td>`).join("");

    nomeInput.value = "";
    atualizarEventosCheckbox();
    nomeInput.focus();
}

function atualizarEventosCheckbox() {
    document.querySelectorAll(".nivel-checkbox").forEach(checkbox => {
        checkbox.removeEventListener("change", checkboxEventListener);
        checkbox.addEventListener("change", checkboxEventListener);
    });
}

function checkboxEventListener() {
    let nivel = this.dataset.nivel;
    this.checked ? dados[nivel]++ : dados[nivel]--;

    for (let categoria in graficos) {
        if (categorias[categoria].includes(nivel)) {
            graficos[categoria].data.datasets[0].data = categorias[categoria].map(l => dados[l]);
            graficos[categoria].update();
        }
    }
}

function criarGrafico(canvasId, labels) {
    let ctx = document.getElementById(canvasId).getContext("2d");
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: labels.map(l => dados[l]),
                backgroundColor: ["#ff0000", "#f4a500", "#ffee00", "#9be56d", "#4285F4", "#43d36c", "#F4A142", "#A142F4"]
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom' },
                datalabels: {
                    color: '#000',
                    font: { weight: 'bold', size: 14 },
                    formatter: (value) => value > 0 ? value : ''
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Evento de exportação

function exportarXML() {
    const linhas = document.querySelectorAll("#tabelaAlunos tbody tr");
    if (linhas.length === 0) {
        alert("Nenhum aluno para exportar.");
        return;
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<alunos>\n`;

    linhas.forEach(linha => {
        const colunas = linha.querySelectorAll("td");
        const nome = colunas[1].textContent;
        
        // Obtém TODOS os checkboxes (incluindo os que podem estar faltando)
        const checkboxes = Array.from(linha.querySelectorAll("input[type='checkbox']"));

        xml += `  <aluno>\n    <nome>${escapeXML(nome)}</nome>\n`;

        // Garante que todas as categorias definidas sejam exportadas
        const todasCategorias = [
            ...categorias["Nível Conceitual"],
            ...categorias["Repertório de Letras"],
            ...categorias["Disponibilidade para Escrever"]
        ];

        todasCategorias.forEach(categoria => {
            // Encontra o checkbox correspondente na linha
            const checkbox = checkboxes.find(cb => cb.dataset.nivel === categoria);
            const checked = checkbox ? checkbox.checked : false;
            
            const tag = formatarTagXML(categoria);
            xml += `    <${tag}>${checked}</${tag}>\n`;
        });

        xml += `  </aluno>\n`;
    });

    xml += `</alunos>`;

    // Restante do código para download...
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "alunos_sondagem.xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Função auxiliar para formatar tags XML corretamente
function formatarTagXML(categoria) {
    return categoria
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/\s+/g, '_')
        .replace(/[\/()]/g, '_')
        .replace(/_+/g, '_')
        .replace(/_$/, '');
}

// Função escapeXML permanece a mesma
function escapeXML(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
}

// Evento de importação
document.getElementById("importarXML").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, "application/xml");

            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                throw new Error("Erro na análise do XML");
            }

            document.querySelector("#tabelaAlunos tbody").innerHTML = "";
            contador = 1;
            Object.keys(dados).forEach(key => dados[key] = 0);

            const alunos = xmlDoc.getElementsByTagName("aluno");
            if (alunos.length === 0) {
                alert("Nenhum aluno encontrado no XML.");
                return;
            }

            // Mapeamento especial para tags problemáticas
            const tagMapping = {
                "Silabico_S_Valor": "Silábico S/ Valor",
                "Silabico_C_Valor": "Silábico C/ Valor",
                "Silabico_Alfabetico": "Silábico Alfabético",
                "Pre-Silabico": "Pré-Silábico",
                "Alfabetico": "Alfabético",
                "Repertorio_Vasto": "Repertório Vasto",
                "Requer_Atencao": "Requer Atenção"
            };

            for (let aluno of alunos) {
                const nome = aluno.getElementsByTagName("nome")[0]?.textContent;
                if (!nome) continue;

                const novaLinha = document.querySelector("#tabelaAlunos tbody").insertRow();
                novaLinha.innerHTML = `<td>${contador++}</td><td>${nome}</td>`;

                const todasCategorias = [
                    ...categorias["Nível Conceitual"],
                    ...categorias["Repertório de Letras"],
                    ...categorias["Disponibilidade para Escrever"]
                ];

                todasCategorias.forEach((categoria) => {
                    const cell = novaLinha.insertCell();
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.className = "nivel-checkbox";
                    checkbox.dataset.nivel = categoria;

                    // Encontra o nome da tag no XML (com mapeamento especial)
                    let tagProcurada = categoria;
                    
                    // Verifica se há um mapeamento especial para esta categoria
                    for (const [xmlTag, mappedCat] of Object.entries(tagMapping)) {
                        if (mappedCat === categoria) {
                            tagProcurada = xmlTag;
                            break;
                        }
                    }

                    // Converte para o formato do XML (sem acentos, com underscores)
                    tagProcurada = tagProcurada
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        .replace(/\s+/g, '_')
                        .replace(/[\/()]/g, '_');

                    // Procura a tag no XML
                    let marcado = false;
                    for (let node of aluno.children) {
                        if (node.nodeName.toLowerCase() === tagProcurada.toLowerCase()) {
                            marcado = node.textContent === "true";
                            break;
                        }
                    }

                    checkbox.checked = marcado;
                    if (marcado) {
                        dados[categoria]++;
                    }
                    
                    cell.appendChild(checkbox);
                });
            }

            atualizarEventosCheckbox();
            atualizarTodosGraficos();

        } catch (error) {
            console.error("Erro na importação:", error);
            alert("Erro ao importar XML: " + error.message);
        }
    };
    reader.readAsText(file);
});

function atualizarTodosGraficos() {
    for (let categoria in graficos) {
        graficos[categoria].data.datasets[0].data = categorias[categoria].map(l => dados[l]);
        graficos[categoria].update();
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    graficos["Nível Conceitual"] = criarGrafico("graficoNiveis", categorias["Nível Conceitual"]);
    graficos["Repertório de Letras"] = criarGrafico("graficoRepertorio", categorias["Repertório de Letras"]);
    graficos["Disponibilidade para Escrever"] = criarGrafico("graficoDisponibilidade", categorias["Disponibilidade para Escrever"]);

    document.getElementById("nomeAluno").focus();

    document.getElementById("nomeAluno").addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            adicionarAluno();
        }
    });
});
// Mapeamento das planilhas disponíveis
const planilhas = {
  meusBairros: 'https://docs.google.com/spreadsheets/d/1Uvteq5WLaW_SWD0V7OuV81pQIM0naKjaa0Gu3BFM3rY/export?format=csv&gid=1032123068'
};

// Variável global para armazenar os dados
let dados = [];

// Função que carrega a planilha selecionada
function carregarPlanilha() {
  const tipo = document.getElementById('planilhaSelect').value;
  const url = planilhas[tipo];
  fetchPlanilha(url);
}

// Função que busca e processa os dados da planilha
function fetchPlanilha(url) {
  fetch(url)
    .then(response => response.text())
    .then(csv => {
      const linhas = csv.split('\n').map(l => l.split(','));
      const cabecalho = linhas[0];
      dados = linhas.slice(1).map(linha => {
        const obj = {};
        cabecalho.forEach((coluna, i) => {
          obj[coluna.trim()] = linha[i]?.trim();
        });
        return obj;
      });

      preencherSelectBairros();
    });
}

// Função que preenche o seletor de bairros
function preencherSelectBairros() {
  const bairros = [...new Set(dados.map(item => item['BAIRRO']))];
  const select = document.getElementById('bairroSelect');
  select.innerHTML = '<option value="">-- Escolha um bairro --</option>';
  bairros.forEach(bairro => {
    if (bairro) {
      const option = document.createElement('option');
      option.value = bairro;
      option.textContent = bairro;
      select.appendChild(option);
    }
  });
}

// Função que filtra os dados por bairro e exibe na tabela
function filtrarPorBairro() {
  const bairroSelecionado = document.getElementById('bairroSelect').value;
  const tabela = document.getElementById('tabela-dados');
  tabela.innerHTML = '';

  const filtrados = dados.filter(item => item['BAIRRO'] === bairroSelecionado);

  filtrados.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item['BAIRRO']}</td>
      <td>${item['CÓDIGO']}</td>
      <td>${item['ANO']}</td>
      <td>${item['LIRA 1 QT']}</td>
      <td>${item['LIRA 2 QT']}</td>
      <td>${item['LIRA 3 QT']}</td>
      <td>${item['LIRA 4 QT']}</td>
      <td>${item['IIP 1 LIRAa']}</td>
      <td>${item['IIP 2 LIRAa']}</td>
      <td>${item['IIP 3 LIRAa']}</td>
      <td>${item['IIP 4 LIRAa']}</td>
    `;
    tabela.appendChild(tr);
  });
}


// 2. Depois, chamar no window.onload
window.onload = () => {
  fetchPlanilha(planilhas.meusBairros);
};
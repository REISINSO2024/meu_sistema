// Mapeamento das planilhas disponíveis e URLs
const planilhas = {
  meusBairros: 'https://docs.google.com/spreadsheets/d/1Uvteq5WLaW_SWD0V7OuV81pQIM0naKjaa0Gu3BFM3rY/export?format=csv&gid=1032123068',
  indicadores: 'https://docs.google.com/spreadsheets/d/1UCXA6OSjfmoHWPp_OUMIZpHHWKK7eL-Ywqg-yLsMOFs/export?format=csv&gid=1242024225'
};

// Variáveis para elementos do DOM
const planilhaSelect = document.getElementById('planilhaSelect');
const bairroSelect = document.getElementById('bairroSelect');
const tabelaDados = document.getElementById('tabela-dados');
const tabelaCabecalho = document.getElementById('tabela-cabecalho');

let dados = [];

// Função principal para carregar os dados da planilha
async function carregarPlanilha() {
  const tipo = planilhaSelect.value;
  const url = planilhas[tipo];

  if (!url) {
    console.error('URL da planilha não encontrada.');
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Falha ao carregar a planilha.');
    }
    const csv = await response.text();
    processarCSV(csv, tipo);
  } catch (error) {
    console.error('Erro ao carregar os dados:', error);
  }
}

// Processa o texto CSV e armazena os dados
function processarCSV(csv, tipo) {
  const linhas = csv.split('\n').map(l => l.split(','));
  const cabecalho = linhas[0].map(col => col.trim());
  dados = linhas.slice(1).map(linha => {
    const obj = {};
    cabecalho.forEach((coluna, i) => {
      obj[coluna] = linha[i] ? linha[i].trim() : '';
    });
    return obj;
  });

  if (tipo === 'meusBairros') {
    configurarMeusBairros();
  } else {
    configurarIndicadores();
  }
}

// Configura a interface e exibe dados para a planilha "Meus Bairros"
function configurarMeusBairros() {
  const cabecalhoMeusBairros = ['BAIRRO', 'CÓDIGO', 'ANO', 'LIRA 1 QT', 'LIRA 2 QT', 'LIRA 3 QT', 'LIRA 4 QT', 'IIP 1 LIRAa', 'IIP 2 LIRAa', 'IIP 3 LIRAa', 'IIP 4 LIRAa'];
  renderizarCabecalho(cabecalhoMeusBairros);

  // Popula o seletor de bairros
  const bairros = [...new Set(dados.map(item => item['BAIRRO']))].filter(bairro => bairro);
  bairroSelect.innerHTML = '<option value="">-- Escolha um bairro --</option>' + bairros.map(bairro => `<option value="${bairro}">${bairro}</option>`).join('');
  bairroSelect.style.display = 'inline-block'; // Mostra o seletor
  
  // Adiciona o evento para filtrar
  bairroSelect.addEventListener('change', filtrarPorBairro);
  
  // Exibe o primeiro item da lista se houver
  if (bairros.length > 0) {
      bairroSelect.value = bairros[0];
  }

  filtrarPorBairro();
}

// Configura a interface e exibe dados para a planilha "Indicadores"
function configurarIndicadores() {
  const cabecalhoIndicadores = ['REGIÃO', 'ÍNDICE', 'DATA', 'OBSERVAÇÃO'];
  renderizarCabecalho(cabecalhoIndicadores);
  bairroSelect.style.display = 'none'; // Esconde o seletor
  renderizarDados(dados);
}

// Filtra os dados da planilha "Meus Bairros"
function filtrarPorBairro() {
  const bairroSelecionado = bairroSelect.value;
  const dadosFiltrados = dados.filter(item => item['BAIRRO'] === bairroSelecionado);
  renderizarDados(dadosFiltrados);
}

// Renderiza o cabeçalho da tabela
function renderizarCabecalho(cabecalhoArray) {
  tabelaCabecalho.innerHTML = `<tr>${cabecalhoArray.map(col => `<th>${col}</th>`).join('')}</tr>`;
}

// Renderiza os dados na tabela
function renderizarDados(items) {
  tabelaDados.innerHTML = items.map(item => {
    const colunas = Object.values(item);
    return `<tr>${colunas.map(col => `<td>${col}</td>`).join('')}</tr>`;
  }).join('');
}

// Adiciona os event listeners
document.addEventListener('DOMContentLoaded', () => {
  planilhaSelect.addEventListener('change', carregarPlanilha);
  carregarPlanilha(); // Carrega a planilha inicial ao carregar a página
});
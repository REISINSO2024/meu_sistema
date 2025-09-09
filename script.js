// Mapeamento das planilhas e abas disponíveis
const planilhas = {
  meusBairros: 'https://docs.google.com/spreadsheets/d/1Uvteq5WLaW_SWD0V7OuV81pQIM0naKjaa0Gu3BFM3rY/export?format=csv&gid=1032123068',
  indicadores: 'https://docs.google.com/spreadsheets/d/1UCXA6OSjfmoHWPp_OUMIZpHHWKK7eL-Ywqg-yLsMOFs/export?format=csv&gid=1242024225',
  aba1: 'https://docs.google.com/spreadsheets/d/1I837qyKBeGs7EtNtfrmC7fhxvFC1VFVBh0fxw2lh4Mc/export?format=csv&gid=1658847410',
  aba2: 'https://docs.google.com/spreadsheets/d/1I837qyKBeGs7EtNtfrmC7fhxvFC1VFVBh0fxw2lh4Mc/export?format=csv&gid=1058423129',
  aba3: 'https://docs.google.com/spreadsheets/d/1I837qyKBeGs7EtNtfrmC7fhxvFC1VFVBh0fxw2lh4Mc/export?format=csv&gid=1243232255'
};

// Variáveis para elementos do DOM
const planilhaSelect = document.getElementById('planilhaSelect');
const bairroSelect = document.getElementById('bairroSelect');
const tabelaDados = document.getElementById('tabela-dados');
const tabelaCabecalho = document.getElementById('tabela-cabecalho');

let dados = [];
let cabecalho = [];

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

// Processa o texto CSV e armazena os dados de forma robusta
function processarCSV(csv, tipo) {
  // Ignora linhas vazias no final
  const linhas = csv.split('\n').filter(linha => linha.trim() !== '');
  
  // Se não houver dados, limpa a tabela e sai da função
  if (linhas.length <= 1) {
    tabelaCabecalho.innerHTML = '';
    tabelaDados.innerHTML = '<tr><td colspan="100%">Não há dados para exibir.</td></tr>';
    return;
  }

  // Pega o cabeçalho e garante que ele seja a referência
  cabecalho = linhas[0].split(',').map(col => col.trim().replace(/"/g, ''));
  
  dados = linhas.slice(1).map(linha => {
    // Usa uma regex para dividir as colunas, lidando com vírgulas dentro de aspas
    const colunas = linha.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    
    const obj = {};
    if (colunas) {
      cabecalho.forEach((coluna, i) => {
        // Remove aspas e espaços extras
        obj[coluna] = colunas[i] ? colunas[i].trim().replace(/"/g, '') : '';
      });
    }
    return obj;
  });

  renderizarCabecalho(cabecalho);

  if (tipo === 'meusBairros') {
    configurarMeusBairros();
  } else {
    configurarGeral();
  }
}

// Configura a interface e exibe dados para a planilha "Meus Bairros"
function configurarMeusBairros() {
  const bairros = [...new Set(dados.map(item => item['BAIRRO']))].filter(bairro => bairro);
  bairroSelect.innerHTML = '<option value="">-- Escolha um bairro --</option>' + bairros.map(bairro => `<option value="${bairro}">${bairro}</option>`).join('');
  bairroSelect.style.display = 'inline-block';
  
  bairroSelect.removeEventListener('change', filtrarPorBairro);
  bairroSelect.addEventListener('change', filtrarPorBairro);
  
  if (bairros.length > 0) {
      bairroSelect.value = bairros[0];
  }

  filtrarPorBairro();
}

// Configuração geral para outras planilhas
function configurarGeral() {
  bairroSelect.style.display = 'none';
  renderizarDados(dados);
}

// Filtra os dados da planilha "Meus Bairros"
function filtrarPorBairro() {
  const bairroSelecionado = bairroSelect.value;
  const dadosFiltrados = dados.filter(item => item['BAIRRO'] === bairroSelecionado);
  renderizarDados(dadosFiltrados);
}

// Renderiza o cabeçalho da tabela com base nos dados do CSV
function renderizarCabecalho(cabecalhoArray) {
  tabelaCabecalho.innerHTML = `<tr>${cabecalhoArray.map(col => `<th>${col}</th>`).join('')}</tr>`;
}

// Renderiza os dados na tabela
function renderizarDados(items) {
  tabelaDados.innerHTML = items.map(item => {
    const colunas = cabecalho.map(key => item[key]);
    return `<tr>${colunas.map(col => `<td>${col}</td>`).join('')}</tr>`;
  }).join('');
}

// Adiciona os event listeners
document.addEventListener('DOMContentLoaded', () => {
  planilhaSelect.addEventListener('change', carregarPlanilha);
  carregarPlanilha();
});


// =============================================
// SISTEMA DE ESTRATIFICAÇÃO - VERSÃO COMPLETA
// =============================================

// --- VARIÁVEIS GLOBAIS ---
let bairros = [];
let estado = {
    bairroSelecionado: null,
    quadrasDisponiveis: [],
    quadrasSelecionadas: new Set(),
  quadrasPositivas: new Set(), // ✅ novo
};

// --- ELEMENTOS DO DOM ---
const selectBairro = document.getElementById("bairro");
const resumoGeralDiv = document.getElementById("resumoGeral");
const listaQuadrasDiv = document.getElementById("listaQuadras");
const resumoProgramadosDiv = document.getElementById("resumoProgramados");
const entradaQuadras = document.getElementById("entradaQuadras");
const aplicarTextoBtn = document.getElementById("aplicarTexto");
const limparTudoBtn = document.getElementById("limparTudo");
const dadosDetalhesDiv = document.getElementById("dadosDetalhes");

// --- FUNÇÕES PRINCIPAIS ---

// 1. CARREGAR DADOS E PREENCHER BAIRROS
function carregarDados() {
    fetch('bairros_4ciclo_2025.json')
        .then(response => {
            if (!response.ok) throw new Error('Erro ao carregar dados');
            return response.json();
        })
        .then(data => {
            bairros = data;
            preencherListaBairros();
            console.log('Dados carregados:', bairros.length, 'registros');
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar dados. Verifique o console para detalhes.');
        });
}

// 2. PREENCHER LISTA DE BAIRROS
function preencherListaBairros() {
    if (!selectBairro) return;
    
    selectBairro.innerHTML = '<option value="">-- Escolha um bairro --</option>';
    
    const bairrosUnicos = [...new Set(bairros.map(item => item.BAIRRO))].sort();
    
    bairrosUnicos.forEach(bairro => {
        const option = document.createElement("option");
        option.value = bairro;
        option.textContent = bairro;
        selectBairro.appendChild(option);
    });
}

// 3. MONTAR RESUMO GERAL DO BAIRRO (COM TODOS OS DADOS)
function montarResumoGeral() {
    if (!resumoGeralDiv) return;

    const bairroNome = estado.bairroSelecionado;
    if (!bairroNome) {
        resumoGeralDiv.innerHTML = "";
        return;
    }

    const dadosBairro = bairros.filter(b => b.BAIRRO === bairroNome);

    if (dadosBairro.length === 0) {
        resumoGeralDiv.innerHTML = "<em>Nenhum dado encontrado para este bairro.</em>";
        return;
    }

    // 1) quadras únicas (string trimmed)
    const quadrasUnicas = [...new Set(dadosBairro.map(item => String(item.QT).trim()))];

    // 2) quadras ativas = existem e TOTAL > 0
    const quadrasAtivas = quadrasUnicas.filter(qt => {
        const row = dadosBairro.find(b => String(b.QT).trim() === qt);
        const total = Number(row?.TOTAL);
        return !isNaN(total) && total > 0;
    });

    // 3) totais (mantém sua função existente)
    const totais = calcularTotaisBairro(dadosBairro);
    const totalProgramados = (totais.TOTAL || 0) - (totais["AP. ACIMA DO TÉRREO"] || 0);

    resumoGeralDiv.innerHTML = `
        <div class="small"><strong>Bairro:</strong> ${bairroNome}</div>
        <span><strong>Total de Quadras (ativas):</strong> ${quadrasAtivas.length}</span>
        <span><strong>Total de Imóveis:</strong> ${totais.TOTAL}</span>
        <span><strong>Residências (R):</strong> ${totais.R}</span>
        <span><strong>Comércios (C):</strong> ${totais.C}</span>
        <span><strong>Terrenos Baldios (TB):</strong> ${totais.TB}</span>
        <span><strong>Outros (OU):</strong> ${totais.OU}</span>
        <span><strong>Pontos Estratégicos (PE):</strong> ${totais.PE}</span>
        <span><strong>Apartamentos Acima Térreo:</strong> ${totais["AP. ACIMA DO TÉRREO"] || 0}</span>
        <span><strong>Total de Habitantes:</strong> ${totais.HABITANTES}</span>
        <span><strong>🏠 Imóveis Programados:</strong> ${totalProgramados}</span>
        <span><strong>🐕 Cães:</strong> ${totais.CÃO}</span>
        <span><strong>🐈 Gatos:</strong> ${totais.GATO}</span>
    `;
}




// 4. CALCULAR TOTAIS COMPLETOS DO BAIRRO
function calcularTotaisBairro(dadosBairro) {
    const campos = [
        'R', 'C', 'TB', 'OU', 'PE', 'TOTAL', 'APARTAMENTO EXISTENTE',
        'APARTAMENTO NO TÉRREO', 'AP. ACIMA DO TÉRREO', 'HABITANTES',
        'TANQUE EXISTENTE', 'TANQUE PEIXADO', 'TAMBOR EXISTENTE', 'TAMBOR PEIXADO',
        'CISTERNA EXISTENTE', 'CISTERNA VEDADA', 'CISTERNA PEIXADA',
        'CACIMBA EXISTENTE', 'CACIMBA VEDADA', 'CACIMBA PEIXADA',
        "CAIXAS D'ÁGUA EXISTENTE", "CAIXAS D'ÁGUA NORMAL", "CAIXAS D'ÁGUA VEDADA",
        "CAIXAS D'ÁGUA ED. NORMAL", "CAIXAS D'ÁGUA ED. VEDADA",
        'FILTRO', 'VASO C/ PLANTA', 'POTE', 'TINA', 'CÃO', 'GATO'
    ];
    
    const totais = {};
    
    campos.forEach(campo => {
        totais[campo] = dadosBairro.reduce((total, item) => {
            let valor = item[campo];

            // Se for string numérica, converte
            if (typeof valor === "string") {
                valor = valor.trim();
                valor = valor === "" ? 0 : Number(valor);
            }

            // Se não for número válido, ignora (considera 0)
            if (isNaN(valor)) valor = 0;

            return total + valor;
        }, 0);
    });
    
    return totais;
}


// 5. MONTAR LISTA DE QUADRAS COM DETALHES
// === FUNÇÃO: MONTAR LISTA DE QUADRAS ===
function montarListaQuadras() {
    if (!listaQuadrasDiv) return;

    listaQuadrasDiv.innerHTML = "";

    if (!estado.bairroSelecionado) {
        listaQuadrasDiv.innerHTML = "<em>Selecione um bairro primeiro.</em>";
        return;
    }

 const dadosBairro = bairros.filter(b => b.BAIRRO === estado.bairroSelecionado);

// pega todas as quadras e aplica a ordenação pai/filho
const quadras = [...new Set(dadosBairro.map(item => item.QT))].sort((a, b) => {
    const [paiA, filhoA] = a.split("/").map(Number);
    const [paiB, filhoB] = b.split("/").map(Number);

    if (paiA !== paiB) return paiA - paiB;
    if (filhoA == null && filhoB != null) return -1;
    if (filhoA != null && filhoB == null) return 1;
    if (filhoA != null && filhoB != null) return filhoA - filhoB;
    return 0;
});

// quadras disponíveis = apenas as ativas (não extintas)
estado.quadrasDisponiveis = quadras.filter(q => {
    const dadosQuadra = dadosBairro.find(b => b.QT === q);
    return dadosQuadra && Number(dadosQuadra.TOTAL) > 0;
});


    estado.quadrasDisponiveis = quadras;

    if (quadras.length === 0) {
        listaQuadrasDiv.innerHTML = "<em>Nenhuma quadra encontrada.</em>";
        return;
    }

quadras.forEach(quadra => {
    const dadosQuadra = dadosBairro.find(b => b.QT === quadra);
    const somaTotal = Number(dadosQuadra?.TOTAL || 0);
    const isExtinta = somaTotal === 0;

    const wrapper = document.createElement("div");
    wrapper.className = "quadra-item";

    // === Checkbox de seleção normal ===
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = quadra;
    checkbox.id = `quadra-${quadra}`;

    if (isExtinta) {
        checkbox.disabled = true;
    } else {
        checkbox.checked = Array.from(estado.quadrasSelecionadas).includes(quadra);

        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                estado.quadrasSelecionadas.add(quadra);
            } else {
                estado.quadrasSelecionadas.delete(quadra);
                estado.quadrasPositivas.delete(quadra); // se desmarcar, remove também das positivas
            }
            atualizarProgramados();
            atualizarQuadrasSelecionadas();
            atualizarQuadrasPositivas();
        });
    }

    // === Checkbox de positiva ===
    const checkboxPositivo = document.createElement("input");
    checkboxPositivo.type = "checkbox";
    checkboxPositivo.value = quadra;
    checkboxPositivo.id = `positivo-${quadra}`;
    checkboxPositivo.style.marginLeft = "10px";

    // só pode marcar positiva se quadra está selecionada
    checkboxPositivo.disabled = !estado.quadrasSelecionadas.has(quadra);
    checkboxPositivo.checked = estado.quadrasPositivas.has(quadra);

    checkboxPositivo.addEventListener("change", () => {
        if (checkboxPositivo.checked) {
            estado.quadrasPositivas.add(quadra);
        } else {
            estado.quadrasPositivas.delete(quadra);
        }
        atualizarQuadrasPositivas();
    });

    // quando marcar quadra normal, habilita ou desabilita positiva
    checkbox.addEventListener("change", () => {
        checkboxPositivo.disabled = !checkbox.checked;
        if (!checkbox.checked) {
            checkboxPositivo.checked = false;
            estado.quadrasPositivas.delete(quadra);
            atualizarQuadrasPositivas();
        }
    });

    // === Label ===
    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.innerHTML = isExtinta
        ? `<span class="extinta">${quadra} (extinta)</span>`
        : `${quadra} - ${somaTotal} imóveis`;
    label.style.marginLeft = "8px";

    // monta linha
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    wrapper.appendChild(checkboxPositivo);
    listaQuadrasDiv.appendChild(wrapper);
});


}

// === FUNÇÃO: MOSTRAR APENAS QUADRAS SELECIONADAS ===
function atualizarQuadrasSelecionadas() {
    const textarea = document.getElementById("quadrasEstratificadas");
    const detalhesDiv = document.getElementById("dadosDetalhes");

    if (estado.quadrasSelecionadas.size === 0) {
        textarea.value = "";
        detalhesDiv.innerHTML = "";
        return;
    }

    // mantém só quadras válidas do bairro e que não sejam extintas
    const quadrasValidas = Array.from(estado.quadrasSelecionadas).filter(q => {
        const dados = bairros.find(b => b.BAIRRO === estado.bairroSelecionado && b.QT === q);
        return dados && Number(dados.TOTAL) > 0;
    });

    textarea.value = quadrasValidas.join(", ");
    detalhesDiv.innerHTML = "";
}



// 6. ATUALIZAR RESUMO DE PROGRAMADOS COMPLETO
function atualizarProgramados() {
    if (!resumoProgramadosDiv) return;
    
    if (!estado.bairroSelecionado || estado.quadrasSelecionadas.size === 0) {
        resumoProgramadosDiv.innerHTML = "<em>Selecione quadras para ver os programados.</em>";
        return;
    }
    
    const dadosBairro = bairros.filter(b => b.BAIRRO === estado.bairroSelecionado);
    const totais = calcularTotaisQuadrasSelecionadas(dadosBairro);
    const programados = totais.TOTAL - totais["AP. ACIMA DO TÉRREO"];
    
    resumoProgramadosDiv.innerHTML = `
        <span><strong>Quadras Selecionadas:</strong> ${estado.quadrasSelecionadas.size}</span>
        <span><strong>Total de Imóveis:</strong> ${totais.TOTAL}</span>
        <span><strong>Residências (R):</strong> ${totais.R}</span>
        <span><strong>Comércios (C):</strong> ${totais.C}</span>
        <span><strong>Terrenos Baldios (TB):</strong> ${totais.TB}</span>
        <span><strong>Outros (OU):</strong> ${totais.OU}</span>
        <span><strong>Pontos Estratégicos (PE):</strong> ${totais.PE}</span>
        <span><strong>Apartamentos Acima Térreo:</strong> ${totais["AP. ACIMA DO TÉRREO"]}</span>
        <span><strong>Total de Habitantes:</strong> ${totais.HABITANTES}</span>
        <span><strong>🏠 Imóveis Programados:</strong> ${programados}</span>
        <span><strong>🐕 Cães:</strong> ${totais.CÃO}</span>
        <span><strong>🐈 Gatos:</strong> ${totais.GATO}</span>
        <span><strong>💧 Depósitos de Água:</strong> ${totais["CAIXAS D'ÁGUA EXISTENTE"] + totais["TANQUE EXISTENTE"] + totais["TAMBOR EXISTENTE"] + totais["CISTERNA EXISTENTE"] + totais["CACIMBA EXISTENTE"]}</span>
    `;
}

// 7. CALCULAR TOTAIS DAS QUADRAS SELECIONADAS
function calcularTotaisQuadrasSelecionadas(dadosBairro) {
    const campos = [
        'R', 'C', 'TB', 'OU', 'PE', 'TOTAL', 'AP. ACIMA DO TÉRREO', 'HABITANTES',
        'TANQUE EXISTENTE', 'TAMBOR EXISTENTE', 'CISTERNA EXISTENTE', 'CACIMBA EXISTENTE',
        "CAIXAS D'ÁGUA EXISTENTE", 'CÃO', 'GATO'
    ];
    
    const totais = {};
    campos.forEach(campo => totais[campo] = 0);
    
    estado.quadrasSelecionadas.forEach(quadra => {
        const dadosQuadra = dadosBairro.find(b => b.QT === quadra);
        if (dadosQuadra) {
            campos.forEach(campo => {
                let valor = dadosQuadra[campo];

                if (typeof valor === "string") {
                    valor = valor.trim();
                    valor = valor === "" ? 0 : Number(valor);
                }

                if (isNaN(valor)) valor = 0;

                totais[campo] += valor;
            });
        }
    });
    
    return totais;
}
function atualizarQuadrasPositivas() {
    const textarea = document.getElementById("quadrasPositivas");
    textarea.value = Array.from(estado.quadrasPositivas).join(", ");
}

function limparTudo() {
    estado.bairroSelecionado = null;
    estado.quadrasSelecionadas.clear();
    estado.quadrasPositivas.clear(); // ✅ limpa positivas também

    // limpa campos da tela
    document.getElementById("quadrasEstratificadas").value = "";
    document.getElementById("quadrasPositivas").value = ""; // ✅ limpa textarea
    document.getElementById("dadosDetalhes").innerHTML = "";

    // atualiza telas
    montarListaQuadras();
    montarResumoGeral();
    atualizarProgramados();
}

// 8. MOSTRAR DETALHES DAS QUADRAS SELECIONADAS
function mostrarDetalhesQuadras() {
    if (!dadosDetalhesDiv) return;
    
    if (estado.quadrasSelecionadas.size === 0) {
        dadosDetalhesDiv.innerHTML = "";
        return;
    }
    
    const dadosBairro = bairros.filter(b => b.BAIRRO === estado.bairroSelecionado);
    let detalhes = "🟢 QUADRAS SELECIONADAS:\n\n";
    
    estado.quadrasSelecionadas.forEach(quadra => {
        const dados = dadosBairro.find(b => b.QT === quadra);
        if (dados) {
            detalhes += `📍 Quadra ${quadra}:\n`;
            detalhes += `   • Imóveis: ${dados.TOTAL}\n`;
            detalhes += `   • Habitantes: ${dados.HABITANTES}\n`;
            detalhes += `   • PE: ${dados.PE}\n`;
            detalhes += `   • Cães: ${dados.CÃO}, Gatos: ${dados.GATO}\n`;
            detalhes += `   • Depósitos água: ${dados["CAIXAS D'ÁGUA EXISTENTE"] + dados.TANQUE_EXISTENTE + dados.TAMBOR_EXISTENTE}\n\n`;
        }
    });
    
    dadosDetalhesDiv.innerHTML = detalhes;
}

// 9. INTERPRETAR ENTRADA DE TEXTO PARA QUADRAS
// === FUNÇÃO: INTERPRETAR ENTRADA DE TEXTO PARA QUADRAS ===
function interpretarEntrada(texto) {
    const partes = texto.split(/[\s,;]+/).filter(Boolean);
    const selecionadas = new Set();

    partes.forEach(parte => {
        if (/^\d+-\d+$/.test(parte)) {
            // intervalo de quadras (ex: 1-10)
            const [inicio, fim] = parte.split("-").map(Number);
            if (!isNaN(inicio) && !isNaN(fim)) {
                for (let i = inicio; i <= fim; i++) {
                    selecionadas.add(String(i));
                    // também adiciona filhos se existirem
                    estado.quadrasDisponiveis.forEach(q => {
                        if (q.startsWith(i + "/")) {
                            selecionadas.add(q);
                        }
                    });
                }
            }
        } else {
            // quadra única
            selecionadas.add(parte);
            // também adiciona filhos se existirem
            estado.quadrasDisponiveis.forEach(q => {
                if (q.startsWith(parte + "/")) {
                    selecionadas.add(q);
                }
            });
        }
    });

    return selecionadas;
}


// 10. LIMPAR TUDO
function limparTudo() {
    estado.bairroSelecionado = null;
    estado.quadrasSelecionadas.clear();
    estado.quadrasDisponiveis = [];
    
    if (selectBairro) selectBairro.value = "";
    if (entradaQuadras) entradaQuadras.value = "";
    if (resumoGeralDiv) resumoGeralDiv.innerHTML = "";
    if (listaQuadrasDiv) listaQuadrasDiv.innerHTML = "";
    if (resumoProgramadosDiv) resumoProgramadosDiv.innerHTML = "<em>Selecione quadras para ver os programados.</em>";
    if (dadosDetalhesDiv) dadosDetalhesDiv.innerHTML = "";
}

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", function() {
    console.log("Sistema de estratificação inicializando...");

 carregarDados();

if (selectBairro) {
    selectBairro.addEventListener("change", function() {
        estado.bairroSelecionado = this.value;
        estado.quadrasSelecionadas.clear();

        montarResumoGeral();          // ✅ atualiza o painel de resumo
        montarListaQuadras();
        atualizarProgramados();
        atualizarQuadrasSelecionadas(); // ✅ só mostra a numeração
    });
}

if (aplicarTextoBtn && entradaQuadras) {
    aplicarTextoBtn.addEventListener("click", function() {
        if (!estado.bairroSelecionado) {
            alert("Selecione um bairro primeiro!");
            return;
        }

        const texto = entradaQuadras.value;
        const quadrasSelecionadas = interpretarEntrada(texto);

        estado.quadrasSelecionadas = quadrasSelecionadas;
        montarListaQuadras();
        atualizarProgramados();
        atualizarQuadrasSelecionadas(); // ✅ só mostra a numeração
    });
}

if (limparTudoBtn) {
    limparTudoBtn.addEventListener("click", limparTudo);
}

console.log("Sistema inicializado com sucesso!");
}); // ✅ fechamento do DOMContentLoaded






















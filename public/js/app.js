// Configurações da API
const API_BASE_URL = 'http://localhost:3000/api';

// Estado da aplicação
let currentTab = 'funcionarios';
let funcionarios = [];
let objetos = [];
let emprestimos = [];

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Carregar dados iniciais
        await loadFuncionarios();
        await loadObjetos();
        await loadEmprestimos();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Configurar data mínima para empréstimos (hoje)
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('emprestimo-data-devolucao').min = today;
        
        showAlert('Sistema carregado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        showAlert('Erro ao carregar o sistema. Verifique se o servidor está rodando.', 'error');
    }
}

function setupEventListeners() {
    // Formulários
    document.getElementById('funcionario-form-element').addEventListener('submit', handleFuncionarioSubmit);
    document.getElementById('objeto-form-element').addEventListener('submit', handleObjetoSubmit);
    document.getElementById('emprestimo-form-element').addEventListener('submit', handleEmprestimoSubmit);
    
    // Busca em tempo real
    document.getElementById('funcionario-search').addEventListener('input', debounce(searchFuncionarios, 300));
    document.getElementById('objeto-search').addEventListener('input', debounce(searchObjetos, 300));
}

// Utilitário para debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Gerenciamento de abas
function showTab(tabName) {
    // Remover classe active de todas as abas
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Ativar aba selecionada
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    currentTab = tabName;
    
    // Carregar dados específicos da aba
    if (tabName === 'relatorios') {
        loadRelatorios();
    }
}

// Gerenciamento de tema
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = 'Modo Escuro';
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'Modo Claro';
        localStorage.setItem('theme', 'dark');
    }
}

// Carregar tema salvo
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        toggleTheme();
    }
}

// Sistema de alertas
function showAlert(message, type = 'info', duration = 5000) {
    const alertContainer = document.getElementById('alert-container');
    const alertId = 'alert-' + Date.now();
    
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} fade-in">
            <i class="fas fa-${getAlertIcon(type)}"></i>
            ${message}
            <button onclick="closeAlert('${alertId}')" style="float: right; background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    
    // Auto-remover após duração especificada
    if (duration > 0) {
        setTimeout(() => closeAlert(alertId), duration);
    }
}

function getAlertIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function closeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.remove();
    }
}

// ===== FUNCIONÁRIOS =====

async function loadFuncionarios() {
    try {
        const response = await fetch(`${API_BASE_URL}/funcionarios`);
        if (!response.ok) throw new Error('Erro ao carregar funcionários');
        
        funcionarios = await response.json();
        renderFuncionarios(funcionarios);
        updateEmprestimoFuncionarioSelect();
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
        showAlert('Erro ao carregar funcionários', 'error');
    }
}

function renderFuncionarios(funcionariosList) {
    const tbody = document.getElementById('funcionarios-list');
    
    if (funcionariosList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum funcionário encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = funcionariosList.map(funcionario => `
        <tr>
            <td>${funcionario.nome}</td>
            <td>${funcionario.matricula}</td>
            <td>${funcionario.email || '-'}</td>
            <td>${funcionario.telefone || '-'}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editFuncionario(${funcionario.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteFuncionario(${funcionario.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showFuncionarioForm() {
    document.getElementById('funcionario-form').classList.remove('hidden');
    document.getElementById('funcionario-form-title').textContent = 'Cadastrar Funcionário';
    document.getElementById('funcionario-form-element').reset();
    document.getElementById('funcionario-id').value = '';
}

function cancelFuncionarioForm() {
    document.getElementById('funcionario-form').classList.add('hidden');
    document.getElementById('funcionario-form-element').reset();
}

async function handleFuncionarioSubmit(event) {
    event.preventDefault();
    
    const formData = {
        nome: document.getElementById('funcionario-nome').value,
        matricula: document.getElementById('funcionario-matricula').value,
        email: document.getElementById('funcionario-email').value,
        telefone: document.getElementById('funcionario-telefone').value
    };
    
    const funcionarioId = document.getElementById('funcionario-id').value;
    
    try {
        let response;
        if (funcionarioId) {
            // Atualizar funcionário existente
            response = await fetch(`${API_BASE_URL}/funcionarios/${funcionarioId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            // Criar novo funcionário
            response = await fetch(`${API_BASE_URL}/funcionarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao salvar funcionário');
        }
        
        showAlert(funcionarioId ? 'Funcionário atualizado com sucesso!' : 'Funcionário cadastrado com sucesso!', 'success');
        cancelFuncionarioForm();
        await loadFuncionarios();
        
    } catch (error) {
        console.error('Erro ao salvar funcionário:', error);
        showAlert(error.message, 'error');
    }
}

async function editFuncionario(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/funcionarios/${id}`);
        if (!response.ok) throw new Error('Erro ao carregar funcionário');
        
        const funcionario = await response.json();
        
        document.getElementById('funcionario-id').value = funcionario.id;
        document.getElementById('funcionario-nome').value = funcionario.nome;
        document.getElementById('funcionario-matricula').value = funcionario.matricula;
        document.getElementById('funcionario-email').value = funcionario.email || '';
        document.getElementById('funcionario-telefone').value = funcionario.telefone || '';
        
        document.getElementById('funcionario-form-title').textContent = 'Editar Funcionário';
        document.getElementById('funcionario-form').classList.remove('hidden');
        
    } catch (error) {
        console.error('Erro ao carregar funcionário:', error);
        showAlert('Erro ao carregar dados do funcionário', 'error');
    }
}

async function deleteFuncionario(id) {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/funcionarios/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erro ao excluir funcionário');
        
        showAlert('Funcionário excluído com sucesso!', 'success');
        await loadFuncionarios();
        
    } catch (error) {
        console.error('Erro ao excluir funcionário:', error);
        showAlert('Erro ao excluir funcionário', 'error');
    }
}

function searchFuncionarios() {
    const searchTerm = document.getElementById('funcionario-search').value.toLowerCase();
    
    if (!searchTerm) {
        renderFuncionarios(funcionarios);
        return;
    }
    
    const filtered = funcionarios.filter(funcionario => 
        funcionario.nome.toLowerCase().includes(searchTerm) ||
        funcionario.matricula.toLowerCase().includes(searchTerm) ||
        (funcionario.email && funcionario.email.toLowerCase().includes(searchTerm))
    );
    
    renderFuncionarios(filtered);
}

// ===== OBJETOS =====

async function loadObjetos() {
    try {
        const response = await fetch(`${API_BASE_URL}/objetos`);
        if (!response.ok) throw new Error('Erro ao carregar objetos');
        
        objetos = await response.json();
        renderObjetos(objetos);
        updateEmprestimoObjetoSelect();
    } catch (error) {
        console.error('Erro ao carregar objetos:', error);
        showAlert('Erro ao carregar objetos', 'error');
    }
}

function renderObjetos(objetosList) {
    const tbody = document.getElementById('objetos-list');
    
    if (objetosList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum objeto encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = objetosList.map(objeto => `
        <tr>
            <td>${objeto.nome}</td>
            <td>${objeto.codigo}</td>
            <td>${objeto.categoria || '-'}</td>
            <td><span class="status-badge">${formatTipoEquipamento(objeto.tipo_equipamento)}</span></td>
            <td>${objeto.etiqueta || '-'}</td>
            <td><span class="status-badge">${formatCondicao(objeto.condicao)}</span></td>
            <td><span class="status-badge status-${objeto.status}">${formatStatus(objeto.status)}</span></td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editObjeto(${objeto.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteObjeto(${objeto.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function formatTipoEquipamento(tipo) {
    const tipos = {
        'fixo': 'Fixo',
        'movel': 'Móvel'
    };
    return tipos[tipo] || tipo;
}

function formatCondicao(condicao) {
    const condicoes = {
        'funcionando_com_controle': 'Func. c/ Controle',
        'funcionando_sem_controle': 'Func. s/ Controle',
        'manutencao': 'Manutenção',
        'danificado': 'Danificado',
        'perdido': 'Perdido'
    };
    return condicoes[condicao] || condicao;
}

function formatStatus(status) {
    const statuses = {
        'disponivel': 'Disponível',
        'emprestado': 'Emprestado',
        'manutencao': 'Manutenção',
        'perdido': 'Perdido'
    };
    return statuses[status] || status;
}

function showObjetoForm() {
    document.getElementById('objeto-form').classList.remove('hidden');
    document.getElementById('objeto-form-title').textContent = 'Cadastrar Objeto';
    document.getElementById('objeto-form-element').reset();
    document.getElementById('objeto-id').value = '';
}

function cancelObjetoForm() {
    document.getElementById('objeto-form').classList.add('hidden');
    document.getElementById('objeto-form-element').reset();
}

async function handleObjetoSubmit(event) {
    event.preventDefault();
    
    const formData = {
        nome: document.getElementById('objeto-nome').value,
        codigo: document.getElementById('objeto-codigo').value,
        categoria: document.getElementById('objeto-categoria').value,
        descricao: document.getElementById('objeto-descricao').value,
        tipo_equipamento: document.getElementById('objeto-tipo').value,
        etiqueta: document.getElementById('objeto-etiqueta').value,
        condicao: document.getElementById('objeto-condicao').value
    };
    
    const objetoId = document.getElementById('objeto-id').value;
    
    try {
        let response;
        if (objetoId) {
            // Atualizar objeto existente
            formData.status = 'disponivel'; // Manter status atual ou definir como disponível
            response = await fetch(`${API_BASE_URL}/objetos/${objetoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            // Criar novo objeto
            response = await fetch(`${API_BASE_URL}/objetos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao salvar objeto');
        }
        
        showAlert(objetoId ? 'Objeto atualizado com sucesso!' : 'Objeto cadastrado com sucesso!', 'success');
        cancelObjetoForm();
        await loadObjetos();
        
    } catch (error) {
        console.error('Erro ao salvar objeto:', error);
        showAlert(error.message, 'error');
    }
}

async function editObjeto(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/objetos/${id}`);
        if (!response.ok) throw new Error('Erro ao carregar objeto');
        
        const objeto = await response.json();
        
        document.getElementById('objeto-id').value = objeto.id;
        document.getElementById('objeto-nome').value = objeto.nome;
        document.getElementById('objeto-codigo').value = objeto.codigo;
        document.getElementById('objeto-categoria').value = objeto.categoria || '';
        document.getElementById('objeto-descricao').value = objeto.descricao || '';
        document.getElementById('objeto-tipo').value = objeto.tipo_equipamento;
        document.getElementById('objeto-etiqueta').value = objeto.etiqueta || '';
        document.getElementById('objeto-condicao').value = objeto.condicao;
        
        document.getElementById('objeto-form-title').textContent = 'Editar Objeto';
        document.getElementById('objeto-form').classList.remove('hidden');
        
    } catch (error) {
        console.error('Erro ao carregar objeto:', error);
        showAlert('Erro ao carregar dados do objeto', 'error');
    }
}

async function deleteObjeto(id) {
    if (!confirm('Tem certeza que deseja excluir este objeto?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/objetos/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erro ao excluir objeto');
        
        showAlert('Objeto excluído com sucesso!', 'success');
        await loadObjetos();
        
    } catch (error) {
        console.error('Erro ao excluir objeto:', error);
        showAlert('Erro ao excluir objeto', 'error');
    }
}

async function searchObjetos() {
    const searchTerm = document.getElementById('objeto-search').value.trim();
    
    if (!searchTerm) {
        renderObjetos(objetos);
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/objetos/buscar/${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Erro ao buscar objetos');
        
        const results = await response.json();
        renderObjetos(results);
        
    } catch (error) {
        console.error('Erro ao buscar objetos:', error);
        showAlert('Erro ao buscar objetos', 'error');
    }
}

// ===== EMPRÉSTIMOS =====

async function loadEmprestimos() {
    try {
        const response = await fetch(`${API_BASE_URL}/emprestimos`);
        if (!response.ok) throw new Error('Erro ao carregar empréstimos');
        
        emprestimos = await response.json();
        renderEmprestimos(emprestimos);
    } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
        showAlert('Erro ao carregar empréstimos', 'error');
    }
}

function renderEmprestimos(emprestimosList) {
    const tbody = document.getElementById('emprestimos-list');
    
    if (emprestimosList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum empréstimo encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = emprestimosList.map(emprestimo => `
        <tr>
            <td>${emprestimo.nome_funcionario} (${emprestimo.matricula})</td>
            <td>${emprestimo.nome_objeto} (${emprestimo.codigo})</td>
            <td>${formatDate(emprestimo.data_emprestimo)}</td>
            <td>${formatDate(emprestimo.data_devolucao_prevista)}</td>
            <td><span class="status-badge status-${emprestimo.status}">${formatStatusEmprestimo(emprestimo.status)}</span></td>
            <td>
                ${emprestimo.status === 'emprestado' ? `
                    <button class="btn btn-sm btn-success" onclick="devolverEmprestimo(${emprestimo.id})">
                        <i class="fas fa-undo"></i> Devolver
                    </button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatStatusEmprestimo(status) {
    const statuses = {
        'emprestado': 'Emprestado',
        'devolvido': 'Devolvido',
        'atrasado': 'Atrasado'
    };
    return statuses[status] || status;
}

function showEmprestimoForm() {
    document.getElementById('emprestimo-form').classList.remove('hidden');
    document.getElementById('emprestimo-form-element').reset();
    updateEmprestimoFuncionarioSelect();
    updateEmprestimoObjetoSelect();
}

function cancelEmprestimoForm() {
    document.getElementById('emprestimo-form').classList.add('hidden');
    document.getElementById('emprestimo-form-element').reset();
}

function updateEmprestimoFuncionarioSelect() {
    const select = document.getElementById('emprestimo-funcionario');
    select.innerHTML = '<option value="">Selecione um funcionário...</option>';
    
    funcionarios.forEach(funcionario => {
        select.innerHTML += `<option value="${funcionario.id}">${funcionario.nome} (${funcionario.matricula})</option>`;
    });
}

function updateEmprestimoObjetoSelect() {
    const select = document.getElementById('emprestimo-objeto');
    select.innerHTML = '<option value="">Selecione um objeto...</option>';
    
    // Apenas objetos disponíveis
    const objetosDisponiveis = objetos.filter(objeto => objeto.status === 'disponivel');
    
    objetosDisponiveis.forEach(objeto => {
        select.innerHTML += `<option value="${objeto.id}">${objeto.nome} (${objeto.codigo})</option>`;
    });
}

async function handleEmprestimoSubmit(event) {
    event.preventDefault();
    
    const formData = {
        id_funcionario: document.getElementById('emprestimo-funcionario').value,
        id_objeto: document.getElementById('emprestimo-objeto').value,
        data_devolucao_prevista: document.getElementById('emprestimo-data-devolucao').value,
        observacoes: document.getElementById('emprestimo-observacoes').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/emprestimos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao registrar empréstimo');
        }
        
        showAlert('Empréstimo registrado com sucesso!', 'success');
        cancelEmprestimoForm();
        await loadEmprestimos();
        await loadObjetos(); // Atualizar status dos objetos
        
    } catch (error) {
        console.error('Erro ao registrar empréstimo:', error);
        showAlert(error.message, 'error');
    }
}

async function devolverEmprestimo(id) {
    const observacoes = prompt('Observações sobre a devolução (opcional):');
    
    try {
        const response = await fetch(`${API_BASE_URL}/emprestimos/${id}/devolver`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ observacoes: observacoes || '' })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao registrar devolução');
        }
        
        showAlert('Devolução registrada com sucesso!', 'success');
        await loadEmprestimos();
        await loadObjetos(); // Atualizar status dos objetos
        
    } catch (error) {
        console.error('Erro ao registrar devolução:', error);
        showAlert(error.message, 'error');
    }
}

// ===== RELATÓRIOS =====

async function loadRelatorios() {
    try {
        // Carregar estatísticas de objetos por status
        const objetosStats = objetos.reduce((acc, objeto) => {
            acc[objeto.status] = (acc[objeto.status] || 0) + 1;
            return acc;
        }, {});
        
        renderObjetosStatusChart(objetosStats);
        
        // Carregar informações de empréstimos ativos
        const emprestimosAtivos = emprestimos.filter(emp => emp.status === 'emprestado');
        renderEmprestimosAtivosInfo(emprestimosAtivos);
        
        // Carregar empréstimos em atraso
        const emprestimosAtrasados = getEmprestimosAtrasados(emprestimos);
        renderEmprestimosAtrasados(emprestimosAtrasados);
        
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        showAlert('Erro ao carregar relatórios', 'error');
    }
}

function renderObjetosStatusChart(stats) {
    const container = document.getElementById('objetos-status-chart');
    
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
        container.innerHTML = '<p>Nenhum objeto cadastrado</p>';
        return;
    }
    
    const chartHTML = Object.entries(stats).map(([status, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        return `
            <div style="margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="status-badge status-${status}">${formatStatus(status)}</span>
                    <span>${count} (${percentage}%)</span>
                </div>
                <div style="background: #e0e0e0; height: 8px; border-radius: 4px; margin-top: 0.25rem;">
                    <div style="background: var(--senai-blue-primary); height: 100%; width: ${percentage}%; border-radius: 4px;"></div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = chartHTML;
}

function renderEmprestimosAtivosInfo(emprestimosAtivos) {
    const container = document.getElementById('emprestimos-ativos-info');
    
    if (emprestimosAtivos.length === 0) {
        container.innerHTML = '<p>Nenhum empréstimo ativo no momento</p>';
        return;
    }
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div style="text-align: center; padding: 1rem; background: var(--senai-blue-primary); color: white; border-radius: 8px;">
                <h4 style="margin: 0; font-size: 2rem;">${emprestimosAtivos.length}</h4>
                <p style="margin: 0;">Empréstimos Ativos</p>
            </div>
            <div style="text-align: center; padding: 1rem; background: var(--success-color); color: white; border-radius: 8px;">
                <h4 style="margin: 0; font-size: 2rem;">${objetos.filter(obj => obj.status === 'disponivel').length}</h4>
                <p style="margin: 0;">Objetos Disponíveis</p>
            </div>
        </div>
    `;
}

function getEmprestimosAtrasados(emprestimos) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return emprestimos.filter(emprestimo => {
        if (emprestimo.status !== 'emprestado') return false;
        
        const dataDevolucao = new Date(emprestimo.data_devolucao_prevista);
        dataDevolucao.setHours(0, 0, 0, 0);
        
        return dataDevolucao < hoje;
    }).map(emprestimo => {
        const dataDevolucao = new Date(emprestimo.data_devolucao_prevista);
        const diasAtraso = Math.floor((hoje - dataDevolucao) / (1000 * 60 * 60 * 24));
        
        return {
            ...emprestimo,
            diasAtraso
        };
    });
}

function renderEmprestimosAtrasados(emprestimosAtrasados) {
    const tbody = document.getElementById('emprestimos-atrasados-list');
    
    if (emprestimosAtrasados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum empréstimo em atraso</td></tr>';
        return;
    }
    
    tbody.innerHTML = emprestimosAtrasados.map(emprestimo => `
        <tr style="background-color: rgba(220, 53, 69, 0.1);">
            <td>${emprestimo.nome_funcionario} (${emprestimo.matricula})</td>
            <td>${emprestimo.nome_objeto} (${emprestimo.codigo})</td>
            <td>${formatDate(emprestimo.data_emprestimo)}</td>
            <td>${formatDate(emprestimo.data_devolucao_prevista)}</td>
            <td><strong style="color: var(--danger-color);">${emprestimo.diasAtraso} dias</strong></td>
        </tr>
    `).join('');
}

// Carregar tema salvo na inicialização
loadSavedTheme();


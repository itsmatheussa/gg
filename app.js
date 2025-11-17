// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Verificar se está logado
function checkAuth() {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!token && currentPage !== 'index.html' && currentPage !== 'login.html' && currentPage !== 'register.html') {
        window.location.href = 'index.html';
        return false;
    }
    
    if (token && (currentPage === 'index.html' || currentPage === 'login.html' || currentPage === 'register.html')) {
        if (userType === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'app.html';
        }
    }
    
    return true;
}

// Verificar autenticação ao carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
} else {
    checkAuth();
}

// Registrar
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const emailOrPhone = document.getElementById('emailOrPhone').value;
        
        // Salvar dados temporários
        sessionStorage.setItem('tempName', name);
        sessionStorage.setItem('tempEmailOrPhone', emailOrPhone);
        
        // Mostrar seção de senha
        document.getElementById('passwordSection').classList.remove('hidden');
        document.getElementById('registerForm').style.display = 'none';
    });
}

if (document.getElementById('passwordForm')) {
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const passwordError = document.getElementById('passwordError');
        
        if (password !== confirmPassword) {
            passwordError.textContent = 'As senhas não coincidem';
            return;
        }
        
        passwordError.textContent = '';
        
        const name = sessionStorage.getItem('tempName');
        const emailOrPhone = sessionStorage.getItem('tempEmailOrPhone');
        
        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, emailOrPhone, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userName', data.name);
                localStorage.setItem('userType', data.userType || 'user');
                window.location.href = 'app.html';
            } else {
                alert(data.error || 'Erro ao cadastrar');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao conectar com o servidor');
        }
    });
}

// Login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailOrPhone = document.getElementById('emailOrPhone').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrPhone, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userName', data.name);
                localStorage.setItem('userType', data.userType || 'user');
                
                if (data.userType === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'app.html';
                }
            } else {
                alert(data.error || 'Credenciais inválidas');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao conectar com o servidor');
        }
    });
}

// Logout
function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// Carregar dados do app
if (document.getElementById('userName')) {
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.getElementById('userName').textContent = userName;
    }
    loadProgressChart();
    loadWorkoutData();
    loadInstructions();
    loadMeasurements();
}

// Gráfico de progresso
function loadProgressChart() {
    const canvas = document.getElementById('progressChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const userId = localStorage.getItem('userId');
    
    fetch(`${API_BASE}/progress/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
        drawProgressChart(ctx, data);
    })
    .catch(err => {
        console.error('Erro ao carregar progresso:', err);
        drawProgressChart(ctx, { daysTrained: 0, exercises: [] });
    });
}

function drawProgressChart(ctx, data) {
    const canvas = ctx.canvas;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Limpar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Fundo
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, width, height);
    
    // Título
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Dias Treinados: ${data.daysTrained || 0}`, width / 2, 25);
    
    // Barras de progresso
    const maxDays = 30;
    const barWidth = chartWidth / maxDays;
    const barSpacing = 2;
    
    for (let i = 0; i < maxDays; i++) {
        const x = padding + i * (barWidth + barSpacing);
        const dayData = data.days && data.days[i];
        const isCompleted = dayData && dayData.completed;
        
        // Barra preta (fundo)
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, padding, barWidth - barSpacing, chartHeight);
        
        // Barra verde (progresso)
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.fillRect(x, padding, barWidth - barSpacing, chartHeight);
        }
    }
    
    // Eixos
    ctx.strokeStyle = '#3d3d3d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();
}

// Abrir seções
function openSection(section) {
    const modals = {
        'instructions': 'instructionsModal',
        'workout': 'workoutModal',
        'chat': 'chatModal',
        'measurements': 'measurementsModal'
    };
    
    const modalId = modals[section];
    if (modalId) {
        document.getElementById(modalId).classList.remove('hidden');
        
        if (section === 'workout') {
            loadWorkoutWeek();
        } else if (section === 'chat') {
            loadChatMessages();
        } else if (section === 'measurements') {
            loadMeasurements();
            loadMeasurementsHistory();
        }
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Carregar instruções
function loadInstructions() {
    const userId = localStorage.getItem('userId');
    
    fetch(`${API_BASE}/instructions/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
        const content = document.getElementById('instructionsContent');
        if (content) {
            content.innerHTML = data.instructions 
                ? `<p>${data.instructions}</p>` 
                : '<p>Nenhuma instrução do treinador ainda.</p>';
        }
    })
    .catch(err => console.error('Erro ao carregar instruções:', err));
}

// Carregar dados de treino
function loadWorkoutData() {
    // Carregado quando necessário
}

function loadWorkoutWeek() {
    const userId = localStorage.getItem('userId');
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    
    fetch(`${API_BASE}/workout/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
        const content = document.getElementById('workoutContent');
        if (content) {
            let html = '<div class="workout-week">';
            
            days.forEach((day, index) => {
                const dayData = data.workout && data.workout[index];
                const isCompleted = dayData && dayData.completed;
                const exercises = dayData ? dayData.exercises : 'Sem treino definido';
                
                html += `
                    <div class="workout-day ${isCompleted ? 'completed' : ''}">
                        <div class="workout-day-info">
                            <h4>${day}</h4>
                            <p>${exercises}</p>
                        </div>
                        <input type="checkbox" class="workout-checkbox" 
                               ${isCompleted ? 'checked' : ''} 
                               onchange="toggleWorkoutDay(${index}, this.checked)">
                    </div>
                `;
            });
            
            html += '</div>';
            content.innerHTML = html;
        }
    })
    .catch(err => {
        console.error('Erro ao carregar treino:', err);
        const content = document.getElementById('workoutContent');
        if (content) {
            const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
            let html = '<div class="workout-week">';
            days.forEach((day, index) => {
                html += `
                    <div class="workout-day">
                        <div class="workout-day-info">
                            <h4>${day}</h4>
                            <p>Sem treino definido</p>
                        </div>
                        <input type="checkbox" class="workout-checkbox" onchange="toggleWorkoutDay(${index}, this.checked)">
                    </div>
                `;
            });
            html += '</div>';
            content.innerHTML = html;
        }
    });
}

function toggleWorkoutDay(dayIndex, completed) {
    const userId = localStorage.getItem('userId');
    
    fetch(`${API_BASE}/workout/${userId}/day/${dayIndex}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ completed })
    })
    .then(() => {
        loadProgressChart();
        const dayElement = event.target.closest('.workout-day');
        if (completed) {
            dayElement.classList.add('completed');
        } else {
            dayElement.classList.remove('completed');
        }
    })
    .catch(err => console.error('Erro ao atualizar treino:', err));
}

// Chat
function loadChatMessages() {
    const userId = localStorage.getItem('userId');
    const messagesContainer = document.getElementById('chatMessages');
    
    fetch(`${API_BASE}/chat/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            (data.messages || []).forEach(msg => {
                addMessageToChat(msg.message, msg.sender === 'user');
            });
        }
    })
    .catch(err => console.error('Erro ao carregar mensagens:', err));
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const userId = localStorage.getItem('userId');
    
    fetch(`${API_BASE}/chat/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message })
    })
    .then(() => {
        addMessageToChat(message, true);
        input.value = '';
        loadChatMessages();
    })
    .catch(err => console.error('Erro ao enviar mensagem:', err));
}

function addMessageToChat(message, isUser) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'trainer'}`;
    messageDiv.textContent = message;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Enter para enviar mensagem
if (document.getElementById('chatInput')) {
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Medições
function loadMeasurements() {
    // Definir data padrão como hoje
    const dateInput = document.getElementById('measurementDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
}

function loadMeasurementsHistory() {
    const userId = localStorage.getItem('userId');
    
    fetch(`${API_BASE}/measurements/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
        const historyContainer = document.getElementById('measurementsHistory');
        if (historyContainer) {
            if (data.measurements && data.measurements.length > 0) {
                let html = '<h3>Histórico</h3>';
                data.measurements.forEach(measurement => {
                    html += `
                        <div class="measurement-item">
                            <div>
                                <strong>${new Date(measurement.date).toLocaleDateString('pt-BR')}</strong>
                                <p>Peso: ${measurement.weight} kg</p>
                            </div>
                        </div>
                    `;
                });
                historyContainer.innerHTML = html;
            } else {
                historyContainer.innerHTML = '<p>Nenhuma medição registrada ainda.</p>';
            }
        }
    })
    .catch(err => console.error('Erro ao carregar medições:', err));
}

if (document.getElementById('measurementForm')) {
    document.getElementById('measurementForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const weight = parseFloat(document.getElementById('weight').value);
        const date = document.getElementById('measurementDate').value;
        const userId = localStorage.getItem('userId');
        
        try {
            const response = await fetch(`${API_BASE}/measurements/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ weight, date })
            });
            
            if (response.ok) {
                document.getElementById('measurementForm').reset();
                loadMeasurements(); // Resetar data para hoje
                loadMeasurementsHistory();
                loadProgressChart();
                alert('Medição registrada com sucesso!');
            } else {
                alert('Erro ao registrar medição');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao conectar com o servidor');
        }
    });
}

// Admin functions
if (document.getElementById('studentsContainer')) {
    loadStudents();
}

function loadStudents() {
    fetch(`${API_BASE}/admin/students`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById('studentsContainer');
        if (container) {
            if (data.students && data.students.length > 0) {
                container.innerHTML = data.students.map(student => `
                    <div class="student-card">
                        <div class="student-info">
                            <h3>${student.name}</h3>
                            <p>${student.emailOrPhone}</p>
                        </div>
                        <div class="student-actions">
                            <button class="btn-view" onclick="viewStudentResults('${student._id}', '${student.name}')">Ver Resultados</button>
                            <button class="btn-remove" onclick="removeStudent('${student._id}')">Remover</button>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p>Nenhum aluno cadastrado ainda.</p>';
            }
        }
    })
    .catch(err => console.error('Erro ao carregar alunos:', err));
}

function showAddUserForm() {
    document.getElementById('addUserModal').classList.remove('hidden');
}

if (document.getElementById('addUserForm')) {
    document.getElementById('addUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('newUserName').value;
        const emailOrPhone = document.getElementById('newUserEmail').value;
        
        try {
            const response = await fetch(`${API_BASE}/admin/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name, emailOrPhone })
            });
            
            if (response.ok) {
                document.getElementById('addUserForm').reset();
                closeModal('addUserModal');
                loadStudents();
                alert('Aluno adicionado com sucesso!');
            } else {
                alert('Erro ao adicionar aluno');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao conectar com o servidor');
        }
    });
}

function removeStudent(studentId) {
    if (!confirm('Tem certeza que deseja remover este aluno?')) return;
    
    fetch(`${API_BASE}/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => {
        if (res.ok) {
            loadStudents();
            alert('Aluno removido com sucesso!');
        } else {
            alert('Erro ao remover aluno');
        }
    })
    .catch(err => console.error('Erro:', err));
}

function viewStudentResults(studentId, studentName) {
    fetch(`${API_BASE}/admin/students/${studentId}/results`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
        const modal = document.getElementById('studentResultsModal');
        const title = document.getElementById('studentResultsTitle');
        const content = document.getElementById('studentResultsContent');
        
        if (title) title.textContent = `Resultados de ${studentName}`;
        if (content) {
            let html = `
                <div style="margin-bottom: 1rem;">
                    <strong>Dias Treinados:</strong> ${data.daysTrained || 0}
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Última Medição:</strong> ${data.lastMeasurement ? `${data.lastMeasurement.weight} kg em ${new Date(data.lastMeasurement.date).toLocaleDateString('pt-BR')}` : 'Nenhuma'}
                </div>
                <div>
                    <strong>Treinos da Semana:</strong>
                    <ul style="margin-top: 0.5rem;">
                        ${data.workoutDays ? data.workoutDays.map((day, i) => 
                            `<li>${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'][i]}: ${day.completed ? '✓ Completo' : '✗ Incompleto'}</li>`
                        ).join('') : ''}
                    </ul>
                </div>
            `;
            content.innerHTML = html;
        }
        modal.classList.remove('hidden');
    })
    .catch(err => {
        console.error('Erro:', err);
        alert('Erro ao carregar resultados');
    });
}


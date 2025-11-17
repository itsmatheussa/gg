const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'fit-training-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Banco de dados em memória (substituir por MongoDB/PostgreSQL em produção)
let users = [];
let workouts = [];
let measurements = [];
let chatMessages = [];
let instructions = [];

// Criar usuário admin padrão
const adminExists = users.find(u => u.emailOrPhone === 'admin@fittraining.com');
if (!adminExists) {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    users.push({
        _id: 'admin1',
        name: 'Admin',
        emailOrPhone: 'admin@fittraining.com',
        password: adminPassword,
        userType: 'admin'
    });
}

// Middleware de autenticação
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
}

// Rotas públicas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Registrar
app.post('/api/register', async (req, res) => {
    try {
        const { name, emailOrPhone, password } = req.body;
        
        if (!name || !emailOrPhone || !password) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }
        
        const existingUser = users.find(u => u.emailOrPhone === emailOrPhone);
        if (existingUser) {
            return res.status(400).json({ error: 'Usuário já existe' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            _id: `user_${Date.now()}`,
            name,
            emailOrPhone,
            password: hashedPassword,
            userType: 'user'
        };
        
        users.push(newUser);
        
        const token = jwt.sign(
            { userId: newUser._id, userType: newUser.userType },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            token,
            userId: newUser._id,
            name: newUser.name,
            userType: newUser.userType
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { emailOrPhone, password } = req.body;
        
        const user = users.find(u => u.emailOrPhone === emailOrPhone);
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const token = jwt.sign(
            { userId: user._id, userType: user.userType },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            token,
            userId: user._id,
            name: user.name,
            userType: user.userType
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// Progresso do usuário
app.get('/api/progress/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;
    const userWorkouts = workouts.filter(w => w.userId === userId && w.completed);
    const daysTrained = userWorkouts.length;
    
    // Agrupar por dia
    const days = Array(30).fill(null).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const dateStr = date.toISOString().split('T')[0];
        const dayWorkout = userWorkouts.find(w => w.date === dateStr);
        return {
            date: dateStr,
            completed: !!dayWorkout
        };
    });
    
    res.json({
        daysTrained,
        days
    });
});

// Instruções
app.get('/api/instructions/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;
    const instruction = instructions.find(i => i.userId === userId);
    res.json({
        instructions: instruction ? instruction.text : ''
    });
});

// Treino semanal
app.get('/api/workout/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;
    let userWorkout = workouts.find(w => w.userId === userId && w.type === 'weekly');
    
    if (!userWorkout) {
        // Criar treino padrão
        userWorkout = {
            userId,
            type: 'weekly',
            workout: [
                { day: 0, exercises: 'Peito e Tríceps', completed: false },
                { day: 1, exercises: 'Costas e Bíceps', completed: false },
                { day: 2, exercises: 'Pernas', completed: false },
                { day: 3, exercises: 'Ombro e Trapézio', completed: false },
                { day: 4, exercises: 'Braço Completo', completed: false },
                { day: 5, exercises: 'Cardio', completed: false },
                { day: 6, exercises: 'Descanso', completed: false }
            ]
        };
        workouts.push(userWorkout);
    }
    
    res.json(userWorkout);
});

// Atualizar dia de treino
app.post('/api/workout/:userId/day/:dayIndex', authenticateToken, (req, res) => {
    const { userId } = req.params;
    const { dayIndex } = req.params;
    const { completed } = req.body;
    
    let userWorkout = workouts.find(w => w.userId === userId && w.type === 'weekly');
    if (!userWorkout) {
        return res.status(404).json({ error: 'Treino não encontrado' });
    }
    
    if (userWorkout.workout[dayIndex]) {
        userWorkout.workout[dayIndex].completed = completed;
        
        // Registrar no histórico de treinos
        if (completed) {
            const today = new Date().toISOString().split('T')[0];
            const existingWorkout = workouts.find(
                w => w.userId === userId && w.date === today && w.type === 'daily'
            );
            if (!existingWorkout) {
                workouts.push({
                    userId,
                    type: 'daily',
                    date: today,
                    completed: true
                });
            }
        }
    }
    
    res.json({ success: true });
});

// Chat
app.get('/api/chat/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;
    const messages = chatMessages.filter(m => m.userId === userId);
    res.json({ messages });
});

app.post('/api/chat/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;
    const { message } = req.body;
    
    chatMessages.push({
        userId,
        message,
        sender: 'user',
        timestamp: new Date()
    });
    
    res.json({ success: true });
});

// Medições
app.get('/api/measurements/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;
    const userMeasurements = measurements.filter(m => m.userId === userId);
    res.json({ measurements: userMeasurements });
});

app.post('/api/measurements/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;
    const { weight, date } = req.body;
    
    measurements.push({
        userId,
        weight: parseFloat(weight),
        date: date || new Date().toISOString().split('T')[0]
    });
    
    res.json({ success: true });
});

// Admin - Listar alunos
app.get('/api/admin/students', authenticateToken, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const students = users.filter(u => u.userType === 'user');
    res.json({ students });
});

// Admin - Adicionar aluno
app.post('/api/admin/students', authenticateToken, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { name, emailOrPhone } = req.body;
    const newUser = {
        _id: `user_${Date.now()}`,
        name,
        emailOrPhone,
        password: bcrypt.hashSync('senha123', 10), // Senha padrão
        userType: 'user'
    };
    
    users.push(newUser);
    res.json({ success: true, user: newUser });
});

// Admin - Remover aluno
app.delete('/api/admin/students/:studentId', authenticateToken, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { studentId } = req.params;
    users = users.filter(u => u._id !== studentId);
    workouts = workouts.filter(w => w.userId !== studentId);
    measurements = measurements.filter(m => m.userId !== studentId);
    chatMessages = chatMessages.filter(m => m.userId !== studentId);
    
    res.json({ success: true });
});

// Admin - Ver resultados do aluno
app.get('/api/admin/students/:studentId/results', authenticateToken, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { studentId } = req.params;
    const userWorkouts = workouts.filter(w => w.userId === studentId);
    const daysTrained = userWorkouts.filter(w => w.completed && w.type === 'daily').length;
    
    const weeklyWorkout = userWorkouts.find(w => w.type === 'weekly');
    const workoutDays = weeklyWorkout ? weeklyWorkout.workout : [];
    
    const userMeasurements = measurements.filter(m => m.userId === studentId);
    const lastMeasurement = userMeasurements.length > 0 
        ? userMeasurements[userMeasurements.length - 1] 
        : null;
    
    res.json({
        daysTrained,
        workoutDays,
        lastMeasurement
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});


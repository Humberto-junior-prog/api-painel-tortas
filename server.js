const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ==========================================
// 🧠 MEMÓRIA DO SERVIDOR
// ==========================================

// 1. Memória dos cliques (botões verdes do painel)
let memoriaCentral = {
    'centro_manha': {}, 'centro_tarde': {},
    'sabugo_diario': {}, 'lages_diario': {}
};
let dataSalvaCentral = new Date().toLocaleDateString('pt-BR');

// 2. Memória da lista de tortas (Novidade do Gerenciador!)
let produtosSalvos = [
    {
        id: 1,
        nome: "Empadão de Frango (Exemplo)",
        centroManha: Array(0,0,0,0,0,0,0),
        centroTarde: Array(0,0,0,0,0,0,0),
        sabugo: Array(0,0,0,0,0,0,0),
        lages: Array(0,0,0,0,0,0,0)
    }
];

// ==========================================
// 🛣️ ROTAS DA API (O Caminho dos Dados)
// ==========================================

app.get('/', (req, res) => {
    res.send('API do Painel de Tortas está ONLINE! 🥧');
});

// Rota para o Painel e o Gerenciador LEREM a lista de tortas
app.get('/produtos', (req, res) => {
    res.json(produtosSalvos);
});

// Rota para o Gerenciador SALVAR as alterações
app.post('/produtos', (req, res) => {
    produtosSalvos = req.body; // Substitui a lista velha pela nova
    
    // Mágica: Avisa o painel de produção na mesma hora que a lista mudou!
    io.emit('produtosAtualizados', produtosSalvos); 
    
    res.status(200).send({ mensagem: "Produtos salvos com sucesso!" });
});

// ==========================================
// ⚡ TEMPO REAL (SOCKET.IO)
// ==========================================
io.on('connection', (socket) => {
    console.log('Um novo aparelho se conectou! ID:', socket.id);

    socket.emit('sincronizarInicial', { checklist: memoriaCentral, data: dataSalvaCentral });

    socket.on('marcarAcao', (dados) => {
        const { chaveEstado, produtoId, tipoAcao } = dados;
        
        if (!memoriaCentral[chaveEstado][`id_${produtoId}`]) {
            memoriaCentral[chaveEstado][`id_${produtoId}`] = { produzir: false, separar: false };
        }
        
        memoriaCentral[chaveEstado][`id_${produtoId}`][tipoAcao] = !memoriaCentral[chaveEstado][`id_${produtoId}`][tipoAcao];

        io.emit('atualizarPainel', memoriaCentral);
    });

    socket.on('disconnect', () => {
        console.log('Um aparelho desconectou:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Criando o servidor HTTP misturado com o Socket.io (Tempo Real)
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Permite que qualquer site conecte aqui
        methods: ["GET", "POST"]
    }
});

// Nossa "Memória Central"
let memoriaCentral = {
    'centro_manha': {}, 'centro_tarde': {},
    'sabugo_diario': {}, 'lages_diario': {}
};
let dataSalvaCentral = new Date().toLocaleDateString('pt-BR');

app.get('/', (req, res) => {
    res.send('API do Painel de Tortas está ONLINE! 🥧');
});

// A MÁGICA DO TEMPO REAL ACONTECE AQUI
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
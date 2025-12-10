export interface Filme {
    id: string;
    titulo: string;
    sinopse: string;
    classificacao: string;
    duracao: number;
    genero: string;
    elenco: string;
    dataInicioExibicao: string;
    dataFinalExibicao: string;
}

export interface Sala {
    id: string;
    numero: number;
    capacidade: number;
}

export interface Sessao {
    id: string;
    filmeId: string;
    salaId: string;
    dataHora: string;
    filme?: Filme;
    sala?: Sala;
}

export interface Ingresso { 
    sessaoId: string;
    tipo: 'INTEIRA' | 'MEIA'; 
    poltrona: { fila: number; numero: number }; 
    valorUnitario: number;   
    sessao?: Sessao;
}

export interface LancheCombo {
    id?: string; 
    nome: string; 
    descricao?: string; 
    valorUnitario: number; 
    quantidade: number;
    estoque: number;    
    subTotal: number; 
}

export interface Pedido {
    id: string;
    qtInteira: number; 
    qtMeia: number;    
    itensIngresso: Ingresso[];
    itensLanche: LancheCombo[];
    valorTotal: number;
    dataPedido: string; 
}
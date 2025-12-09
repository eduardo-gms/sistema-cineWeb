export interface Filme {
    id: string;
    titulo: string;
    sinopse: string;
    classificacao: string;
    duracao: number;
    genero: string;
    elenco: string; // [NOVO] Campo do diagrama
    dataInicioExibicao: string; // [MUDANÇA] Substitui dataEstreia
    dataFinalExibicao: string;  // [NOVO] Campo do diagrama
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
    // Dados expandidos para listagem (join)
    filme?: Filme;
    sala?: Sala;
}

export interface Ingresso {
    id: string;
    sessaoId: string;
    quantidadeInteiras: number;
    quantidadeMeias: number;
    valorTotal: number;
}

export interface LancheCombo {
    id: string;
    nome: string;
    descricao: string;
    valorUnitario: number;
    // qtUnidade e subtotal geralmente são calculados no Pedido, 
    // mas se seguirmos o diagrama estritamente como classe instanciada:
    qtUnidade?: number; 
    subtotal?: number;
}

// [NOVO] Interface Pedido (Agregador principal)
export interface Pedido {
    id: string;
    itensIngresso: {
        sessaoId: string;
        tipo: 'INTEIRA' | 'MEIA';
        quantidade: number;
        valorUnitario: number;
    }[];
    itensLanche: {
        lancheId: string;
        quantidade: number;
        valorUnitario: number;
    }[];
    valorTotal: number;
    dataPedido: string;
}
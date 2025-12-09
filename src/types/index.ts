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

// [NOVO] Definição de Poltrona para o Ingresso
export interface ItemIngresso {
    sessaoId: string;
    tipo: 'INTEIRA' | 'MEIA';
    poltrona: { fila: number; numero: number }; // [REQ: dados poltrona]
    valorUnitario: number;
}

export interface ItemLanche {
    nome: string; // [MUDANÇA] Nome direto, pois não temos mais tabela de lanches
    quantidade: number;
    valorUnitario: number;
}

export interface Pedido {
    id: string;
    itensIngresso: ItemIngresso[];
    itensLanche: ItemLanche[];
    valorTotal: number;
    dataPedido: string;
}
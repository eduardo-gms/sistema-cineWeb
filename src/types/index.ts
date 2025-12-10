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
    // O campo 'poutronas: int' do UML é ambíguo e o campo 'capacidade' já é usado para o cálculo de assentos. Mantemos Sala sem 'poutronas' para evitar redundância.
}

export interface Sessao {
    id: string;
    filmeId: string;
    salaId: string;
    dataHora: string;
    filme?: Filme;
    sala?: Sala;
}

// [MUDANÇA] Renomeado de ItemIngresso para Ingresso, conforme UML.
// Inclui dados de poltrona (necessário para a lógica de venda)
export interface Ingresso { 
    sessaoId: string;
    tipo: 'INTEIRA' | 'MEIA'; 
    poltrona: { fila: number; numero: number }; // Mantido - Essencial para o mapa de assentos.
    valorUnitario: number; 
    valorInteira?: number; // Adicionado do UML (embora redundante para o item vendido)
    valorMeia?: number;    // Adicionado do UML (embora redundante para o item vendido)
    sessao?: Sessao;
}

// [MUDANÇA] De ItemLanche para LancheCombo, conforme UML, incluindo campos adicionais.
export interface LancheCombo {
    id?: string; // Opcional, pois é venda ad-hoc
    nome: string; 
    descricao?: string; // Adicionado do UML
    valorUnitario: number; 
    quantidade: number;
    subTotal: number; // Adicionado do UML (será calculado)
}

// [MUDANÇA] Pedido atualizado para usar os novos nomes e incluir qtInteira/qtMeia.
export interface Pedido {
    id: string;
    qtInteira: number; // Adicionado conforme sua proposta
    qtMeia: number;    // Adicionado conforme sua proposta
    itensIngresso: Ingresso[];
    itensLanche: LancheCombo[];
    valorTotal: number;
    dataPedido: string; // Mantido para registro
}
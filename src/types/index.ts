export interface Filme {
    id: string; // Json-server usa string por padrão
    titulo: string;
    sinopse: string;
    classificacao: string;
    duracao: number; // Em minutos
    genero: string;
    dataEstreia: string; // Simplificado para string ISO
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
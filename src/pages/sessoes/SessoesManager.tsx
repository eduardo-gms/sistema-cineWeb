import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import { 
    type Filme, 
    type Sala, 
    type Sessao, 
    type Pedido, 
    type Ingresso, 
    type LancheCombo 
} from '../../types';

const sessaoSchema = z.object({
    filmeId: z.string().min(1, "Selecione um filme"),
    salaId: z.string().min(1, "Selecione uma sala"),
    dataHora: z.string().refine((date) => new Date(date) >= new Date(), {
        message: "Data não pode ser retroativa"
    })
});

type SessaoSchema = z.infer<typeof sessaoSchema>;

const SessoesManager = () => {
    // Dados Gerais
    const [filmes, setFilmes] = useState<Filme[]>([]);
    const [salas, setSalas] = useState<Sala[]>([]);
    const [sessoes, setSessoes] = useState<Sessao[]>([]);
    const [pedidosRealizados, setPedidosRealizados] = useState<Pedido[]>([]);
    
    // Estado para armazenar os lanches disponíveis no banco de dados
    const [lanchesDisponiveis, setLanchesDisponiveis] = useState<LancheCombo[]>([]);

    // Carrinho / Pedido Atual
    const [sessaoSelecionada, setSessaoSelecionada] = useState<Sessao | null>(null);
    const [ingressosCarrinho, setIngressosCarrinho] = useState<Ingresso[]>([]);
    const [lanchesCarrinho, setLanchesCarrinho] = useState<LancheCombo[]>([]);
    
    // Configuração de Preços da Sessão (Definido pelo gerente na hora da venda)
    const [configPrecoInteira, setConfigPrecoInteira] = useState<number>(20.00);
    const [configPrecoMeia, setConfigPrecoMeia] = useState<number>(10.00);

    // Inputs temporários para selecionar Lanche do DB
    const [selectedLancheId, setSelectedLancheId] = useState("");
    const [qtdeLanche, setQtdeLanche] = useState(1);

    const { register, handleSubmit, formState: { errors } } = useForm<SessaoSchema>({
        resolver: zodResolver(sessaoSchema)
    });

    const loadData = async () => {
        try {
            const [f, s, sess, ped, lanchesResp] = await Promise.all([
                api.get('/filmes'),
                api.get('/salas'),
                api.get('/sessoes?_expand=filme&_expand=sala'),
                api.get('/pedidos'),
                api.get('/lancheCombos')
            ]);
            setFilmes(f.data);
            setSalas(s.data);
            setSessoes(sess.data);
            setPedidosRealizados(ped.data);
            setLanchesDisponiveis(lanchesResp.data);
        } catch (error) {
            console.error("Erro ao carregar dados", error);
        }
    };

    useEffect(() => { loadData(); }, []);

    const removerSessao = async (id: string) => {
        if(confirm("Deseja cancelar esta sessão?")) {
            await api.delete(`/sessoes/${id}`);
            loadData();
        }
    };

    const onSubmit = async (data: SessaoSchema) => {
        await api.post('/sessoes', data);
        alert("Sessão agendada!");
        loadData();
    };

    // --- Lógica de Assentos ---

    const getAssentosOcupados = (sessaoId: string) => {
        const ocupados: string[] = [];
        pedidosRealizados.forEach(p => {
            p.itensIngresso.forEach(item => {
                if (item.sessaoId === sessaoId) {
                    ocupados.push(`${item.poltrona.fila}-${item.poltrona.numero}`);
                }
            });
        });
        return ocupados;
    };

    const calcularCapacidadeRestante = (sessao: Sessao) => {
        if (!sessao.sala) return 0;
        const totalOcupado = getAssentosOcupados(sessao.id).length;
        return sessao.sala.capacidade - totalOcupado;
    };

    const toggleAssento = (fila: number, numero: number) => {
        if (!sessaoSelecionada) return;

        const jaNoCarrinho = ingressosCarrinho.find(i => i.poltrona.fila === fila && i.poltrona.numero === numero);
        
        if (jaNoCarrinho) {
            setIngressosCarrinho(prev => prev.filter(i => !(i.poltrona.fila === fila && i.poltrona.numero === numero)));
        } else {
            // Usa o valor configurado nos inputs de preço
            const novoIngresso: Ingresso = {
                sessaoId: sessaoSelecionada.id,
                tipo: 'INTEIRA',
                poltrona: { fila, numero },
                valorUnitario: configPrecoInteira
            };
            setIngressosCarrinho(prev => [...prev, novoIngresso]);
        }
    };

    // Função corrigida para lidar com a mudança de tipo (Inteira/Meia)
    const handleTipoChange = (index: number, novoTipo: 'INTEIRA' | 'MEIA') => {
         const novoValor = novoTipo === 'INTEIRA' ? configPrecoInteira : configPrecoMeia;
         setIngressosCarrinho(prev => prev.map((old, ix) => ix === index ? { ...old, tipo: novoTipo, valorUnitario: novoValor } : old));
    }

    // --- Lógica de Lanches ---
    
    const adicionarLancheSelecionado = () => {
        if(!selectedLancheId) {
            alert("Selecione um lanche da lista.");
            return;
        }
        if(qtdeLanche <= 0) {
            alert("A quantidade deve ser maior que 0.");
            return;
        }

        const lancheOriginal = lanchesDisponiveis.find(l => l.id === selectedLancheId);
        if(!lancheOriginal) return;

        const lancheParaCarrinho: LancheCombo = {
            ...lancheOriginal,
            quantidade: qtdeLanche,
            subTotal: lancheOriginal.valorUnitario * qtdeLanche
        };

        setLanchesCarrinho(prev => [...prev, lancheParaCarrinho]);
        
        setSelectedLancheId("");
        setQtdeLanche(1);
    };

    const removerLancheDoCarrinho = (index: number) => {
        setLanchesCarrinho(prev => prev.filter((_, i) => i !== index));
    };

    // --- Finalização ---

    const totalIngressosValor = ingressosCarrinho.reduce((acc, i) => acc + i.valorUnitario, 0);
    const totalLanchesValor = lanchesCarrinho.reduce((acc, l) => acc + l.subTotal, 0);
    const totalGeral = totalIngressosValor + totalLanchesValor;

    const finalizarVenda = async () => {
        if (ingressosCarrinho.length === 0 && lanchesCarrinho.length === 0) return;

        const qtInteira = ingressosCarrinho.filter(i => i.tipo === 'INTEIRA').length;
        const qtMeia = ingressosCarrinho.filter(i => i.tipo === 'MEIA').length;

        const pedido: Omit<Pedido, 'id'> = {
            qtInteira,
            qtMeia,
            itensIngresso: ingressosCarrinho,
            itensLanche: lanchesCarrinho,
            valorTotal: totalGeral,
            dataPedido: new Date().toISOString()
        };

        try {
            await api.post('/pedidos', pedido);
            alert("Venda realizada com sucesso!");
            setSessaoSelecionada(null);
            setIngressosCarrinho([]);
            setLanchesCarrinho([]);
            loadData();
        } catch {
            alert("Erro ao salvar pedido");
        }
    };

    return (
        <div className="row">
            {/* Formulário de Agendamento (Esquerda) */}
            <div className="col-md-4 mb-4">
                <div className="card p-3 shadow-sm bg-light">
                    <h5>Agendar Sessão</h5>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="mb-2">
                            <label>Filme</label>
                            <select {...register('filmeId')} className="form-select">
                                <option value="">Selecione...</option>
                                {filmes.map(f => <option key={f.id} value={f.id}>{f.titulo}</option>)}
                            </select>
                            <div className="text-danger small">{errors.filmeId?.message}</div>
                        </div>
                        <div className="mb-2">
                            <label>Sala</label>
                            <select {...register('salaId')} className="form-select">
                                <option value="">Selecione...</option>
                                {salas.map(s => <option key={s.id} value={s.id}>Sala {s.numero}</option>)}
                            </select>
                            <div className="text-danger small">{errors.salaId?.message}</div>
                        </div>
                        <div className="mb-2">
                            <label>Data</label>
                            <input type="datetime-local" {...register('dataHora')} className="form-control" />
                            <div className="text-danger small">{errors.dataHora?.message}</div>
                        </div>
                        <button type="submit" className="btn btn-primary w-100">Agendar</button>
                    </form>
                </div>
            </div>

            {/* Lista de Sessões (Direita) */}
            <div className="col-md-8">
                <h4>Sessões</h4>
                <table className="table table-hover border">
                    <thead className="table-light">
                        <tr>
                            <th>Filme</th>
                            <th>Sala / Capacidade</th>
                            <th>Data</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessoes.map(s => (
                            <tr key={s.id}>
                                <td>{s.filme?.titulo}</td>
                                <td>
                                    Sala {s.sala?.numero} <br/>
                                    <small className={calcularCapacidadeRestante(s) === 0 ? "text-danger" : "text-success"}>
                                        {calcularCapacidadeRestante(s)} lugares livres
                                    </small>
                                </td>
                                <td>{new Date(s.dataHora).toLocaleString()}</td>
                                <td>
                                    <button className="btn btn-sm btn-success me-2" onClick={() => {
                                        setSessaoSelecionada(s);
                                        setIngressosCarrinho([]);
                                        setLanchesCarrinho([]);
                                        // Reseta preços para o padrão ao abrir modal
                                        setConfigPrecoInteira(20);
                                        setConfigPrecoMeia(10);
                                    }}>
                                        <i className="bi bi-cart"></i> Vender
                                    </button>
                                    <button className="btn btn-sm btn-danger" onClick={() => removerSessao(s.id)}>
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Venda */}
            {sessaoSelecionada && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', overflowY: 'auto' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Novo Pedido: {sessaoSelecionada.filme?.titulo}</h5>
                                <button type="button" className="btn-close" onClick={() => setSessaoSelecionada(null)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    {/* 1. Mapa de Poltronas */}
                                    <div className="col-md-5 border-end">
                                        <h6 className="text-center">Selecione as Poltronas</h6>
                                        <div className="d-flex flex-wrap justify-content-center gap-2 mt-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            {sessaoSelecionada.sala && Array.from({ length: sessaoSelecionada.sala.capacidade }).map((_, i) => {
                                                const fila = Math.floor(i / 10) + 1; 
                                                const numero = (i % 10) + 1;
                                                const ocupado = getAssentosOcupados(sessaoSelecionada.id).includes(`${fila}-${numero}`);
                                                const selecionado = ingressosCarrinho.some(item => item.poltrona.fila === fila && item.poltrona.numero === numero);

                                                return (
                                                    <button
                                                        key={i}
                                                        disabled={ocupado}
                                                        onClick={() => toggleAssento(fila, numero)}
                                                        className={`btn btn-sm ${ocupado ? 'btn-secondary' : selecionado ? 'btn-success' : 'btn-outline-primary'}`}
                                                        style={{ width: '40px' }}
                                                        title={`Fila ${fila} - Assento ${numero}`}
                                                    >
                                                        {ocupado ? 'X' : numero}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <div className="mt-3 small text-center text-muted">
                                            (Frente da Tela)
                                        </div>
                                    </div>

                                    {/* 2. Detalhes do Pedido */}
                                    <div className="col-md-7">
                                        
                                        {/* Configuração de Preços */}
                                        <div className="card mb-3 p-2 bg-light border-0">
                                            <div className="row g-2 align-items-center">
                                                <div className="col-auto"><span className="fw-bold small">Definir Valores:</span></div>
                                                <div className="col">
                                                    <div className="input-group input-group-sm">
                                                        <span className="input-group-text">Inteira R$</span>
                                                        <input 
                                                            type="number" className="form-control" 
                                                            value={configPrecoInteira}
                                                            onChange={e => setConfigPrecoInteira(Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col">
                                                    <div className="input-group input-group-sm">
                                                        <span className="input-group-text">Meia R$</span>
                                                        <input 
                                                            type="number" className="form-control" 
                                                            value={configPrecoMeia}
                                                            onChange={e => setConfigPrecoMeia(Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <h6 className="border-bottom pb-2">Ingressos Selecionados</h6>
                                        <ul className="list-group mb-3 small" style={{maxHeight: '150px', overflowY: 'auto'}}>
                                            {ingressosCarrinho.map((item, idx) => (
                                                <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <span>Fila {item.poltrona.fila} - Assento {item.poltrona.numero}</span>
                                                    <div>
                                                        <select 
                                                            className="form-select form-select-sm d-inline-block w-auto me-2"
                                                            value={item.tipo}
                                                            onChange={(e) => handleTipoChange(idx, e.target.value as 'INTEIRA' | 'MEIA')}
                                                        >
                                                            <option value="INTEIRA">Inteira (R$ {configPrecoInteira.toFixed(2)})</option>
                                                            <option value="MEIA">Meia (R$ {configPrecoMeia.toFixed(2)})</option>
                                                        </select>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => toggleAssento(item.poltrona.fila, item.poltrona.numero)}>
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                            {ingressosCarrinho.length === 0 && <li className="list-group-item text-muted">Nenhuma poltrona selecionada</li>}
                                        </ul>

                                        {/* Seção de Lanches com Dropdown do DB */}
                                        <h6 className="border-bottom pb-2 mt-4">Adicionar Lanches / Combos</h6>
                                        <div className="input-group mb-3">
                                            {/* Select de Lanches */}
                                            <select 
                                                className="form-select" 
                                                value={selectedLancheId}
                                                onChange={e => setSelectedLancheId(e.target.value)}
                                            >
                                                <option value="">Selecione um item...</option>
                                                {lanchesDisponiveis.map(l => (
                                                    <option key={l.id} value={l.id}>
                                                        {l.nome} - R$ {l.valorUnitario.toFixed(2)}
                                                    </option>
                                                ))}
                                            </select>
                                            
                                            {/* Input de Quantidade */}
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                placeholder="Qtd" 
                                                style={{maxWidth: '80px'}}
                                                value={qtdeLanche} 
                                                min={1}
                                                onChange={e => setQtdeLanche(Number(e.target.value))} 
                                            />
                                            
                                            <button className="btn btn-warning" onClick={adicionarLancheSelecionado}>
                                                <i className="bi bi-plus-lg"></i>
                                            </button>
                                        </div>

                                        <ul className="list-group mb-3 small">
                                            {lanchesCarrinho.map((lanche, idx) => (
                                                <li key={idx} className="list-group-item d-flex justify-content-between">
                                                    <span>{lanche.quantidade}x {lanche.nome}</span>
                                                    <span>
                                                        R$ {lanche.subTotal.toFixed(2)}
                                                        <button className="btn btn-sm text-danger ms-2" onClick={() => removerLancheDoCarrinho(idx)}><i className="bi bi-x-circle"></i></button>
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="alert alert-success d-flex justify-content-between align-items-center mt-3">
                                            <h4 className="mb-0">Total: R$ {totalGeral.toFixed(2)}</h4>
                                            <button className="btn btn-dark btn-lg" onClick={finalizarVenda}>Finalizar Venda</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessoesManager;
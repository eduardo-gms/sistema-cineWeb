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

    // Carrinho / Pedido Atual
    const [sessaoSelecionada, setSessaoSelecionada] = useState<Sessao | null>(null);
    const [ingressosCarrinho, setIngressosCarrinho] = useState<Ingresso[]>([]);
    const [lanchesCarrinho, setLanchesCarrinho] = useState<LancheCombo[]>([]);
    
    // Inputs temporários para adicionar Lanche Avulso
    const [novoLancheNome, setNovoLancheNome] = useState("");
    const [novoLanchePreco, setNovoLanchePreco] = useState(0);

    const { register, handleSubmit, formState: { errors } } = useForm<SessaoSchema>({
        resolver: zodResolver(sessaoSchema)
    });

    const loadData = async () => {
        try {
            const [f, s, sess, ped] = await Promise.all([
                api.get('/filmes'),
                api.get('/salas'),
                api.get('/sessoes?_expand=filme&_expand=sala'),
                api.get('/pedidos')
            ]);
            setFilmes(f.data);
            setSalas(s.data);
            setSessoes(sess.data);
            setPedidosRealizados(ped.data);
        } catch (error) {
            console.error("Erro ao carregar dados", error);
        }
    };

    useEffect(() => { loadData(); }, []);

    // [REQ: removerSessao]
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

    // [REQ: calcularCapacidade]
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

    // [REQ: reservarPoltrona]
    const toggleAssento = (fila: number, numero: number) => {
        if (!sessaoSelecionada) return;

        const jaNoCarrinho = ingressosCarrinho.find(i => i.poltrona.fila === fila && i.poltrona.numero === numero);
        
        if (jaNoCarrinho) {
            // Remove do carrinho se já selecionou
            setIngressosCarrinho(prev => prev.filter(i => !(i.poltrona.fila === fila && i.poltrona.numero === numero)));
        } else {
            // Adiciona ao carrinho (Default INTEIRA, pode mudar depois)
            const novoIngresso: Ingresso = {
                sessaoId: sessaoSelecionada.id,
                tipo: 'INTEIRA',
                poltrona: { fila, numero },
                valorUnitario: 20.00
            };
            setIngressosCarrinho(prev => [...prev, novoIngresso]);
        }
    };

    // --- Lógica de Lanches (Ad-hoc) ---
    
    const adicionarLancheAvulso = () => {
        if(!novoLancheNome || novoLanchePreco <= 0) {
            alert("Preencha nome e valor do lanche");
            return;
        }

        const quantidade = 1;
        // Agora calcula subTotal e usa o tipo LancheCombo
        setLanchesCarrinho(prev => [
            ...prev, 
            { 
                nome: novoLancheNome, 
                valorUnitario: novoLanchePreco, 
                quantidade: quantidade,
                subTotal: novoLanchePreco * quantidade
            }
        ]);
        setNovoLancheNome("");
        setNovoLanchePreco(0);
    };

    // [REQ: remover lanche do pedido]
    const removerLancheDoCarrinho = (index: number) => {
        setLanchesCarrinho(prev => prev.filter((_, i) => i !== index));
    };

    // --- Finalização ---

    // Calculamos o total visualmente para exibir no modal
    const totalIngressosValor = ingressosCarrinho.reduce((acc, i) => acc + i.valorUnitario, 0);
    const totalLanchesValor = lanchesCarrinho.reduce((acc, l) => acc + l.subTotal, 0);
    const totalGeral = totalIngressosValor + totalLanchesValor;

    const finalizarVenda = async () => {
        if (ingressosCarrinho.length === 0 && lanchesCarrinho.length === 0) return;

        // Calcula quantidades para salvar conforme UML
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
            loadData(); // Recarrega para atualizar assentos ocupados
        } catch {
            alert("Erro ao salvar pedido");
        }
    };

    return (
        <div className="row">
            {/* Formulário */}
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

            {/* Lista de Sessões */}
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
                                                const fila = Math.floor(i / 10) + 1; // Assumindo 10 cadeiras por fila
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
                                        <h6 className="border-bottom pb-2">Ingressos Selecionados</h6>
                                        <ul className="list-group mb-3 small">
                                            {ingressosCarrinho.map((item, idx) => (
                                                <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <span>Fila {item.poltrona.fila} - Assento {item.poltrona.numero}</span>
                                                    <div>
                                                        <select 
                                                            className="form-select form-select-sm d-inline-block w-auto me-2"
                                                            value={item.tipo}
                                                            onChange={(e) => {
                                                                const novoTipo = e.target.value as 'INTEIRA' | 'MEIA';
                                                                const novoValor = novoTipo === 'INTEIRA' ? 20 : 10;
                                                                setIngressosCarrinho(prev => prev.map((old, ix) => ix === idx ? { ...old, tipo: novoTipo, valorUnitario: novoValor } : old));
                                                            }}
                                                        >
                                                            <option value="INTEIRA">Inteira (R$ 20)</option>
                                                            <option value="MEIA">Meia (R$ 10)</option>
                                                        </select>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => toggleAssento(item.poltrona.fila, item.poltrona.numero)}>
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                            {ingressosCarrinho.length === 0 && <li className="list-group-item text-muted">Nenhuma poltrona selecionada</li>}
                                        </ul>

                                        <h6 className="border-bottom pb-2 mt-4">Lanches (Adicionar ao Pedido)</h6>
                                        <div className="input-group mb-3">
                                            <input type="text" className="form-control" placeholder="Nome (ex: Pipoca)" value={novoLancheNome} onChange={e => setNovoLancheNome(e.target.value)} />
                                            <input type="number" className="form-control" placeholder="R$" value={novoLanchePreco} onChange={e => setNovoLanchePreco(parseFloat(e.target.value))} />
                                            <button className="btn btn-warning" onClick={adicionarLancheAvulso}>Add</button>
                                        </div>

                                        <ul className="list-group mb-3 small">
                                            {lanchesCarrinho.map((lanche, idx) => (
                                                <li key={idx} className="list-group-item d-flex justify-content-between">
                                                    <span>{lanche.nome}</span>
                                                    <span>
                                                        R$ {lanche.subTotal.toFixed(2)}
                                                        <button className="btn btn-sm text-danger ms-2" onClick={() => removerLancheDoCarrinho(idx)}><i className="bi bi-x-circle"></i></button>
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="alert alert-success d-flex justify-content-between align-items-center">
                                            <h4 className="mb-0">Total: R$ {totalGeral.toFixed(2)}</h4>
                                            <button className="btn btn-dark" onClick={finalizarVenda}>Finalizar</button>
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
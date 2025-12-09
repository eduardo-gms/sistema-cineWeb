import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import { type Filme, type Sala, type Sessao, type LancheCombo, type Pedido } from '../../types';

// Validação de Agendamento da Sessão
const sessaoSchema = z.object({
    filmeId: z.string().min(1, "Selecione um filme"),
    salaId: z.string().min(1, "Selecione uma sala"),
    dataHora: z.string().refine((date) => new Date(date) >= new Date(), {
        message: "Data não pode ser retroativa"
    })
});

type SessaoSchema = z.infer<typeof sessaoSchema>;

const SessoesManager = () => {
    // --- Estados de Dados ---
    const [filmes, setFilmes] = useState<Filme[]>([]);
    const [salas, setSalas] = useState<Sala[]>([]);
    const [sessoes, setSessoes] = useState<Sessao[]>([]);
    const [lanchesDisponiveis, setLanchesDisponiveis] = useState<LancheCombo[]>([]);
    
    // --- Estados do Carrinho de Vendas ---
    const [sessaoSelecionada, setSessaoSelecionada] = useState<Sessao | null>(null);
    const [qtdInteira, setQtdInteira] = useState(0);
    const [qtdMeia, setQtdMeia] = useState(0);
    const [carrinhoLanches, setCarrinhoLanches] = useState<{lanche: LancheCombo, qtd: number}[]>([]);
    
    // [CORREÇÃO 1] Novo estado para controlar o select de lanches
    const [lancheSelecionadoId, setLancheSelecionadoId] = useState("");

    const { register, handleSubmit, formState: { errors } } = useForm<SessaoSchema>({
        resolver: zodResolver(sessaoSchema)
    });

    // Carrega dados iniciais
    const loadData = async () => {
        try {
            const [f, s, sess, l] = await Promise.all([
                api.get('/filmes'),
                api.get('/salas'),
                api.get('/sessoes?_expand=filme&_expand=sala'),
                api.get('/lanches')
            ]);
            setFilmes(f.data);
            setSalas(s.data);
            setSessoes(sess.data);
            setLanchesDisponiveis(l.data);
        } catch (error) {
            console.error("Erro ao carregar dados", error);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Agendar nova sessão
    const onSubmit = async (data: SessaoSchema) => {
        await api.post('/sessoes', data);
        alert("Sessão agendada com sucesso!");
        loadData();
    };

    // --- Lógica do PDV (Venda) ---

    const adicionarLancheAoCarrinho = () => {
        if (!lancheSelecionadoId) return;

        // [CORREÇÃO 2] Comparação segura convertendo ambos para String
        const lanche = lanchesDisponiveis.find(l => String(l.id) === String(lancheSelecionadoId));
        
        if (!lanche) return;

        setCarrinhoLanches(prev => {
            // [CORREÇÃO 2] Comparação segura aqui também
            const itemExistente = prev.find(i => String(i.lanche.id) === String(lancheSelecionadoId));
            if (itemExistente) {
                return prev.map(i => String(i.lanche.id) === String(lancheSelecionadoId) ? { ...i, qtd: i.qtd + 1 } : i);
            }
            return [...prev, { lanche, qtd: 1 }];
        });
        
        // Opcional: Limpar a seleção após adicionar
        setLancheSelecionadoId(""); 
    };

    // Constantes de preço (Poderiam vir de uma configuração)
    const PRECO_INTEIRA = 20.00;
    const PRECO_MEIA = 10.00;

    // Cálculos de totais
    const totalIngressos = (qtdInteira * PRECO_INTEIRA) + (qtdMeia * PRECO_MEIA);
    const totalLanches = carrinhoLanches.reduce((acc, item) => acc + (item.lanche.valorUnitario * item.qtd), 0);
    const valorTotalPedido = totalIngressos + totalLanches;

    const finalizarVenda = async () => {
        if (!sessaoSelecionada) return;
        
        // [CORREÇÃO 3] Adicionado 'as const' para satisfazer o tipo literal 'INTEIRA' | 'MEIA'
        const novoPedido: Omit<Pedido, 'id'> = {
            itensIngresso: [
                { 
                    sessaoId: sessaoSelecionada.id, 
                    tipo: 'INTEIRA' as const, 
                    quantidade: qtdInteira, 
                    valorUnitario: PRECO_INTEIRA 
                },
                { 
                    sessaoId: sessaoSelecionada.id, 
                    tipo: 'MEIA' as const, 
                    quantidade: qtdMeia, 
                    valorUnitario: PRECO_MEIA 
                }
            ].filter(i => i.quantidade > 0),
            
            itensLanche: carrinhoLanches.map(item => ({
                lancheId: item.lanche.id,
                quantidade: item.qtd,
                valorUnitario: item.lanche.valorUnitario
            })),
            valorTotal: valorTotalPedido,
            dataPedido: new Date().toISOString()
        };

        if (novoPedido.itensIngresso.length === 0 && novoPedido.itensLanche.length === 0) {
            alert("O carrinho está vazio!");
            return;
        }

        try {
            await api.post('/pedidos', novoPedido);
            alert(`Pedido realizado com sucesso!\nTotal: R$ ${valorTotalPedido.toFixed(2)}`);
            // Limpa o estado
            setSessaoSelecionada(null);
            setQtdInteira(0);
            setQtdMeia(0);
            setCarrinhoLanches([]);
            setLancheSelecionadoId("");
        } catch (error) {
            alert("Erro ao processar venda.");
        }
    };

    return (
        <div className="row">
            {/* Esquerda: Formulário de Agendamento */}
            <div className="col-md-4 mb-4">
                <div className="card p-3 shadow-sm bg-light">
                    <h5 className="card-title mb-3"><i className="bi bi-calendar-plus"></i> Agendar Sessão</h5>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="mb-3">
                            <label className="form-label small">Filme</label>
                            <select {...register('filmeId')} className="form-select form-select-sm">
                                <option value="">Selecione...</option>
                                {filmes.map(f => <option key={f.id} value={f.id}>{f.titulo}</option>)}
                            </select>
                            <div className="text-danger small">{errors.filmeId?.message}</div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label small">Sala</label>
                            <select {...register('salaId')} className="form-select form-select-sm">
                                <option value="">Selecione...</option>
                                {salas.map(s => <option key={s.id} value={s.id}>Sala {s.numero} ({s.capacidade} lug.)</option>)}
                            </select>
                            <div className="text-danger small">{errors.salaId?.message}</div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label small">Data e Hora</label>
                            <input type="datetime-local" {...register('dataHora')} className="form-control form-control-sm" />
                            <div className="text-danger small">{errors.dataHora?.message}</div>
                        </div>
                        <button type="submit" className="btn btn-primary w-100 btn-sm">Confirmar Agendamento</button>
                    </form>
                </div>
            </div>

            {/* Direita: Lista de Sessões */}
            <div className="col-md-8">
                <h4 className="mb-3">Sessões Disponíveis</h4>
                <div className="table-responsive">
                    <table className="table table-hover border shadow-sm">
                        <thead className="table-light">
                            <tr>
                                <th>Filme</th>
                                <th>Sala</th>
                                <th>Horário</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessoes.map(sessao => (
                                <tr key={sessao.id}>
                                    <td className="align-middle fw-bold">{sessao.filme?.titulo}</td>
                                    <td className="align-middle">Sala {sessao.sala?.numero}</td>
                                    <td className="align-middle">{new Date(sessao.dataHora).toLocaleString()}</td>
                                    <td>
                                        <button 
                                            className="btn btn-success btn-sm"
                                            onClick={() => setSessaoSelecionada(sessao)}
                                            title="Abrir PDV"
                                        >
                                            <i className="bi bi-cart-fill"></i> Vender
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de PDV (Venda Completa) */}
            {sessaoSelecionada && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', overflowY: 'auto' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title"><i className="bi bi-cart4"></i> Novo Pedido</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setSessaoSelecionada(null)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    {/* Coluna 1: Ingressos */}
                                    <div className="col-md-4 border-end">
                                        <h6 className="text-primary border-bottom pb-2">1. Ingressos</h6>
                                        <p className="small mb-3">
                                            <strong>Filme:</strong> {sessaoSelecionada.filme?.titulo}<br/>
                                            <strong>Sessão:</strong> {new Date(sessaoSelecionada.dataHora).toLocaleTimeString()} - Sala {sessaoSelecionada.sala?.numero}
                                        </p>
                                        
                                        <div className="card mb-3 p-2 bg-light border-0">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span>Inteira (R$ {PRECO_INTEIRA})</span>
                                                <input type="number" min="0" className="form-control form-control-sm w-25" value={qtdInteira} onChange={e => setQtdInteira(parseInt(e.target.value) || 0)} />
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span>Meia (R$ {PRECO_MEIA})</span>
                                                <input type="number" min="0" className="form-control form-control-sm w-25" value={qtdMeia} onChange={e => setQtdMeia(parseInt(e.target.value) || 0)} />
                                            </div>
                                        </div>
                                        <div className="text-end text-primary fw-bold">
                                            Subtotal Ingressos: R$ {totalIngressos.toFixed(2)}
                                        </div>
                                    </div>

                                    {/* Coluna 2: Bombonière */}
                                    <div className="col-md-4 border-end">
                                        <h6 className="text-warning border-bottom pb-2">2. Bombonière</h6>
                                        <div className="input-group mb-3">
                                            {/* [CORREÇÃO 1] Uso do estado lancheSelecionadoId */}
                                            <select 
                                                className="form-select form-select-sm" 
                                                value={lancheSelecionadoId}
                                                onChange={(e) => setLancheSelecionadoId(e.target.value)}
                                            >
                                                <option value="">Selecione um lanche...</option>
                                                {lanchesDisponiveis.map(l => (
                                                    <option key={l.id} value={l.id}>{l.nome} - R$ {l.valorUnitario.toFixed(2)}</option>
                                                ))}
                                            </select>
                                            <button 
                                                className="btn btn-warning btn-sm" 
                                                type="button" 
                                                onClick={adicionarLancheAoCarrinho}
                                            >Add</button>
                                        </div>

                                        <div className="list-group list-group-flush small" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {carrinhoLanches.length === 0 && <span className="text-muted text-center fst-italic mt-3">Nenhum item adicionado</span>}
                                            {carrinhoLanches.map((item, idx) => (
                                                <div key={idx} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                    <div>{item.lanche.nome} <span className="badge bg-secondary rounded-pill">{item.qtd}</span></div>
                                                    <span>R$ {(item.lanche.valorUnitario * item.qtd).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-end text-warning fw-bold mt-2">
                                            Subtotal Lanches: R$ {totalLanches.toFixed(2)}
                                        </div>
                                    </div>

                                    {/* Coluna 3: Resumo */}
                                    <div className="col-md-4 bg-light p-3 rounded">
                                        <h6 className="text-dark border-bottom pb-2">3. Resumo do Pedido</h6>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Ingressos:</span>
                                            <span>R$ {totalIngressos.toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-3">
                                            <span>Lanches:</span>
                                            <span>R$ {totalLanches.toFixed(2)}</span>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between mb-4">
                                            <h4 className="mb-0">TOTAL:</h4>
                                            <h4 className="text-success mb-0">R$ {valorTotalPedido.toFixed(2)}</h4>
                                        </div>
                                        <button className="btn btn-success w-100 py-2 fs-5" onClick={finalizarVenda}>
                                            <i className="bi bi-check-lg"></i> Finalizar Venda
                                        </button>
                                        <button className="btn btn-outline-secondary w-100 mt-2" onClick={() => setSessaoSelecionada(null)}>
                                            Cancelar
                                        </button>
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
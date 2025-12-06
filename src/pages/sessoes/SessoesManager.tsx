import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import { type Filme, type Sala, type Sessao } from '../../types';

// Validação de Agendamento
const sessaoSchema = z.object({
    filmeId: z.string().min(1, "Selecione um filme"),
    salaId: z.string().min(1, "Selecione uma sala"),
    dataHora: z.string().refine((date) => new Date(date) >= new Date(), {
        message: "Data não pode ser retroativa"
    })
});

type SessaoSchema = z.infer<typeof sessaoSchema>;

const SessoesManager = () => {
    // Estados de Dados
    const [filmes, setFilmes] = useState<Filme[]>([]);
    const [salas, setSalas] = useState<Sala[]>([]);
    const [sessoes, setSessoes] = useState<Sessao[]>([]);
    
    // Estados do Modal de Venda
    const [sessaoSelecionada, setSessaoSelecionada] = useState<Sessao | null>(null);
    const [qtdInteira, setQtdInteira] = useState(0);
    const [qtdMeia, setQtdMeia] = useState(0);

    const { register, handleSubmit, formState: { errors } } = useForm<SessaoSchema>({
        resolver: zodResolver(sessaoSchema)
    });

    const loadData = async () => {
        const [f, s, sess] = await Promise.all([
            api.get('/filmes'),
            api.get('/salas'),
            api.get('/sessoes?_expand=filme&_expand=sala')
        ]);
        setFilmes(f.data);
        setSalas(s.data);
        setSessoes(sess.data);
    };

    useEffect(() => { loadData(); }, []);

    const onSubmit = async (data: SessaoSchema) => {
        await api.post('/sessoes', data);
        alert("Sessão agendada!");
        loadData();
    };

    // Lógica de Venda
    const PRECO_INTEIRA = 20.00; // Valor fixo para exemplo
    const valorTotal = (qtdInteira * PRECO_INTEIRA) + (qtdMeia * (PRECO_INTEIRA / 2));

    const finalizarVenda = async () => {
        if (!sessaoSelecionada) return;
        
        const ingresso = {
            sessaoId: sessaoSelecionada.id,
            quantidadeInteiras: qtdInteira,
            quantidadeMeias: qtdMeia,
            valorTotal: valorTotal
        };

        await api.post('/ingressos', ingresso);
        alert(`Venda realizada! Total: R$ ${valorTotal.toFixed(2)}`);
        setSessaoSelecionada(null); // Fecha o modal
        setQtdInteira(0);
        setQtdMeia(0);
    };

    return (
        <div className="row">
            {/* Coluna da Esquerda: Agendamento */}
            <div className="col-md-4 mb-4">
                <div className="card p-3 shadow-sm">
                    <h4>Agendar Sessão</h4>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="mb-3">
                            <label>Filme</label>
                            <select {...register('filmeId')} className="form-select">
                                <option value="">Selecione...</option>
                                {filmes.map(f => <option key={f.id} value={f.id}>{f.titulo}</option>)}
                            </select>
                            <div className="text-danger small">{errors.filmeId?.message}</div>
                        </div>
                        <div className="mb-3">
                            <label>Sala</label>
                            <select {...register('salaId')} className="form-select">
                                <option value="">Selecione...</option>
                                {salas.map(s => <option key={s.id} value={s.id}>Sala {s.numero} ({s.capacidade} lug.)</option>)}
                            </select>
                            <div className="text-danger small">{errors.salaId?.message}</div>
                        </div>
                        <div className="mb-3">
                            <label>Data e Hora</label>
                            <input type="datetime-local" {...register('dataHora')} className="form-control" />
                            <div className="text-danger small">{errors.dataHora?.message}</div>
                        </div>
                        <button type="submit" className="btn btn-primary w-100">Agendar</button>
                    </form>
                </div>
            </div>

            {/* Coluna da Direita: Listagem */}
            <div className="col-md-8">
                <h4>Sessões Agendadas</h4>
                <div className="table-responsive">
                    <table className="table table-hover border">
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
                                    <td>{sessao.filme?.titulo}</td>
                                    <td>Sala {sessao.sala?.numero}</td>
                                    <td>{new Date(sessao.dataHora).toLocaleString()}</td>
                                    <td>
                                        <button 
                                            className="btn btn-success btn-sm"
                                            onClick={() => setSessaoSelecionada(sessao)}
                                        >
                                            <i className="bi bi-ticket-perforated"></i> Vender
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Venda (Renderizado condicionalmente) */}
            {sessaoSelecionada && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Venda de Ingresso</h5>
                                <button type="button" className="btn-close" onClick={() => setSessaoSelecionada(null)}></button>
                            </div>
                            <div className="modal-body">
                                <p><strong>Filme:</strong> {sessaoSelecionada.filme?.titulo}</p>
                                <p><strong>Sala:</strong> {sessaoSelecionada.sala?.numero}</p>
                                <hr />
                                <div className="mb-3">
                                    <label>Inteiras (R$ 20,00)</label>
                                    <input 
                                        type="number" min="0" 
                                        className="form-control"
                                        value={qtdInteira}
                                        onChange={e => setQtdInteira(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label>Meias (R$ 10,00)</label>
                                    <input 
                                        type="number" min="0" 
                                        className="form-control"
                                        value={qtdMeia}
                                        onChange={e => setQtdMeia(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <h4 className="text-end text-primary">Total: R$ {valorTotal.toFixed(2)}</h4>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setSessaoSelecionada(null)}>Cancelar</button>
                                <button className="btn btn-success" onClick={finalizarVenda}>Confirmar Venda</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessoesManager;
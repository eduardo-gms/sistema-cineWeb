import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import { Filme, Sala, Sessao } from '../../types';

// Validação de Sessão [cite: 89-90]
const sessaoSchema = z.object({
    filmeId: z.string().min(1, "Selecione um filme"),
    salaId: z.string().min(1, "Selecione uma sala"),
    dataHora: z.string().refine((date) => new Date(date) >= new Date(), {
        message: "A data da sessão não pode ser retroativa"
    })
});

type SessaoSchema = z.infer<typeof sessaoSchema>;

const SessoesManager = () => {
    const [filmes, setFilmes] = useState<Filme[]>([]);
    const [salas, setSalas] = useState<Sala[]>([]);
    const [sessoes, setSessoes] = useState<Sessao[]>([]);

    const { register, handleSubmit, formState: { errors } } = useForm<SessaoSchema>({
        resolver: zodResolver(sessaoSchema)
    });

    const loadData = async () => {
        const [f, s, sess] = await Promise.all([
            api.get('/filmes'),
            api.get('/salas'),
            api.get('/sessoes?_expand=filme&_expand=sala') // _expand é recurso do json-server para JOIN
        ]);
        setFilmes(f.data);
        setSalas(s.data);
        setSessoes(sess.data);
    };

    useEffect(() => { loadData(); }, []);

    const onSubmit = async (data: SessaoSchema) => {
        await api.post('/sessoes', data);
        loadData(); // Recarrega a lista
    };

    return (
        <div className="row">
            {/* Formulário de Agendamento */}
            <div className="col-md-4">
                <div className="card p-3">
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
                                {salas.map(s => <option key={s.id} value={s.id}>Sala {s.numero}</option>)}
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

            {/* Listagem de Sessões */}
            <div className="col-md-8">
                <h4>Sessões Agendadas</h4>
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Filme</th>
                            <th>Sala</th>
                            <th>Horário</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessoes.map(sessao => (
                            <tr key={sessao.id}>
                                <td>{sessao.filme?.titulo || 'Filme removido'}</td>
                                <td>{sessao.sala?.numero || 'Sala removida'}</td>
                                <td>{new Date(sessao.dataHora).toLocaleString()}</td>
                                <td>
                                    <button className="btn btn-sm btn-outline-success">
                                        <i className="bi bi-ticket-perforated"></i> Vender
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SessoesManager;
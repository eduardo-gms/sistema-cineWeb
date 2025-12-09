import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const lancheSchema = z.object({
    nome: z.string().min(1, "Nome obrigatório"),
    descricao: z.string().min(1, "Descrição obrigatória"),
    valorUnitario: z.number({ invalid_type_error: "Informe um valor" }).positive("Valor deve ser positivo")
});

type LancheSchema = z.infer<typeof lancheSchema>;

const LanchesForm = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm<LancheSchema>({
        resolver: zodResolver(lancheSchema)
    });

    const onSubmit = async (data: LancheSchema) => {
        try {
            await api.post('/lanches', data);
            alert("Lanche cadastrado com sucesso!");
            navigate('/lanches');
        } catch {
            alert("Erro ao salvar lanche.");
        }
    };

    return (
        <div className="card p-4 mx-auto" style={{ maxWidth: '600px' }}>
            <h3>Novo Lanche</h3>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                    <label className="form-label">Nome do Combo/Lanche</label>
                    <input {...register('nome')} className={`form-control ${errors.nome ? 'is-invalid' : ''}`} placeholder="Ex: Combo Pipoca M + Refri" />
                    <div className="invalid-feedback">{errors.nome?.message}</div>
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Descrição</label>
                    <input {...register('descricao')} className={`form-control ${errors.descricao ? 'is-invalid' : ''}`} placeholder="Detalhes do item" />
                    <div className="invalid-feedback">{errors.descricao?.message}</div>
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Preço (R$)</label>
                    <input type="number" step="0.01" {...register('valorUnitario', { valueAsNumber: true })} className={`form-control ${errors.valorUnitario ? 'is-invalid' : ''}`} />
                    <div className="invalid-feedback">{errors.valorUnitario?.message}</div>
                </div>
                
                <div className="d-flex justify-content-between">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/lanches')}>Voltar</button>
                    <button type="submit" className="btn btn-primary">Salvar</button>
                </div>
            </form>
        </div>
    );
};

export default LanchesForm;
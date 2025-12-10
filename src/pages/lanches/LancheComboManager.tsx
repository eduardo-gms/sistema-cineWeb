import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import type { LancheCombo } from '../../types';

// Schema validado
const lancheComboSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  descricao: z.string().min(5, "Descrição é obrigatória (mín. 5 caracteres)"),
  valorUnitario: z.number({ invalid_type_error: "Informe o valor" })
                  .positive("O valor deve ser positivo"),
  estoque: z.number({ invalid_type_error: "Informe a quantidade" })
            .int("Deve ser um número inteiro")
            .min(0, "Estoque não pode ser negativo") // [NOVO] Validação de estoque
});

type LancheComboForm = z.infer<typeof lancheComboSchema>;

const LancheCombosManager = () => {
  const [lanches, setLanches] = useState<LancheCombo[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LancheComboForm>({
    resolver: zodResolver(lancheComboSchema)
  });

  const carregarLanches = async () => {
    try {
      const response = await api.get('/lancheCombos');
      setLanches(response.data);
    } catch (error) {
      console.error("Erro ao carregar lanches", error);
    }
  };

  useEffect(() => { carregarLanches(); }, []);

  const onSubmit = async (data: LancheComboForm) => {
    try {
      const novoLanche: Omit<LancheCombo, 'id'> = {
        ...data,
        quantidade: 0, // Inicia zero no carrinho
        subTotal: 0    
        // O campo 'estoque' já vem dentro de 'data'
      };

      await api.post('/lancheCombos', novoLanche);
      alert("Lanche/Combo cadastrado com sucesso!");
      reset();
      carregarLanches();
    } catch (error) {
      alert("Erro ao salvar.");
    }
  };

  const deletarLanche = async (id: string) => {
    if (confirm("Confirma a exclusão deste item?")) {
      await api.delete(`/lancheCombos/${id}`);
      carregarLanches();
    }
  };

  return (
    <div className="container">
      <h3 className="mb-4">Gerenciar Cardápio (LancheCombo)</h3>
      
      <div className="row">
        {/* Formulário de Cadastro */}
        <div className="col-md-4">
          <div className="card p-3 mb-4 bg-light shadow-sm">
            <h5 className="card-title mb-3">Novo Item</h5>
            <form onSubmit={handleSubmit(onSubmit)}>
              
              <div className="mb-3">
                <label className="form-label">Nome</label>
                <input 
                  {...register('nome')} 
                  className={`form-control ${errors.nome ? 'is-invalid' : ''}`} 
                  placeholder="Ex: Combo Pipoca + Refri"
                />
                <div className="invalid-feedback">{errors.nome?.message}</div>
              </div>

              <div className="mb-3">
                <label className="form-label">Descrição</label>
                <textarea 
                  {...register('descricao')} 
                  className={`form-control ${errors.descricao ? 'is-invalid' : ''}`} 
                  placeholder="Detalhes do item..."
                  rows={2}
                />
                <div className="invalid-feedback">{errors.descricao?.message}</div>
              </div>

              <div className="mb-3">
                <label className="form-label">Valor Unitário (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  {...register('valorUnitario', { valueAsNumber: true })} 
                  className={`form-control ${errors.valorUnitario ? 'is-invalid' : ''}`} 
                />
                <div className="invalid-feedback">{errors.valorUnitario?.message}</div>
              </div>

              {/* [NOVO] Campo de Estoque */}
              <div className="mb-3">
                <label className="form-label">Quantidade em Estoque</label>
                <input 
                  type="number" 
                  {...register('estoque', { valueAsNumber: true })} 
                  className={`form-control ${errors.estoque ? 'is-invalid' : ''}`} 
                  placeholder="Ex: 50"
                />
                <div className="invalid-feedback">{errors.estoque?.message}</div>
              </div>

              <button type="submit" className="btn btn-primary w-100">
                <i className="bi bi-save me-2"></i> Cadastrar
              </button>
            </form>
          </div>
        </div>

        {/* Listagem */}
        <div className="col-md-8">
          <div className="table-responsive border rounded">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Nome</th>
                  <th>Valor</th>
                  <th>Estoque</th> {/* [NOVO] Coluna Estoque */}
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lanches.map(item => (
                  <tr key={item.id}>
                    <td>
                        <span className="fw-bold">{item.nome}</span><br/>
                        <small className="text-muted">{item.descricao}</small>
                    </td>
                    <td>R$ {item.valorUnitario.toFixed(2)}</td>
                    <td>
                        <span className={`badge ${item.estoque > 0 ? 'bg-success' : 'bg-danger'}`}>
                            {item.estoque} un
                        </span>
                    </td>
                    <td className="text-end">
                      <button 
                        onClick={() => item.id && deletarLanche(item.id)} 
                        className="btn btn-danger btn-sm"
                        title="Remover Item"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {lanches.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-3 text-muted">
                      Nenhum item cadastrado no cardápio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LancheCombosManager;
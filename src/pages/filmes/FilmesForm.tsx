import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

// Esquema de Validação [cite: 83-86]
const filmeSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  sinopse: z.string().min(10, "Sinopse deve ter no mínimo 10 caracteres"),
  duracao: z.number({ invalid_type_error: "Insira um número" }).positive("Duração deve ser positiva"),
  classificacao: z.string().min(1, "Classificação obrigatória"),
  genero: z.string().min(1, "Gênero obrigatório"),
  dataEstreia: z.string().min(1, "Data obrigatória"),
});

type FilmeSchema = z.infer<typeof filmeSchema>;

const FilmesForm = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FilmeSchema>({
    resolver: zodResolver(filmeSchema)
  });

  const onSubmit = async (data: FilmeSchema) => {
    await api.post('/filmes', data);
    alert('Filme cadastrado!');
    navigate('/filmes');
  };

  return (
    <div className="card p-4">
      <h3>Cadastro de Filme</h3>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <label className="form-label">Título</label>
          <input {...register('titulo')} className={`form-control ${errors.titulo ? 'is-invalid' : ''}`} />
          <div className="invalid-feedback">{errors.titulo?.message}</div>
        </div>
        
        <div className="mb-3">
          <label className="form-label">Sinopse</label>
          <textarea {...register('sinopse')} className={`form-control ${errors.sinopse ? 'is-invalid' : ''}`} />
          <div className="invalid-feedback">{errors.sinopse?.message}</div>
        </div>

        <div className="row">
            <div className="col-md-6 mb-3">
                <label className="form-label">Duração (min)</label>
                <input type="number" {...register('duracao', { valueAsNumber: true })} className={`form-control ${errors.duracao ? 'is-invalid' : ''}`} />
                <div className="invalid-feedback">{errors.duracao?.message}</div>
            </div>
            <div className="col-md-6 mb-3">
                <label className="form-label">Classificação</label>
                <select {...register('classificacao')} className="form-select">
                    <option value="">Selecione...</option>
                    <option value="Livre">Livre</option>
                    <option value="12">12 anos</option>
                    <option value="18">18 anos</option>
                </select>
            </div>
        </div>

        {/* Adicione os campos Gênero e Data aqui seguindo o padrão acima */}
        
        <button type="submit" className="btn btn-primary">Salvar</button>
      </form>
    </div>
  );
};

export default FilmesForm;
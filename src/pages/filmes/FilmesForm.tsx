import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createFilme, getFilmeById, updateFilme, getGeneros } from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import type { Genero } from '../../types'; // Certifique-se de que este tipo existe

// Schema corrigido para espelhar EXATAMENTE o schema.prisma
const filmeSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  sinopse: z.string().min(10, "Sinopse deve ter no mínimo 10 caracteres"),
  duracao: z.coerce.number({ invalid_type_error: "Insira um número" }).int("Deve ser um número inteiro").positive("Duração deve ser positiva"),
  classificacaoEtaria: z.string().min(1, "Classificação obrigatória"), 
  generoId: z.string().min(1, "Gênero obrigatório"), 
  elenco: z.string().min(1, "Elenco é obrigatório"),
  dataInicioExibicao: z.string().min(1, "Data inicial obrigatória"),
  dataFimExibicao: z.string().min(1, "Data final obrigatória"),
  status: z.string().min(1, "Status é obrigatório"), // Adicionado conforme Prisma
}).refine(data => new Date(data.dataFimExibicao) >= new Date(data.dataInicioExibicao), {
  message: "Data final deve ser posterior à data inicial",
  path: ["dataFimExibicao"]
});

type FilmeSchema = z.infer<typeof filmeSchema>;

const FilmesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  // Estado para armazenar os gêneros dinâmicos
  const [listaGeneros, setListaGeneros] = useState<Genero[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FilmeSchema>({
    resolver: zodResolver(filmeSchema),
    defaultValues: { status: "Em Cartaz" } // Valor padrão para o banco
  });

  // Busca os gêneros na API assim que o componente monta
  useEffect(() => {
    getGeneros()
      .then(response => setListaGeneros(response.data))
      .catch(error => console.error("Erro ao carregar gêneros", error));
  }, []);

  useEffect(() => {
    if (isEditing) {
      getFilmeById(id).then(response => {
        const dataForm = {
          ...response.data,
          dataInicioExibicao: new Date(response.data.dataInicioExibicao).toISOString().split('T')[0],
          dataFimExibicao: new Date(response.data.dataFimExibicao).toISOString().split('T')[0]
        };
        reset(dataForm);
      }).catch(error => {
        console.error("Erro ao carregar filme para edição", error);
        alert("Erro ao carregar o filme.");
      });
    }
  }, [id, isEditing, reset]);

  const onSubmit = async (data: FilmeSchema) => {
    try {
      // O backend Prisma espera datas no formato ISO-8601 completo
      const payload = {
        ...data,
        dataInicioExibicao: new Date(`${data.dataInicioExibicao}T00:00:00Z`).toISOString(),
        dataFimExibicao: new Date(`${data.dataFimExibicao}T00:00:00Z`).toISOString()
      };

      if (isEditing) {
        await updateFilme(id, payload as any);
        alert('Filme atualizado com sucesso!');
      } else {
        await createFilme(payload as any);
        alert('Filme cadastrado com sucesso!');
      }
      navigate('/filmes');
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o filme.");
    }
  };

  return (
    <div className="card p-4">
      <h3>{isEditing ? 'Editar Filme' : 'Cadastro de Filme'}</h3>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <label className="form-label">Título</label>
          <input {...register('titulo')} className={`form-control ${errors.titulo ? 'is-invalid' : ''}`} />
          <div className="invalid-feedback">{errors.titulo?.message}</div>
        </div>

        <div className="mb-3">
          <label className="form-label">Elenco</label>
          <input {...register('elenco')} className={`form-control ${errors.elenco ? 'is-invalid' : ''}`} placeholder="Ex: Wagner Moura, Selton Mello" />
          <div className="invalid-feedback">{errors.elenco?.message}</div>
        </div>

        <div className="mb-3">
          <label className="form-label">Sinopse</label>
          <textarea {...register('sinopse')} className={`form-control ${errors.sinopse ? 'is-invalid' : ''}`} />
          <div className="invalid-feedback">{errors.sinopse?.message}</div>
        </div>

        <div className="row mb-3">
          <div className="col-md-4">
            <label className="form-label">Duração (min)</label>
            <input type="number" {...register('duracao', { valueAsNumber: true })} className={`form-control ${errors.duracao ? 'is-invalid' : ''}`} />
            <div className="invalid-feedback">{errors.duracao?.message}</div>
          </div>
          
          <div className="col-md-4">
            <label className="form-label">Classificação</label>
            {/* Atualizado para classificacaoEtaria */}
            <select {...register('classificacaoEtaria')} className={`form-select ${errors.classificacaoEtaria ? 'is-invalid' : ''}`}>
              <option value="">Selecione...</option>
              <option value="Livre">Livre</option>
              <option value="10">10 anos</option>
              <option value="12">12 anos</option>
              <option value="14">14 anos</option>
              <option value="16">16 anos</option>
              <option value="18">18 anos</option>
            </select>
            <div className="invalid-feedback">{errors.classificacaoEtaria?.message}</div>
          </div>

          <div className="col-md-4">
            <label className="form-label">Gênero</label>
            {/* Atualizado para generoId e usando renderização dinâmica */}
            <select {...register('generoId')} className={`form-select ${errors.generoId ? 'is-invalid' : ''}`}>
              <option value="">Selecione...</option>
              {listaGeneros.map((g) => (
                <option key={g.id} value={g.id}>{g.nome}</option>
              ))}
            </select>
            <div className="invalid-feedback">{errors.generoId?.message}</div>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Início Exibição</label>
            <input type="date" {...register('dataInicioExibicao')} className={`form-control ${errors.dataInicioExibicao ? 'is-invalid' : ''}`} />
            <div className="invalid-feedback">{errors.dataInicioExibicao?.message}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label">Fim Exibição</label>
            {/* Atualizado para dataFimExibicao */}
            <input type="date" {...register('dataFimExibicao')} className={`form-control ${errors.dataFimExibicao ? 'is-invalid' : ''}`} />
            <div className="invalid-feedback">{errors.dataFimExibicao?.message}</div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-100">{isEditing ? 'Atualizar Filme' : 'Salvar Filme'}</button>
      </form>
    </div>
  );
};

export default FilmesForm;

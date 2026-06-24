import { supabase } from '../lib/supabase';

/**
 * Busca chunks relevantes da base de conhecimento no Supabase
 * usando busca textual por palavras-chave da pergunta do usuário.
 */
export async function searchKnowledge(query: string, maxChunks = 5): Promise<string> {
  if (!query.trim()) return '';

  // Extrai palavras-chave relevantes (remove stopwords comuns)
  const STOPWORDS = new Set([
    'de','do','da','dos','das','em','no','na','nos','nas','o','a','os','as',
    'e','é','que','para','com','um','uma','se','por','ao','aos','à','às',
    'mais','me','meu','minha','seu','sua','mas','foi','como','ele','ela',
    'tem','ter','ser','isso','este','esta','esse','essa','aqui','já','não',
    'ou','até','eu','vc','você','qual','quais','onde','quando','como','posso',
    'pode','preciso','quero','gostaria','favor','ajuda','saber','dizer','falar',
  ]);

  const keywords = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 6); // máximo 6 palavras-chave

  if (keywords.length === 0) return '';

  // Monta query de busca textual usando ILIKE com OR
  // Busca em content E file_name para pegar contexto pelo nome do arquivo também
  const conditions = keywords.map(kw => `content.ilike.%${kw}%`).join(',');

  const { data, error } = await supabase
    .from('knowledge_base')
    .select('file_name, content')
    .or(conditions)
    .limit(maxChunks);

  if (error || !data || data.length === 0) return '';

  // Formata os chunks encontrados para injetar no prompt
  const formatted = data.map(row =>
    `[Fonte: ${row.file_name}]\n${row.content}`
  ).join('\n\n---\n\n');

  return formatted;
}
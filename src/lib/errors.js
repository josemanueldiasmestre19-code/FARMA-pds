// Traduz mensagens de erro do Supabase/Postgres para português claro
const errorMap = {
  'Invalid login credentials': 'Email ou palavra-passe incorrectos.',
  'Email not confirmed': 'Email ainda não foi confirmado. Verifique a sua caixa de entrada.',
  'User already registered': 'Este email já está registado.',
  'Password should be at least 6 characters': 'A palavra-passe deve ter pelo menos 6 caracteres.',
  'Unable to validate email address: invalid format': 'Formato de email inválido.',
  'Email rate limit exceeded': 'Demasiadas tentativas. Tente novamente mais tarde.',
  'For security purposes, you can only request this after': 'Por segurança, aguarde antes de tentar novamente.',
  'Failed to fetch': 'Sem ligação ao servidor. Verifique a sua internet.',
  'NetworkError': 'Sem ligação ao servidor. Verifique a sua internet.',
  'JWT expired': 'A sessão expirou. Inicie sessão novamente.',
  'row-level security': 'Não tem permissão para esta operação.',
  'duplicate key value': 'Este registo já existe.',
  'violates foreign key': 'Não é possível: existem registos associados.',
  'idx_one_pending_per_user': 'Já tem um pedido pendente.',
}

export function translateError(message) {
  if (!message) return 'Ocorreu um erro inesperado.'
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) return value
  }
  // Mensagens levantadas pelas nossas funções SQL (RAISE EXCEPTION) já vêm em português
  return message
}

// Traduz mensagens de erro do Supabase para português
const errorMap = {
  'Invalid login credentials': 'Email ou palavra-passe incorrectos.',
  'Email not confirmed': 'Email ainda não foi confirmado.',
  'User already registered': 'Este email já está registado.',
  'Password should be at least 6 characters': 'A palavra-passe deve ter pelo menos 6 caracteres.',
  'Unable to validate email address: invalid format': 'Formato de email inválido.',
  'Email rate limit exceeded': 'Demasiadas tentativas. Tente novamente mais tarde.',
  'For security purposes, you can only request this after': 'Por segurança, aguarde antes de tentar novamente.',
}

export function translateError(message) {
  if (!message) return 'Ocorreu um erro inesperado.'
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) return value
  }
  return message
}

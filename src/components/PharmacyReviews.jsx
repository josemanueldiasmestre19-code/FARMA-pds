import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Star, Send, Trash2, User, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from './ui/Button.jsx'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function PharmacyReviews({ pharmacyId }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true)
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false })
      setReviews(data || [])
      setLoading(false)
    }
    fetchReviews()

    const channel = supabase
      .channel(`reviews-${pharmacyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews', filter: `pharmacy_id=eq.${pharmacyId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReviews((prev) => prev.find((r) => r.id === payload.new.id) ? prev : [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setReviews((prev) => prev.map((r) => (r.id === payload.new.id ? payload.new : r)))
          } else if (payload.eventType === 'DELETE') {
            setReviews((prev) => prev.filter((r) => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [pharmacyId])

  const userReview = user ? reviews.find((r) => r.user_id === user.id) : null

  useEffect(() => {
    if (userReview) {
      setRating(userReview.rating)
      setComment(userReview.comment || '')
    }
  }, [userReview])

  const submit = async (e) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)

    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Anónimo'
    const row = {
      user_id: user.id,
      pharmacy_id: pharmacyId,
      rating,
      comment: comment.trim() || null,
      user_name: userName,
    }

    const { error } = await supabase
      .from('reviews')
      .upsert(row, { onConflict: 'user_id,pharmacy_id' })

    setSubmitting(false)
    if (error) {
      toast.error('Erro ao submeter avaliação')
      return
    }
    toast.success(userReview ? 'Avaliação actualizada!' : 'Obrigado pela sua avaliação!')
  }

  const deleteReview = async () => {
    if (!userReview) return
    await supabase.from('reviews').delete().eq('id', userReview.id)
    setRating(5)
    setComment('')
    toast.success('Avaliação removida')
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    stars: n,
    count: reviews.filter((r) => r.rating === n).length,
    percent: reviews.length > 0 ? (reviews.filter((r) => r.rating === n).length / reviews.length) * 100 : 0,
  }))

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        Avaliações
        {reviews.length > 0 && (
          <span className="ml-2 text-sm text-slate-500 dark:text-slate-400 font-normal">
            ({reviews.length})
          </span>
        )}
      </h2>

      {/* Overview */}
      {reviews.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-4 flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center shrink-0">
            <div className="text-5xl font-extrabold text-slate-900 dark:text-white">{avgRating}</div>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-4 h-4 ${n <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                />
              ))}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
            </div>
          </div>
          <div className="flex-1 w-full space-y-1.5">
            {distribution.map((d) => (
              <div key={d.stars} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 w-4">{d.stars}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${d.percent}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {user ? (
        <form onSubmit={submit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">
            {userReview ? 'A sua avaliação' : 'Deixe a sua avaliação'}
          </h3>

          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition active:scale-90"
              >
                <Star
                  className={`w-7 h-7 transition ${
                    (hoverRating || rating) >= n
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {rating} / 5
            </span>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partilhe a sua experiência (opcional)"
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-brand-300 rounded-xl text-sm outline-none text-slate-900 dark:text-slate-100 resize-none transition"
          />
          <div className="text-[11px] text-slate-400 dark:text-slate-500 text-right mt-1">
            {comment.length}/500
          </div>

          <div className="flex gap-2 mt-3">
            <Button type="submit" disabled={submitting} className="flex-1 sm:flex-none">
              <Send className="w-4 h-4" />
              {submitting ? 'A enviar...' : (userReview ? 'Actualizar' : 'Submeter')}
            </Button>
            {userReview && (
              <Button type="button" variant="danger" size="md" onClick={deleteReview}>
                <Trash2 className="w-4 h-4" /> Remover
              </Button>
            )}
          </div>
        </form>
      ) : (
        <div className="bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-200 dark:border-brand-800 p-5 mb-4 text-center">
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
            Inicie sessão para deixar a sua avaliação
          </p>
          <Link to="/login">
            <Button size="sm">Iniciar sessão</Button>
          </Link>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
          A carregar avaliações...
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center">
          <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ainda não há avaliações. Seja o primeiro!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {reviews.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {(r.user_name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        {r.user_name || 'Anónimo'}
                      </span>
                      {user && r.user_id === user.id && (
                        <span className="text-[10px] font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-full">
                          Você
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                        />
                      ))}
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
                        {new Date(r.created_at).toLocaleDateString('pt-PT')}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                        {r.comment}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

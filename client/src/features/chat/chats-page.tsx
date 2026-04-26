import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '../../context/auth-context'
import { AppNav } from '../../shared/app-nav'
import { chatService } from './chat-service'
import type { ChatMessageSummary, ChatSummary } from './chat-types'

const formatDateTime = (value?: string) => {
  if (!value) {
    return 'Ще немає повідомлень'
  }

  return new Date(value).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const ChatsPage = () => {
  const { authData } = useAuth()
  const accessToken = authData!.tokens.accessToken
  const authUser = authData!.user

  const [chats, setChats] = useState<ChatSummary[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageSummary[]>([])
  const [draft, setDraft] = useState('')
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) ?? null,
    [chats, selectedChatId],
  )

  const loadChats = async () => {
    setIsLoadingChats(true)
    setError(null)

    try {
      const result = await chatService.list(accessToken)
      setChats(result.chats)

      if (!result.chats.length) {
        setSelectedChatId(null)
        return
      }

      if (authUser.role === 'client') {
        setSelectedChatId(result.chats[0].id)
        return
      }

      const stillExists = result.chats.some((chat) => chat.id === selectedChatId)
      setSelectedChatId(stillExists && selectedChatId ? selectedChatId : result.chats[0].id)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Помилка завантаження чатів')
    } finally {
      setIsLoadingChats(false)
    }
  }

  const loadMessages = async (chatId: string) => {
    setIsLoadingMessages(true)
    setError(null)

    try {
      const result = await chatService.listMessages(chatId, accessToken)
      setMessages(result.messages)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Помилка завантаження повідомлень')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  useEffect(() => {
    void loadChats()
  }, [accessToken])

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([])
      return
    }

    void loadMessages(selectedChatId)
  }, [selectedChatId])

  const handleSend = async () => {
    if (!selectedChatId) {
      return
    }

    const text = draft.trim()
    if (!text) {
      return
    }

    setIsSending(true)
    setError(null)

    try {
      await chatService.sendMessage(selectedChatId, { text }, accessToken)
      setDraft('')
      await Promise.all([loadMessages(selectedChatId), loadChats()])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Помилка надсилання повідомлення')
    } finally {
      setIsSending(false)
    }
  }

  const listContent =
    authUser.role === 'manager' ? (
      <aside className="w-full lg:w-80">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Чати з клієнтами</h2>
            <button
              type="button"
              onClick={() => void loadChats()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Оновити
            </button>
          </div>

          {isLoadingChats ? (
            <p className="text-sm text-slate-500">Завантаження...</p>
          ) : chats.length === 0 ? (
            <p className="text-sm text-slate-500">Ще немає клієнтів для чату.</p>
          ) : (
            <ul className="space-y-2">
              {chats.map((chat) => {
                const isActive = chat.id === selectedChatId
                return (
                  <li key={chat.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedChatId(chat.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                        isActive
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-sm font-semibold">{chat.client.fullName}</p>
                      <p className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                        {chat.client.email}
                      </p>
                      <p className={`mt-1 line-clamp-1 text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                        {chat.lastMessageText ?? 'Ще немає повідомлень'}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>
    ) : null

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_40%),linear-gradient(145deg,_#f8fafc_0%,_#e2e8f0_100%)] px-6 py-10">
      <section className="mx-auto max-w-7xl space-y-6">
        <AppNav title={authUser.role === 'manager' ? 'Чати з клієнтами' : 'Чат з менеджерами'} />

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="flex flex-col gap-6 lg:flex-row">
          {listContent}

          <section className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 border-b border-slate-200 pb-3">
              {authUser.role === 'manager' ? (
                <p className="text-sm font-semibold text-slate-900">
                  {selectedChat ? selectedChat.client.fullName : 'Оберіть чат'}
                </p>
              ) : null}
              <p className="text-xs text-slate-500">
                {selectedChat ? formatDateTime(selectedChat.lastMessageAt) : 'Повідомлення відсутні'}
              </p>
            </div>

            <div className="h-[420px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {isLoadingMessages ? (
                <p className="text-sm text-slate-500">Завантаження повідомлень...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-500">Почніть розмову, надішліть перше повідомлення.</p>
              ) : (
                <ul className="space-y-2">
                  {messages.map((message) => {
                    const isMine = message.sender.id === authUser.id
                    return (
                      <li key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            isMine
                              ? 'bg-slate-900 text-white'
                              : 'border border-slate-200 bg-white text-slate-800'
                          }`}
                        >
                          <p className={`mb-1 flex items-center gap-1.5 text-xs ${isMine ? 'text-slate-300' : 'text-slate-500'}`}>
                            {message.sender.fullName}
                            {message.sender.role === 'manager' && !isMine ? (
                              <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                                Менеджер
                              </span>
                            ) : null}
                          </p>
                          <p>{message.text}</p>
                          <p className={`mt-1 text-[11px] ${isMine ? 'text-slate-300' : 'text-slate-500'}`}>
                            {formatDateTime(message.createdAt)}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void handleSend()
                  }
                }}
                placeholder="Введіть повідомлення..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none ring-sky-300 transition focus:ring disabled:bg-slate-100"
                disabled={!selectedChatId || isSending}
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!selectedChatId || isSending || !draft.trim()}
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                Надіслати
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

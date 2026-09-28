import { useEffect, useState } from 'react'

import { hasSession, subscribeSession } from '../api/session'

export function useSession() {
  const [authed, setAuthed] = useState(hasSession)

  useEffect(() => subscribeSession(() => setAuthed(hasSession())), [])

  return authed
}

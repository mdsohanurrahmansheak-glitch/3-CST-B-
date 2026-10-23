import { useState, type JSX } from 'react'
import { useAuth } from './context/AuthContext'
import AuthScreen from './components/AuthScreen'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Routine from './pages/Routine'
import Subjects from './pages/Subjects'
import Notes from './pages/Notes'
import Members from './pages/Members'
import Chat from './pages/Chat'
import Notices from './pages/Notices'
import Settings from './pages/Settings'
import { Spinner } from './components/ui'
import type { PageId } from './types'

export default function App() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState<PageId>('dashboard')

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>
  }
  
  if (!user) return <AuthScreen />

  const pages: Record<PageId, JSX.Element> = {
    dashboard: <Dashboard goto={setPage} />,
    routine: <Routine />,
    subjects: <Subjects />,
    notes: <Notes />,
    members: <Members />,
    chat: <Chat />,
    notices: <Notices />,
    settings: <Settings />,
  }

  return <Layout page={page} setPage={setPage}>{pages[page]}</Layout>
}
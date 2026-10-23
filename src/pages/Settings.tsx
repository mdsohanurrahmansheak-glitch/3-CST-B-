import { useState } from 'react'
import { Lock, ShieldCheck } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button, Card, Input, SectionTitle } from '../components/ui'

export default function Settings() {
  const { isCR } = useAuth()
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isCR) {
    return <div className="p-8 text-center text-slate-500">Only CR can access this page.</div>
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      return toast('New passwords do not match.', 'error')
    }
    if (newPassword.length < 6) {
      return toast('Password must be at least 6 characters.', 'error')
    }
    
    setLoading(true)
    try {
      await api.updateCRPassword(currentPassword, newPassword)
      toast('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast((err as Error).message || 'Failed to update password', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <SectionTitle 
        title="Admin Settings" 
        subtitle="Manage your CR account security" 
      />
      
      <Card className="p-6">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary">Change Password</h3>
            <p className="text-xs text-slate-500">Update your CR login credentials</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input 
            label="Current Password" 
            type="password" 
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input 
            label="New Password" 
            type="password" 
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input 
            label="Confirm New Password" 
            type="password" 
            placeholder="Re-type new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-800 mt-2">
            <ShieldCheck size={16} className="shrink-0" />
            <p>Make sure to remember your new password. There is no recovery option.</p>
          </div>

          <Button type="submit" variant="accent" className="w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
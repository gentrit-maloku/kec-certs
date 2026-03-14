import AppRouter from './router/AppRouter'
import { Toaster } from 'sonner'

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        closeButton
        toastOptions={{
          style: { fontFamily: 'inherit', borderRadius: '12px', fontSize: '14px' },
          classNames: {
            toast: 'shadow-lg border border-slate-100',
            title: 'font-bold text-slate-800',
            description: 'text-slate-500',
          },
        }}
        icons={{
          success: (
            <span style={{ width: 20, height: 20, background: '#00a0e3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          ),
          error: (
            <span style={{ width: 20, height: 20, background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </span>
          ),
          warning: (
            <span style={{ width: 20, height: 20, background: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </span>
          ),
          info: (
            <span style={{ width: 20, height: 20, background: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </span>
          ),
        }}
      />
      <AppRouter />
    </>
  )
}

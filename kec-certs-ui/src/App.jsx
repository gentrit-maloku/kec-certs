import AppRouter from './router/AppRouter'
import { Toaster } from 'sonner'

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <AppRouter />
    </>
  )
}

import { toast } from 'sonner'

export const notify = {
  success: (msg) => toast.success(msg, { duration: 3000 }),
  error:   (msg) => toast.error(msg,   { duration: 5000 }),
  warning: (msg) => toast.warning(msg, { duration: 4000 }),
  info:    (msg) => toast.info(msg,    { duration: 3000 }),

  // Veprime të zakonshme
  saved:    () => notify.success('Të dhënat u ruajtën me sukses!'),
  deleted:  () => notify.success('U fshi me sukses!'),
  created:  () => notify.success('U krijua me sukses!'),
  updated:  () => notify.success('U përditësua me sukses!'),
  imported: () => notify.success('Importimi u krye me sukses!'),
  exported: () => notify.success('Eksportimi u krye me sukses!'),

  failed:       () => notify.error('Diçka shkoi keq. Ju lutemi provoni sërish.'),
  forbidden:    () => notify.error('Nuk keni leje për këtë veprim.'),
  networkError: () => notify.error('Nuk ka lidhje me serverin.'),
}

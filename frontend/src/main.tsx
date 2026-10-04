import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { queryClient } from '@/api/queryClient'
import { router } from '@/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        {/* Respect the OS "reduce motion" setting for every animation. */}
        <MotionConfig reducedMotion="user">
          <RouterProvider router={router} />
          <Toaster
            position="top-center"
            offset={80}
            toastOptions={{
              classNames: {
                toast: '!rounded-md !border !border-sand !bg-cream !font-sans !text-charcoal !shadow-lift',
                description: '!text-stone',
                actionButton: '!bg-terracotta !text-white',
              },
            }}
          />
        </MotionConfig>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
)

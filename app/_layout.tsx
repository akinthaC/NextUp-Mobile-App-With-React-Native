
import { Slot, Stack } from 'expo-router'
import React from 'react'
import "./../global.css"
import { AuthProvider } from '@/context/authContext'
import { LoaderProvider } from '@/context/LoaderContext'

const RootLayout = () => {
  return (
    <LoaderProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </LoaderProvider>
    
  )
  
  
}

export default RootLayout
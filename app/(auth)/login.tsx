import { View, Text, TextInput, TouchableOpacity, Pressable, KeyboardAvoidingView, Platform, Image } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { login } from '../../services/authService'
import Animated, { FadeIn, FadeOut, FadeInUp, FadeInDown, ZoomIn, BounceIn } from 'react-native-reanimated'
import { ActivityIndicator } from 'react-native-paper'

const LoginScreen = () => {
  const router = useRouter()
  
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      await login(email, password)
      router.replace("/");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Login failed. Please try again.')
      } else {
        setError('Login failed. Please try again.')
      }
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className='flex-1 items-center justify-center px-6 bg-gradient-to-b from-blue-50 to-white'>
        <Animated.View 
          entering={FadeIn.duration(800)}
          className="w-full items-center mb-8"
        >
          {/* Replace with your actual logo */}
          <Animated.View 
            entering={ZoomIn.duration(1000).springify().delay(200)}
            className="w-40 h-20 mb-4 rounded-2xl bg-blue-500 items-center justify-center shadow-lg shadow-blue-500/50"
          >
            <Image 
              source={require('./../../assets/logo/whiteLogo.png')} 
              className="w-100 h-40 mb--5"
              resizeMode="contain"
            />
          </Animated.View>
          
          <Animated.Text 
            entering={FadeInUp.duration(1000).delay(400)}
            className='text-3xl font-bold text-blue-600'
          >
           NextUp
          </Animated.Text>
        </Animated.View>
        
        <Animated.View 
          entering={FadeInUp.duration(800).delay(600)}
          className='w-full max-w-md bg-white p-8 rounded-3xl shadow-lg'
        >
          <Text className='text-2xl font-bold mb-2 text-gray-800'>Welcome Back</Text>
          <Text className='text-gray-500 mb-6'>Login to manage your tasks</Text>
          
          {error ? (
            <Animated.View 
              entering={FadeIn}
              exiting={FadeOut}
              className="bg-red-100 p-3 rounded-lg mb-4"
            >
              <Text className="text-red-700 text-center">{error}</Text>
            </Animated.View>
          ) : null}
          
          <Animated.View entering={FadeInUp.duration(800).delay(800)}>
            <TextInput
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className='bg-gray-100 p-4 rounded-xl w-full mb-4 text-gray-900'
              placeholderTextColor="#9CA3AF"
            />
          </Animated.View>
          
          <Animated.View entering={FadeInUp.duration(800).delay(1000)}>
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className='bg-gray-100 p-4 rounded-xl w-full mb-6 text-gray-900'
              placeholderTextColor="#9CA3AF"
            />
          </Animated.View>
          
          <Animated.View entering={FadeInUp.duration(800).delay(1200)}>
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`bg-blue-600 p-4 rounded-xl w-full items-center justify-center ${isLoading ? 'opacity-90' : ''}`}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className='text-white text-lg font-semibold'>Login</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View 
            entering={FadeInUp.duration(800).delay(1400)}
            className='flex-row justify-center mt-6'
          >
            <Text className='text-gray-500'>Don't have an account? </Text>
            <Pressable 
              onPress={() => router.push('/register')}
              hitSlop={10}
            >
              <Text className='text-blue-600 font-semibold'>Sign up</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  )
}

export default LoginScreen
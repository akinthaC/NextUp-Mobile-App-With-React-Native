import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { QrCode, Smartphone, MapPin, Clock, User, Bell, Calendar, BarChart2 } from 'lucide-react-native';

export default function CustomerView() {
  const [activeTab, setActiveTab] = useState('current');
  
  // Mock data for queues
  const currentQueues = [
    { id: '1', business: 'Starbucks Downtown', position: 3, waitTime: 15, status: 'active' },
    { id: '2', business: 'City Hospital', position: 8, waitTime: 45, status: 'active' },
  ];
  
  const recentQueues = [
    { id: '3', business: 'Hair Salon Elite', date: '2023-10-15', waitTime: 25 },
    { id: '4', business: 'DMV Office', date: '2023-10-10', waitTime: 60 },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-[#2C6BED] pt-12 pb-6 px-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">NextUp</Text>
            <Text className="text-blue-100 mt-1">Your turn is almost here</Text>
          </View>
          <TouchableOpacity className="bg-white/20 p-3 rounded-full">
            <User color="white" size={24} />
          </TouchableOpacity>
        </View>
        
        <View className="mt-6 flex-row justify-between">
          <TouchableOpacity 
            className="bg-white rounded-2xl p-4 flex-1 mr-3 items-center"
            onPress={() => console.log('Scan QR')}
          >
            <QrCode color="#2C6BED" size={32} />
            <Text className="text-[#2C6BED] font-semibold mt-2">Scan QR</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="bg-white rounded-2xl p-4 flex-1 ml-3 items-center"
            onPress={() => console.log('Enter ID')}
          >
            <Smartphone color="#2C6BED" size={32} />
            <Text className="text-[#2C6BED] font-semibold mt-2">Enter ID</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main Content */}
      <ScrollView className="flex-1 px-4 py-6">
        {/* Stats Section */}
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
          <View className="flex-row justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">Your Queue Stats</Text>
            <BarChart2 color="#2C6BED" size={20} />
          </View>
          
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-[#2C6BED]">2</Text>
              <Text className="text-gray-500">Queues</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-[#4ECDC4]">15</Text>
              <Text className="text-gray-500">Min Avg</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-[#FF6B6B]">85%</Text>
              <Text className="text-gray-500">On Time</Text>
            </View>
          </View>
        </View>
        
        {/* Queue Tabs */}
        <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
          <TouchableOpacity 
            className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'current' ? 'bg-white shadow-sm' : ''}`}
            onPress={() => setActiveTab('current')}
          >
            <Text className={`font-semibold ${activeTab === 'current' ? 'text-[#2C6BED]' : 'text-gray-500'}`}>
              Current Queues
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'recent' ? 'bg-white shadow-sm' : ''}`}
            onPress={() => setActiveTab('recent')}
          >
            <Text className={`font-semibold ${activeTab === 'recent' ? 'text-[#2C6BED]' : 'text-gray-500'}`}>
              Recent
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Queue List */}
        {activeTab === 'current' ? (
          <View className="space-y-4">
            {currentQueues.map((queue) => (
              <View key={queue.id} className="bg-white rounded-2xl p-5 shadow-sm">
                <View className="flex-row justify-between items-start">
                  <View>
                    <Text className="text-lg font-bold text-gray-800">{queue.business}</Text>
                    <View className="flex-row items-center mt-2">
                      <MapPin color="#5A6B7C" size={16} />
                      <Text className="text-gray-600 ml-1">Downtown Branch</Text>
                    </View>
                  </View>
                  <View className="bg-[#2C6BED]/10 px-3 py-1 rounded-full">
                    <Text className="text-[#2C6BED] font-semibold">#{queue.position}</Text>
                  </View>
                </View>
                
                <View className="flex-row justify-between mt-4">
                  <View className="flex-row items-center">
                    <Clock color="#5A6B7C" size={16} />
                    <Text className="text-gray-600 ml-1">{queue.waitTime} min wait</Text>
                  </View>
                  <TouchableOpacity className="bg-[#4ECDC4] px-4 py-2 rounded-full">
                    <Text className="text-white font-semibold">Details</Text>
                  </TouchableOpacity>
                </View>
                
                <View className="mt-4">
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-[#2C6BED]" 
                      style={{ width: `${(queue.position / 10) * 100}%` }}
                    />
                  </View>
                  <View className="flex-row justify-between mt-2">
                    <Text className="text-xs text-gray-500">You're {queue.position}rd in line</Text>
                    <Text className="text-xs text-gray-500">Estimated 3:45 PM</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="space-y-4">
            {recentQueues.map((queue) => (
              <View key={queue.id} className="bg-white rounded-2xl p-5 shadow-sm">
                <View className="flex-row justify-between">
                  <Text className="text-lg font-bold text-gray-800">{queue.business}</Text>
                  <Text className="text-gray-500">{queue.date}</Text>
                </View>
                <View className="flex-row justify-between mt-3">
                  <View className="flex-row items-center">
                    <Clock color="#5A6B7C" size={16} />
                    <Text className="text-gray-600 ml-1">{queue.waitTime} min wait</Text>
                  </View>
                  <TouchableOpacity className="flex-row items-center">
                    <Text className="text-[#2C6BED] mr-1">View</Text>
                    <Bell color="#2C6BED" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Notification Bar */}
      <View className="bg-[#4ECDC4]/10 p-4 flex-row items-center">
        <Bell color="#4ECDC4" size={20} className="mr-2" />
        <Text className="text-[#1A2C3B] flex-1">Push notifications enabled</Text>
        <TouchableOpacity>
          <Text className="text-[#2C6BED] font-medium">Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
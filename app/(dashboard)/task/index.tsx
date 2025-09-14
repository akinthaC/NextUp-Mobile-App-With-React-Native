import { View, Text, Pressable, ScrollView, Alert, Touchable, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getAllTasks, deleteTask, taskRef } from '@/services/taskService';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { Task } from '@/types/task';
import { useLoader } from '@/context/LoaderContext';
import { onSnapshot } from 'firebase/firestore';

const TaskScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const router = useRouter();
   const segmant = useSegments()
   const {showLoader , hideLoader} = useLoader();


  const handleFetchData = async () => {
    
    try {
      showLoader();
      const data = await getAllTasks();
      setTasks(data);
    } catch (err) {
      console.log(err);
    }finally{
      hideLoader();
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(id);
              setTasks((prev) => prev.filter((task) => task.id !== id));
            } catch (err) {
              console.log(err);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(taskRef, (snapshot) => {
        const taskList: Task[] = snapshot.docs.map((tasks) => ({
            id: tasks.id,
            ...tasks.data()
        })) as Task[];
        setTasks(taskList);
    });

    return () => unsubscribe();
}, [segmant]);





  return (
    
    <View className="flex-1 bg-gray-50 p-5 relative">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-3xl font-bold text-gray-900">My Tasks</Text>
          <Text className="text-gray-500 mt-1">
           
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleFetchData}
          className="bg-white p-3 rounded-full shadow-sm"
        >
          <Feather name="refresh-ccw" size={20} color="#4f46e5" />
        </TouchableOpacity>
      </View>
    
      <Text className="text-2xl font-bold mb-4 text-gray-800">Task List</Text>

      <ScrollView className="flex-1 w-full">
        {tasks.map((task) => (
          <View
            key={task.id}
            className="bg-white p-4 mb-3 rounded-2xl shadow-md flex-row justify-between items-center"
          >
            {/* Task Info */}
            <Pressable
              onPress={() => router.push(`/(dashboard)/task/${task.id}`)}
              className="flex-1 mr-3"
            >
              <Text className="text-lg font-semibold text-gray-900">
                {task.title}
              </Text>
              <Text className="text-gray-600">{task.description}</Text>
            </Pressable>

            {/* Action buttons in one line */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="p-2 rounded-full bg-blue-100"
                onPress={() => router.push(`/(dashboard)/task/${task.id}`)}
              >
                <MaterialIcons name="edit" size={20} color="#3B82F6" />
              </TouchableOpacity>

              <TouchableOpacity
                className="p-2 rounded-full bg-red-100"
                onPress={() => task.id && handleDelete(task.id)}
              >
                <MaterialIcons name="delete" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-5 right-5">
        <TouchableOpacity
          className="bg-blue-500 rounded-full p-5 shadow-lg"
          onPress={() => router.push('/(dashboard)/task/new')}
        >
          <MaterialIcons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TaskScreen;

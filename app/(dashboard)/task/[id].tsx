import { View, Text, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { TextInput } from 'react-native-paper'
import { router, useLocalSearchParams, useRouter, useSegments } from 'expo-router'
import { createTask, getTaskById, updateTask } from '@/services/taskService'
import { useLoader } from "@/context/LoaderContext"
import { useAuth } from '@/context/authContext'


const TaskFormScreen = () => {
    // const params = useLocalSearchParams()
    //params.id will give you the task id if it exists, otherwise it will be undefined

    const { id } = useLocalSearchParams<{id?: string}>()

    const isNewTask = !id || id === "new";

    const [title, setTitle] = useState<string>('')
    const [description, setDescription] = useState<string>('')
    const router = useRouter()
    const { hideLoader, showLoader } = useLoader()
    
   
    
    useEffect(() => {
    const load = async () => {
        if (!isNewTask && id) {
        try {
            showLoader();
            const task = await getTaskById(id);
            if (task) {
            setTitle(task.title);
            setDescription(task.description);
            } else {
            Alert.alert("Error", "Task not found");
            router.back();
            }
        } catch (error) {
            console.error("Error loading task:", error);
            Alert.alert("Error", "Failed to load task");
            router.back();
        }finally {
            hideLoader();   
        }
    }
    };

    load();
    }, [id]);

     const { user, loading } = useAuth()

    const handleSubmit = async () => {
        //title validation
        if(!title.trim){
            Alert.alert("Validation Error", "Title is required")
        }

        //des validation
        if(!description.trim()){
            Alert.alert("Validation Error", "Description is required")
        }
        

        
        try{
            showLoader()
            if(isNewTask){
                await createTask({title,description,userId: user?.uid})
            }else{
               await updateTask(id,{title,description}) 
            }
         router.back()
            
        } catch (err) {
            console.error(`Error ${isNewTask ? "saving" : "updating"} task`, err)
            Alert.alert("Error", `Fail to ${isNewTask ? "save" : "update"} task`)
        } finally {
            hideLoader()
        }
        

    }

  return (
    <View className='flex-1 w-full p-5'>
        <Text className='text-2xl font-bold mb-4'>
            {isNewTask ? 'Create New Task' : 'Edit Task'}
        </Text>

        <TextInput placeholder='Title'className='border border-gray-300 rounded-md p-2 mb-4' value={title} onChangeText={setTitle}>
        </TextInput>

        <TextInput placeholder='Description'className='border border-gray-300 rounded-md p-2 mb-4' value={description} onChangeText={setDescription}>
        </TextInput>

        <TouchableOpacity className='bg-blue-500 p-3 rounded-md' onPress={handleSubmit}>
            <Text className='text-white text-center'>
               {isNewTask ? 'Add Task' : 'Update Task'}
            </Text>
        </TouchableOpacity>

        <View className='mt-4'>
            <Text className='text-gray-500'>Cancel</Text>
        </View>
      
    </View>
  )
}

export default TaskFormScreen
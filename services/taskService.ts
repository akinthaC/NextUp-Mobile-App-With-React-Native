
import api from "./config/api"
import { addDoc, collection, deleteDoc, doc, getDoc,  query,
  updateDoc,
  where } from "firebase/firestore"
import { db } from "@/firebase"
import { Task } from "@/types/task"
import { getDocs } from "firebase/firestore"

export const getTask = async () => {
    const res = await api.get("/task")
    return res.data
}



export const addTask = async (task: {title: string; description?: string}) => {
    const res = await api.post('/task,',task)
    return res.data;
}

//tasks - collection
export const taskRef = collection(db,"tasks")

export const getAllTaskByUserId = async (userId: string) => {
  const q = query(taskRef, where("userId", "==", userId))

  const querySnapshot = await getDocs(q)
  const taskList = querySnapshot.docs.map((taskRef) => ({
    id: taskRef.id,
    ...taskRef.data()
  })) as Task[]
  return taskList
}


//firebase datasave process
export const createTask = async (task:Task) => {
    const tasksRef = collection(db,"tasks")
    const docRef = await addDoc(tasksRef, task)
    return docRef.id;
}



export const getAllTasks = async () => {
    const snapshot = await getDocs(taskRef);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Task[];
}

export const getTaskById = async(id:string) => {
    const taskDocRef = doc(db,"tasks",id)
    const snapshot = await getDoc(taskDocRef) 
    return snapshot.exists()
        ? ({
            id: snapshot.id,
            ...snapshot.data()
        } as Task): null
}

export const deleteTask = async(id:string) => {
    const taskDocRef = doc(db,"tasks",id);
    return deleteDoc(taskDocRef)
}

export const updateTask = async (id: string, task: Task) => {
    const updateRef = doc(db, "tasks", id)
      const  {id:_id, ...taskData} = task; //excluded id from task data remove id data gdk thinkot meka use karana ek lese anwashya ekk remove krnn palleha vidiya amrui
    return await updateDoc(updateRef, {title: task.title, description: task.description})
    
}



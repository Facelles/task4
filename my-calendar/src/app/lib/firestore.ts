import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export interface EventData {
  title: string;
  start: string;
  end?: string;
  description?: string;
  priority: "normal" | "important" | "critical";
}

export interface FirestoreEvent extends EventData {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const addEvent = async (userId: string, eventData: EventData) => {
  try {
    const eventsRef = collection(db, "users", userId, "events");
    const docRef = await addDoc(eventsRef, {
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { id: docRef.id, ...eventData };
  } catch (e) {
    console.error("Error adding event: ", e);
    throw e;
  }
};

export const getUserEvents = async (userId: string): Promise<FirestoreEvent[]> => {
  try {
    const eventsRef = collection(db, "users", userId, "events");
    const q = query(eventsRef);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as FirestoreEvent[];
  } catch (e) {
    console.error("Error getting events: ", e);
    return [];
  }
};

export const updateEvent = async (userId: string, eventId: string, updatedData: Partial<EventData>) => {
  try {
    const eventRef = doc(db, "users", userId, "events", eventId);
    await updateDoc(eventRef, {
      ...updatedData,
      updatedAt: new Date(),
    });
  } catch (e) {
    console.error("Error updating event: ", e);
    throw e;
  }
};

export const deleteEvent = async (userId: string, eventId: string) => {
  try {
    const eventRef = doc(db, "users", userId, "events", eventId);
    await deleteDoc(eventRef);
  } catch (e) {
    console.error("Error deleting event: ", e);
    throw e;
  }
};

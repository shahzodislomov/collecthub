"use client"

import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/store"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type Habit = string
async function fetchHabits(): Promise<Habit[]> {
    const res = await api.get("/habits")
    return res.data
}
export default function HabitsPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading: authLoading, checkAuth } = useAuthStore()
    const [newHabit, setNewHabit] = useState('')
    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace('/login')
        }
    }, [authLoading, isAuthenticated, router])

    const { data: habits, error: habitError, isLoading: habitLoading } = useQuery({
        queryKey: ['habits'],
        queryFn: fetchHabits,
        enabled: !authLoading && isAuthenticated
    })
    if (authLoading || (!isAuthenticated && authLoading)) {
        return <div>Verifying token...</div>
    }
    if (habitLoading) {
        return <div>Loading...</div>
    }
    if (habitError) {
        return <span>Error: {habitError.message}</span>
    }
    if (!isAuthenticated) {
        return null
    }
    return (
        <div>
            {habits?.map((habit: string, index: number) => (
                <div key={`${habit}-${index}`}>{habit}</div>
            ))}
        </div>
    )
}
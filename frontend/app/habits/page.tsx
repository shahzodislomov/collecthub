"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

export default function HabitsPage() {
    const router = useRouter()
    const [isAuthenticaated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [habits, setHabits] = useState([])
    const [newHabit, setNewHabit] = useState('')
    useEffect(() => {
        if (!isAuthenticaated) {
            router.push("/login")
        }
    }, [isAuthenticaated])
type Habit = string

async function fetchHabits(): Promise<Habit[]> {
    const res = await fetch('/api/habits')
    if (!res.ok) {
        throw new Error('Failed to fetch habits')
    }
    const data: Habit[] = await res.json()
    return data
}

    const queryClient = useQueryClient()
    const { data, error, isLoading } = useQuery({
        queryKey: ['habits'],
        queryFn: fetchHabits
    })
    if (isLoading) {
        return <div>Loading...</div>
    }
    if (error) {
        return <span>Error: {error.message}</span>
    }
    if (!isAuthenticaated) {
        return null
    }
    return (
        <div>
            {data?.map((habit: string) => (
                <div key={habit}>{habit}</div>
            ))}
        </div>
    )
}
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format, subWeeks, subDays, startOfWeek, endOfWeek, getWeek, getYear } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface StatisticsInterfaceProps {
  userId: string
}

interface WeightData {
  date: string
  weight: number
  label: string
}

interface MuscleGroup {
  id: string
  name: string
}

// Type definitions for Supabase query results with !inner joins
interface WorkoutExerciseWithSession {
  total_weight: string | null
  workout_sessions: {
    date: string
    user_id: string
  }[]
}

interface WorkoutExerciseWithSessionAndExercise {
  total_weight: string | null
  workout_sessions: {
    date: string
    user_id: string
  }[]
  exercises: {
    muscle_group_id: string
  }[]
}

export default function StatisticsInterface({ userId }: StatisticsInterfaceProps) {
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: subWeeks(new Date(), 5),
    to: new Date()
  })
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([])
  const [weeklyData, setWeeklyData] = useState<WeightData[]>([])
  const [muscleGroupData, setMuscleGroupData] = useState<{[key: string]: WeightData[]}>({})
  const [dailyData, setDailyData] = useState<WeightData[]>([])
  const [weekdayData, setWeekdayData] = useState<{[key: string]: WeightData[]}>({})
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchMuscleGroups = useCallback(async () => {
    const { data } = await supabase
      .from('muscle_groups')
      .select('*')
      .order('name')
    
    if (data) {
      setMuscleGroups(data)
    }
  }, [supabase])

  const fetchWeeklyData = useCallback(async () => {
    const { data } = await supabase
      .from('workout_exercises')
      .select(`
        total_weight,
        workout_sessions!inner(date, user_id)
      `)
      .eq('workout_sessions.user_id', userId)
      .gte('workout_sessions.date', format(dateRange.from, 'yyyy-MM-dd'))
      .lte('workout_sessions.date', format(dateRange.to, 'yyyy-MM-dd'))

    if (data) {
      const typedData = data as WorkoutExerciseWithSession[]
      const weeklyTotals: {[key: string]: number} = {}
      
      typedData.forEach(item => {
        // Access the first element of the workout_sessions array
        const session = item.workout_sessions[0]
        if (session) {
          const date = new Date(session.date)
          const weekStart = startOfWeek(date)
          const weekKey = format(weekStart, 'yyyy-MM-dd')
          
          if (!weeklyTotals[weekKey]) {
            weeklyTotals[weekKey] = 0
          }
          weeklyTotals[weekKey] += parseFloat(item.total_weight || '0')
        }
      })

      const chartData = Object.entries(weeklyTotals).map(([weekStart, total]) => {
        const date = new Date(weekStart)
        const weekNumber = getWeek(date)
        const year = getYear(date)
        return {
          date: weekStart,
          weight: total / 1000, // Convert to tonnes
          label: `W${weekNumber} ${year}`
        }
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setWeeklyData(chartData)
    }
  }, [supabase, userId, dateRange.from, dateRange.to])

  const fetchMuscleGroupData = useCallback(async () => {
    const data: {[key: string]: WeightData[]} = {}
    
    for (const muscleGroup of muscleGroups) {
      const { data: exerciseData } = await supabase
        .from('workout_exercises')
        .select(`
          total_weight,
          workout_sessions!inner(date, user_id),
          exercises!inner(muscle_group_id)
        `)
        .eq('workout_sessions.user_id', userId)
        .eq('exercises.muscle_group_id', muscleGroup.id)
        .gte('workout_sessions.date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('workout_sessions.date', format(dateRange.to, 'yyyy-MM-dd'))

      if (exerciseData) {
        const typedExerciseData = exerciseData as WorkoutExerciseWithSessionAndExercise[]
        const dailyTotals: {[key: string]: number} = {}
        
        typedExerciseData.forEach(item => {
          // Access the first element of the workout_sessions array
          const session = item.workout_sessions[0]
          if (session) {
            const date = session.date
            if (!dailyTotals[date]) {
              dailyTotals[date] = 0
            }
            dailyTotals[date] += parseFloat(item.total_weight || '0')
          }
        })

        const chartData = Object.entries(dailyTotals).map(([date, total]) => ({
          date,
          weight: total / 1000, // Convert to tonnes
          label: format(new Date(date), 'dd/MM/yyyy')
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7) // Last 7 training days

        data[muscleGroup.name] = chartData
      }
    }
    
    setMuscleGroupData(data)
  }, [supabase, userId, muscleGroups, dateRange.from, dateRange.to])

  const fetchDailyData = useCallback(async () => {
    const { data } = await supabase
      .from('workout_exercises')
      .select(`
        total_weight,
        workout_sessions!inner(date, user_id)
      `)
      .eq('workout_sessions.user_id', userId)
      .gte('workout_sessions.date', format(subDays(new Date(), 7), 'yyyy-MM-dd'))
      .lte('workout_sessions.date', format(new Date(), 'yyyy-MM-dd'))

    if (data) {
      const typedData = data as WorkoutExerciseWithSession[]
      const dailyTotals: {[key: string]: number} = {}
      
      typedData.forEach(item => {
        // Access the first element of the workout_sessions array
        const session = item.workout_sessions[0]
        if (session) {
          const date = session.date
          if (!dailyTotals[date]) {
            dailyTotals[date] = 0
          }
          dailyTotals[date] += parseFloat(item.total_weight || '0')
        }
      })

      const chartData = Object.entries(dailyTotals).map(([date, total]) => ({
        date,
        weight: total / 1000, // Convert to tonnes
        label: format(new Date(date), 'dd/MM/yyyy')
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setDailyData(chartData)
    }
  }, [supabase, userId])

  const fetchWeekdayData = useCallback(async () => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const data: {[key: string]: WeightData[]} = {}

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const { data: weekdayExerciseData } = await supabase
        .from('workout_exercises')
        .select(`
          total_weight,
          workout_sessions!inner(date, user_id)
        `)
        .eq('workout_sessions.user_id', userId)
        .gte('workout_sessions.date', format(subWeeks(new Date(), 7), 'yyyy-MM-dd'))
        .lte('workout_sessions.date', format(new Date(), 'yyyy-MM-dd'))

      if (weekdayExerciseData) {
        const typedWeekdayData = weekdayExerciseData as WorkoutExerciseWithSession[]
        const weekdayTotals: {[key: string]: number} = {}
        
        typedWeekdayData.forEach(item => {
          // Access the first element of the workout_sessions array
          const session = item.workout_sessions[0]
          if (session) {
            const date = new Date(session.date)
            if (date.getDay() === dayOfWeek) {
              const dateKey = session.date
              if (!weekdayTotals[dateKey]) {
                weekdayTotals[dateKey] = 0
              }
              weekdayTotals[dateKey] += parseFloat(item.total_weight || '0')
            }
          }
        })

        const chartData = Object.entries(weekdayTotals).map(([date, total]) => ({
          date,
          weight: total / 1000, // Convert to tonnes
          label: format(new Date(date), 'dd/MM/yyyy')
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7) // Last 7 occurrences

        data[weekdays[dayOfWeek]] = chartData
      }
    }
    
    setWeekdayData(data)
  }, [supabase, userId])

  const fetchStatistics = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      fetchWeeklyData(),
      fetchMuscleGroupData(),
      fetchDailyData(),
      fetchWeekdayData()
    ])
    setLoading(false)
  }, [fetchWeeklyData, fetchMuscleGroupData, fetchDailyData, fetchWeekdayData])

  useEffect(() => {
    fetchMuscleGroups()
  }, [fetchMuscleGroups])

  useEffect(() => {
    if (muscleGroups.length > 0) {
      fetchStatistics()
    }
  }, [dateRange, muscleGroups, fetchStatistics])

  const formatWeight = (value: number) => `${value.toFixed(1)}t`

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 p-2 rounded border border-white/20">
          <p className="text-white text-sm">{`Weight: ${formatWeight(payload[0].value)}`}</p>
        </div>
      )
    }
    return null
  }

  const renderChart = (data: WeightData[], hasData: boolean = true) => {
    if (!hasData || !data.length) {
      return (
        <div className="glass-card p-2">
          <div className="text-white text-center py-8">No data available</div>
        </div>
      )
    }

    const maxValue = Math.max(...data.map(d => d.weight))
    const yAxisMax = Math.ceil(maxValue * 1.2)
    const tickInterval = Math.max(0.1, Math.ceil(yAxisMax / 5 * 10) / 10)

    return (
      <div className="glass-card p-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
            <XAxis 
              dataKey="label" 
              stroke="#ffffff80"
              fontSize={12}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#ffffff80"
              fontSize={12}
              tickFormatter={formatWeight}
              domain={[0, yAxisMax]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="weight" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Date Range Selector */}
        <div className="glass-card p-2">
          <h2 className="text-xl font-semibold text-white mb-4">Select Date Range</h2>
          <div className="flex gap-4 items-center flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[280px] justify-start text-left font-normal glass-button">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 glass-card" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to })
                    }
                  }}
                  numberOfMonths={2}
                  className="rounded-md border-0"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass">
            <TabsTrigger value="weekly">Weekly Weight</TabsTrigger>
            <TabsTrigger value="muscle-groups">Muscle Groups</TabsTrigger>
            <TabsTrigger value="daily">Daily Weight</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-6 mt-6">
            <h2 className="text-2xl font-bold text-white">Total weight lifted per week</h2>
            {renderChart(weeklyData)}
          </TabsContent>

          <TabsContent value="muscle-groups" className="space-y-6 mt-6">
            {muscleGroups.map(muscleGroup => {
              const data = muscleGroupData[muscleGroup.name] || []
              return (
                <div key={muscleGroup.id} className="space-y-2">
                  <h2 className="text-2xl font-bold text-white capitalize">
                    {muscleGroup.name}
                  </h2>
                  {renderChart(data, data.length > 0)}
                </div>
              )
            })}
          </TabsContent>

          <TabsContent value="daily" className="space-y-6 mt-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Total weight lifted per day</h2>
              {renderChart(dailyData)}
            </div>
            
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(weekday => {
              const data = weekdayData[weekday] || []
              return (
                <div key={weekday} className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">{weekday}</h2>
                  {renderChart(data, data.length > 0)}
                </div>
              )
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
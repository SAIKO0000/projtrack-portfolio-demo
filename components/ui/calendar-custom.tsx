"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { ChevronLeft, ChevronRight, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

// Custom SelectContent without auto-scroll buttons
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1 overflow-y-auto",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = "SelectContent"

// Custom SelectItem without hover scroll
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = "SelectItem"

interface CalendarProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  initialFocus?: boolean
  className?: string
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  className,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(selected || new Date())
    const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()
    // Generate year options (current year ± 10 years for shorter dropdown)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)
  
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  
  const handleMonthChange = (monthIndex: string) => {
    setCurrentDate(new Date(year, parseInt(monthIndex), 1))
  }
  
  const handleYearChange = (selectedYear: string) => {
    setCurrentDate(new Date(parseInt(selectedYear), month, 1))
  }
  
  const selectDate = (day: number) => {
    const date = new Date(year, month, day)
    if (disabled && disabled(date)) return
    onSelect?.(date)
  }
  
  const isSelected = (day: number) => {
    if (!selected) return false
    const date = new Date(year, month, day)
    return selected.toDateString() === date.toDateString()
  }
  
  const isToday = (day: number) => {
    const today = new Date()
    const date = new Date(year, month, day)
    return today.toDateString() === date.toDateString()
  }
  
  const isDisabled = (day: number) => {
    if (!disabled) return false
    const date = new Date(year, month, day)
    return disabled(date)
  }
  
  // Generate calendar days
  const days = []
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayWeekday; i++) {
    days.push(null)
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }
  
  return (    <div className={cn("p-3", className)}>
      {/* Enhanced Header with Month/Year Selectors */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={previousMonth}
          className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center space-x-2">
          {/* Month Selector */}
          <Select value={month.toString()} onValueChange={handleMonthChange}>            <SelectTrigger className="w-[110px] h-8 text-sm">
              <SelectValue>
                {MONTHS[month].slice(0, 3)}
              </SelectValue>
            </SelectTrigger>            <SelectContent className="max-h-[200px]">
              {MONTHS.map((monthName, index) => (
                <SelectItem key={monthName} value={index.toString()}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Year Selector */}
          <Select value={year.toString()} onValueChange={handleYearChange}>            <SelectTrigger className="w-[80px] h-8 text-sm">
              <SelectValue>
                {year}
              </SelectValue>
            </SelectTrigger>            <SelectContent className="max-h-[200px]">
              {yearOptions.map((yearOption) => (
                <SelectItem key={yearOption} value={yearOption.toString()}>
                  {yearOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={nextMonth}
          className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Quick Jump Buttons */}
      <div className="flex justify-center space-x-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDate(new Date())}
          className="h-6 px-2 text-xs"
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDate(new Date(currentYear, 0, 1))}
          className="h-6 px-2 text-xs"
        >
          This Year
        </Button>
      </div>
      
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-0 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="h-9 w-9 text-center text-[0.8rem] font-normal text-muted-foreground flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>
        {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0">
        {days.map((day, index) => (
          <div key={`day-${index}-${day}`} className="h-9 w-9 text-center text-sm p-0 relative">
            {day && (
              <Button
                variant="ghost"
                className={cn(
                  "h-9 w-9 p-0 font-normal",
                  isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  isToday(day) && !isSelected(day) && "bg-accent text-accent-foreground",
                  isDisabled(day) && "text-muted-foreground opacity-50 cursor-not-allowed"
                )}
                onClick={() => selectDate(day)}
                disabled={isDisabled(day)}
              >
                {day}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
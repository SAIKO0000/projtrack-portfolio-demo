"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    const [checked, setChecked] = React.useState(props.checked || false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked
      setChecked(newChecked)
      onCheckedChange?.(newChecked)
      props.onChange?.(e)
    }

    // Sync with external checked prop
    React.useEffect(() => {
      setChecked(props.checked || false)
    }, [props.checked])

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          className="sr-only"
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <div className={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-gray-300 flex items-center justify-center transition-colors",
          "hover:border-gray-400",
          checked ? "bg-blue-600 border-blue-600" : "bg-white",
          className
        )}>
          <Check className={cn(
            "h-3 w-3 text-white transition-opacity",
            checked ? "opacity-100" : "opacity-0"
          )} />
        </div>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }

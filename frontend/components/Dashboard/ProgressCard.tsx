import React from 'react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

interface ProgressCardProps {
  percentage: number
  increase: string
  target: string
  revenue: string
  today: string
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  percentage,
  increase,
  target,
  revenue,
  today,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex flex-col items-center justify-between">
      <div className="w-full text-left mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
          Monthly Target
        </h3>
        <p className="text-sm text-gray-500">
          Target you’ve set for each month
        </p>
      </div>

      <div className="w-32 h-32 mb-4">
        <CircularProgressbar
          value={percentage}
          text={`${percentage}%`}
          styles={buildStyles({
            textColor: '#111827',
            pathColor: '#7C3AED',
            trailColor: '#E5E7EB',
          })}
        />
      </div>

      <p className="text-gray-500 text-center mb-4">
        You earn ${today} today, it’s higher than last month. Keep up your good
        work!
      </p>

      <div className="flex justify-between w-full border-t border-gray-100 dark:border-gray-800 pt-3">
        <div className="text-center flex-1">
          <p className="text-sm text-gray-400">Target</p>
          <p className="font-semibold text-gray-800">${target}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-sm text-gray-400">Revenue</p>
          <p className="font-semibold text-gray-800">${revenue}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-sm text-gray-400">Today</p>
          <p className="font-semibold text-gray-800">${today}</p>
        </div>
      </div>
    </div>
  )
}

export default ProgressCard

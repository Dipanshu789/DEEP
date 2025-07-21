import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface AttendanceDonutChartProps {
  total: number;
  present: number;
  absent: number;
}

const COLORS = ["#3B82F6", "#FACC15", "#374151"];
// Soft blue, yellow, dark gray

const RADIAN = Math.PI / 180;

const renderCenterText = (total: number) => (
  <text
    x="50%"
    y="50%"
    textAnchor="middle"
    dominantBaseline="middle"
    fontSize="2.2rem"
    fontWeight="700"
    fill="#22223B"
    fontFamily="'Inter', 'Roboto', sans-serif"
  >
    {total}
  </text>
);

export const AttendanceDonutChart: React.FC<AttendanceDonutChartProps> = ({ total, present, absent }) => {
  const data = [
    { name: "Total Members", value: total },
    { name: "Present Today", value: present },
    { name: "Absent Today", value: absent },
  ];

  // Only show present/absent as slices, total is for center text
  const pieData = [
    { name: "Present Today", value: present },
    { name: "Absent Today", value: absent },
    { name: "Total Members", value: total }
  ];

  return (
    <div className="w-full h-72 flex flex-col items-center justify-center p-0 m-0" style={{ background: 'none', boxShadow: 'none', borderRadius: 0 }}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart style={{ background: 'none' }}>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index + 1]} />
            ))}
            {/* Center text */}
            {renderCenterText(total)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col items-center mt-4 w-full">
        <div className="flex justify-between w-full max-w-xs mx-auto mb-1">
          <span className="text-xs font-semibold tracking-wide" style={{letterSpacing: '0.02em', fontFamily: 'Inter, Roboto, sans-serif'}}>
            Total Members
          </span>
          <span className="text-xs font-bold text-blue-600">{total}</span>
        </div>
        <div className="flex justify-between w-full max-w-xs mx-auto mb-1">
          <span className="text-xs font-semibold tracking-wide" style={{letterSpacing: '0.02em', fontFamily: 'Inter, Roboto, sans-serif'}}>
            Present Today
          </span>
          <span className="text-xs font-bold text-yellow-500">{present}</span>
        </div>
        <div className="flex justify-between w-full max-w-xs mx-auto">
          <span className="text-xs font-semibold tracking-wide" style={{letterSpacing: '0.02em', fontFamily: 'Inter, Roboto, sans-serif'}}>
            Absent Today
          </span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{absent}</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDonutChart;

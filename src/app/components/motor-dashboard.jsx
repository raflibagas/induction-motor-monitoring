"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const MotorDashboard = () => {
  const [motorData, setMotorData] = useState({
    speed: 0,
    referenceSpeed: 0,
    isActive: false,
    vsdStatus: "OFF",
    mode: "manual",
    direction: "forward",
    current: [],
    timestamp: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastValidSpeed, setLastValidSpeed] = useState(0);

  // Fetch data from our API
  const fetchData = async () => {
    try {
      const response = await fetch("/api/motor");
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      // setMotorData(data);
      setError(null);

      const currentSpeed =
        data.vsdStatus === "OFF"
          ? 0
          : data.speed === 0
          ? lastValidSpeed
          : data.speed;

      // Only update lastValidSpeed if VSD is ON and speed is non-zero
      if (data.vsdStatus === "ON" && data.speed !== 0) {
        setLastValidSpeed(data.speed);
      }

      setMotorData({
        ...data,
        speed: currentSpeed,
      });

      // if (data.isStale) {
      //   // Set default values when data is stale
      //   setMotorData({
      //     speed: 0,
      //     referenceSpeed: 0,
      //     vsdStatus: "OFF",
      //     motorStatus: "OFF",
      //     mode: "No Action",
      //     direction: "No Action",
      //     // current: [],
      //     // lastUpdate: "No Data",
      //   });
      // } else {
      //   setMotorData({
      //     ...data,
      //     speed: currentSpeed,
      //     lastUpdate: new Date(data.lastDataTimestamp).toLocaleString(),
      //   });
      // }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 500);
    return () => clearInterval(interval);
  }, []);

  const getGaugeColor = (value) => {
    const maxRPM = 85; // Assuming 5000 is max RPM
    const warningThreshold = 0.9; // 80% of max value

    if (value >= maxRPM * warningThreshold) {
      return "#EF4444"; // Red color for high values
    }
    return "#4F46E5"; // Default blue color
  };

  // Gauge chart data preparation
  const gaugeData = [
    { name: "speed", value: motorData.speed },
    { name: "remaining", value: 85 - motorData.speed },
  ];
  const GAUGE_COLORS = ["#4F46E5", "#F3F4F6"]; // Indigo for active, light gray for inactive

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-800">
        Loading...
      </div>
    );
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div
      className="max-w-6xl mx-auto bg-white min-h-screen p-8"
      style={{
        backgroundColor: "transparent",
      }}
    >
      <h1 className="text-3xl font-bold mb-8 text-gray-800 flex justify-center -mt-8">
        Induction Motor Monitoring Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Current Status */}
        <div className="bg-gray-50 p-6 rounded-xl shadow-lg border-2 border-gray-200">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-center">
            Current Value
          </h2>

          {/* RPM Gauge */}
          <div className="h-64 mb-4 -mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="50%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={0}
                  dataKey="value"
                >
                  {gaugeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0 ? getGaugeColor(motorData.speed) : "#F3F4F6"
                      }
                    />
                  ))}
                </Pie>
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-3xl font-bold"
                  fill="#1F2937"
                >
                  {motorData.speed.toFixed(1)}
                </text>
                <text
                  x="50%"
                  y="65%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm"
                  fill="#6B7280"
                >
                  RPM
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 -mt-20">
            <div className="flex justify-between items-center text-gray-600">
              <span>Reference Speed:</span>
              <span className="font-semibold text-indigo-600">
                {motorData.referenceSpeed.toFixed(1)} RPM
              </span>
            </div>

            <div className="text-md text-gray-500">
              Last Update: {new Date(motorData.timestamp).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-gray-50 p-6 rounded-xl shadow-lg border-2 border-gray-200 space-y-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex justify-center">
            Current Status
          </h2>
          {/* VSD Status */}
          <div className="flex justify-between items-center mt-8">
            <span className="text-gray-600">Motor Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                motorData.vsdStatus === "ON"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {motorData.vsdStatus.toUpperCase()}
            </span>
          </div>

          {/* Active Status */}
          <div className="flex justify-between items-center mt-8">
            <span className="text-gray-600">VSD Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                motorData.vsdStatus === "ON"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {motorData.vsdStatus.toUpperCase()}
            </span>
          </div>

          {/* VSD Mode */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">VSD Mode:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                motorData.mode === "auto"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-indigo-100 text-indigo-800"
              }`}
            >
              {motorData.mode.toUpperCase()}
            </span>
          </div>

          {/* Direction */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Rotation Direction:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                motorData.direction === "forward"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {motorData.direction.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Current Graph */}
      <div className="bg-gray-50 p-6 rounded-xl shadow-lg border-2 border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex justify-center">
          Motor Current History
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[...motorData.current].reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="timestamp"
                stroke="#6B7280"
                tickFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  date.setHours(date.getHours() - 7); // Add 5 hours
                  return date.toLocaleTimeString();
                }}
              />
              <YAxis
                // domain={[0, (dataMax) => Math.ceil(dataMax + 50)]}
                stroke="#6B7280"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                }}
                labelFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  date.setHours(date.getHours() - 7); // Add 5 hours
                  return date.toLocaleString();
                }}
                formatter={(value) => [`${value} A`, "Motor Current"]}
                labelStyle={{ color: "#4F46E5" }} // This changes the label color
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4F46E5"
                name="Motor Current"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MotorDashboard;

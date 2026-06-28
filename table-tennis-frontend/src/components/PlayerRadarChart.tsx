import React from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export interface PlayerStats {
  speed: number;
  power: number;
  spin: number;
  defense: number;
  stamina: number; // Added for 5-point radar
}

interface PlayerRadarChartProps {
  stats?: PlayerStats;
  playerName: string;
}

const PlayerRadarChart: React.FC<PlayerRadarChartProps> = ({ stats, playerName }) => {
  // If stats aren't provided, generate random stats for visual demonstration
  const radarStats = stats || {
    speed: Math.floor(Math.random() * 30) + 60,
    power: Math.floor(Math.random() * 30) + 60,
    spin: Math.floor(Math.random() * 30) + 60,
    defense: Math.floor(Math.random() * 30) + 60,
    stamina: Math.floor(Math.random() * 30) + 60,
  };

  const data = {
    labels: ["Speed", "Power", "Spin", "Defense", "Stamina"],
    datasets: [
      {
        label: `${playerName}'s Skill Profile`,
        data: [
          radarStats.speed,
          radarStats.power,
          radarStats.spin,
          radarStats.defense,
          radarStats.stamina,
        ],
        backgroundColor: "rgba(74, 238, 255, 0.2)",
        borderColor: "rgba(74, 238, 255, 1)",
        pointBackgroundColor: "rgba(212, 175, 55, 1)", // Gold points
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(212, 175, 55, 1)",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        angleLines: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        pointLabels: {
          color: "#D8FBFF",
          font: {
            size: 14,
            family: "'Inter', sans-serif",
            weight: "bold" as const,
          },
        },
        ticks: {
          color: "transparent", // Hide numbers on the web
          backdropColor: "transparent",
          stepSize: 20,
          max: 100,
          min: 0,
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Hide legend to keep it clean
      },
      tooltip: {
        backgroundColor: "rgba(6, 29, 35, 0.9)",
        titleColor: "#4AEEFF",
        bodyColor: "#fff",
        borderColor: "rgba(74, 238, 255, 0.3)",
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="w-full h-full min-h-[300px] relative flex justify-center items-center">
      <Radar data={data} options={options} />
    </div>
  );
};

export default PlayerRadarChart;

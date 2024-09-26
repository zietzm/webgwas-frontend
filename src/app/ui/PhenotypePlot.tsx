import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import HighchartsBoost from "highcharts/modules/boost";
if (typeof Highcharts === "object") {
  HighchartsBoost(Highcharts);
}

export default function PhenotypePlot({
  data,
  xlab,
  ylab,
  title,
}: {
  data: number[][];
  xlab: string;
  ylab: string;
  title: string;
}) {
  const options = {
    credits: {
      enabled: false,
    },
    chart: {
      type: "scatter",
      zoomType: "xy",
    },
    boost: {
      useGPUTranslations: true,
      usePreAllocated: true,
    },
    title: {
      text: title,
    },
    xAxis: {
      min: 0,
      max: 1,
      gridLineWidth: 1,
      minPadding: 0,
      maxPadding: 0,
      title: {
        text: xlab,
        style: {
          fontSize: "17px",
        },
      },
      showLastLabel: true,
    },
    yAxis: {
      min: 0,
      max: 1,
      gridLineWidth: 1,
      minPadding: 0,
      maxPadding: 0,
      title: {
        text: ylab,
        style: {
          fontSize: "17px",
        },
      },
      showLastLabel: true,
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      enabled: false,
    },
    series: [
      {
        data: [
          [0, 0],
          [1, 1],
        ],
        type: "line",
        color: "grey",
        dashStyle: "dash",
        lineWidth: 1,
        opacity: 0.5,
        animation: false,
        zIndex: 0,
      },
      {
        data: data,
        type: "scatter",
        turboThreshold: 0,
        boostThreshold: 1,
        marker: {
          symbol: "circle",
          radius: 5,
          fillColor: "rgba(44, 175, 254, .1)",
        },
        opacity: 0,
        zIndex: 1,
      },
    ],
  };
  return (
    <div>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
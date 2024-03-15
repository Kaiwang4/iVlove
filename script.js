$(function () {
  var zoomedChart = $("#chart")
    .dxChart({
      palette: "Harmony Light",
      dataSource: zoomingData,
      size: {
        height: 400,
      },
      margin: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 30
    },
      title: {
        text: "Sensor Data",
        font: {
          size: 20,
          weight: 600,
        },
        horizontalAlignment: "left",
      },
      series: [
        {
          argumentField: "arg",
          valueField: "y1",
          name: "Item",
        },
        {
          argumentField: "arg",
          valueField: "y2",
          name: "Item1",
        },
      ],
      valueAxis: {
        grid: {
          visible: false
        }
      },
      legend: {
        position: "inside",
        verticalAlignment: "top",
        horizontalAlignment: "right",
        columnCount: 2,
      },
      crosshair: {
        enabled: true,
          dashStyle: 'dot',
          color: 'gray',
          width: 2,
          label: {
            visible: false,
          }  
      },
      tooltip: {
        enabled: true,
        shared: true,
        font: {
          color: "white",
        },
        customizeTooltip: function (arg) {
          var points = arg.points,
              items = [];
              
          points.forEach(function (point) {
            items.push('<span style="color:' + point.point.getColor() + '">&#9679;</span>' + ' Y ' + point.valueText);
          });
    
          return {
            html: items.join("<br/>"),
            color: "#414140",
          };
        },
      },
      argumentAxis: {
        visualRange: {
          startValue: 300,
          endValue: 500,
        },
      },
      scrollBar: {
        visible: true,
      },
      zoomAndPan: {
        argumentAxis: "both",
        valueAxis: "both",
        dragToZoom: true,
        allowMouseWheel: true,
      },
      export: {
        enabled: true,
        formats: ["PNG", "JPEG"],
      },
    })
    .dxChart("instance");

  var classifiedStates = states.reduce(function (acc, item) {
    var targetState = acc.find((state) => state.name === item.name);
    if (!targetState) {
      targetState = {
        name: item.name,
        populationElder: 0,
        populationYoung: 0,
        area: item.area,
        region: item.region,
      };
      acc.push(targetState);
    }
    if (item.older === "Yes") {
      targetState.populationElder += item.population;
    } else {
      targetState.populationYoung += item.population;
    }
    return acc;
  }, []);

  var selectedStateData = null;

  $("#datagrid").dxDataGrid({
    palette: "bright",
    dataSource: states,
    groupPanel: { visible: false },
    grouping: {
      autoExpandAll: false,
    },
    showColumnLines:false,
    showRowLines: true,
    headerFilter: { visible: true },
    rowAlternationEnabled: true,
  rowAlternationEnabled: true,
    series: {
      argumentField: "name",
      valueField: "population",
    },   
    columns: [
      { dataField: "name", allowHeaderFiltering: false, width: 140 },
      {
        dataField: "population",
        allowHeaderFiltering: false,
        width: 100,
        dataType: "number",
        caption: "Population",
        format: function (value) {
          return value.toFixed(2);
        },
      },
      {
        dataField: "capital",
        allowHeaderFiltering: false,
        width: 140
      },
      {
        dataField: "area",
        allowHeaderFiltering: false,
        caption: "Area (km²)",
        dataType: "number",
      },
      {
        caption: "Region",
        dataField: "region",
        allowHeaderFiltering: false,
        showWhenGrouped: false,
        headerFilter: {
          visible: true,
        },
        groupCellTemplate: function (container, options) {
          container.text(options.text.replace("Region: ", ""));
        },
      },
      {
        dataField: "older",
        allowHeaderFiltering: false,
      },
    ],
    summary: {
      totalItems: [
        {
          column: "population",
          summaryType: "sum",
          customizeText: function (data) {
            return "Sum: " + data.value.toLocaleString();
          },
        },
      ],
    },
    onInitialized: function (e) {
      e.component.columnOption("region", "groupIndex", 0);
    },
    onRowClick: function (e) {
      selectedStateData = e.data;
      $("#bar-chart")
        .dxChart("instance")
        .option("dataSource", classifiedStates);
    },
    onSelectionChanged: function (selectedItems) {
      var data = selectedItems.selectedRowsData[0];
      if (data) {
        var chartInstance = $("#bar-chart").dxChart("instance");
        chartInstance.option("dataSource", classifiedStates);
        chartInstance.clearSelection();
        chartInstance.option("commonSeriesSettings.point", {
          color: function (pointInfo) {
            if (pointInfo.data.name === data.name) {
              return "gray";
            }
            return;
          },
        });
      }
    },
    selection: {
      mode: "single", 
    },
    
  });

  $("#bar-chart").dxChart({
    palette: "bright",
    dataSource: classifiedStates,
    commonSeriesSettings: {
      argumentField: "name",
      type: "stackedBar",
    },
    margin: {
      top: 20,
      bottom: 5,
      left: 20,
      right: 30
  },
    series: [
      {
        valueField: "populationYoung",
        name: "Younge",
      },
      {
        valueField: "populationElder",
        name: "Old",
      },
    ],
    legend: {
      position: "inside",
      verticalAlignment: "top",
      horizontalAlignment: "right",
      columnCount: 2,
    },
    title: {
      text: "Top 10 Most Populated States in US",
      font: {
        size: 20,
        weight: 600,
      },
      horizontalAlignment: "left",
    },
    tooltip: {
      enabled: true,
      font: {
        color: "white",
      },
      customizeTooltip: function (arg) {
        if (
          selectedStateData &&
          selectedStateData.name === arg.point.data.name
        ) {
          var youngPopulation =
            (arg.point.data.populationYoung / 1000000).toFixed(1) + "M";
          var elderPopulation =
            (arg.point.data.populationElder / 1000000).toFixed(1) + "M";
          return {
            text:
              arg.point.data.name +
              "\nYoung: " +
              youngPopulation +
              "\nOld: " +
              elderPopulation,
            color: "#414140",
          };
        }
        var area_km2 = arg.point.data.area.toLocaleString();
        var area_m2 = Number(
          (arg.point.data.area * (96713 / 250483)).toFixed(0)
        ).toLocaleString();

        return {
          text: `Area: ${area_km2} km² (${area_m2} m²)`,
          color: "#414140",
        };
      },
    },
    valueAxis: {
      title: {
        text: "Population",
      },
    },
    argumentAxis: {
      title: {
        text: "State",
      },
    },
  });
});

var zoomingData = [
  { arg: 10, y1: -12, y2: 10, y3: 32 },
  { arg: 20, y1: -32, y2: 30, y3: 12 },
  { arg: 40, y1: -20, y2: 20, y3: 30 },
  { arg: 50, y1: -39, y2: 50, y3: 19 },
  { arg: 60, y1: -10, y2: 10, y3: 15 },
  { arg: 75, y1: 10, y2: 10, y3: 15 },
  { arg: 80, y1: 30, y2: 50, y3: 13 },
  { arg: 90, y1: 40, y2: 50, y3: 14 },
  { arg: 100, y1: 50, y2: 90, y3: 90 },
  { arg: 105, y1: 40, y2: 175, y3: 120 },
  { arg: 110, y1: -12, y2: 10, y3: 32 },
  { arg: 120, y1: -32, y2: 30, y3: 12 },
  { arg: 130, y1: -20, y2: 20, y3: 30 },
  { arg: 140, y1: -12, y2: 10, y3: 32 },
  { arg: 150, y1: -32, y2: 30, y3: 12 },
  { arg: 160, y1: -20, y2: 20, y3: 30 },
  { arg: 170, y1: -39, y2: 50, y3: 19 },
  { arg: 180, y1: -10, y2: 10, y3: 15 },
  { arg: 185, y1: 10, y2: 10, y3: 15 },
  { arg: 190, y1: 30, y2: 100, y3: 13 },
  { arg: 200, y1: 40, y2: 110, y3: 14 },
  { arg: 210, y1: 50, y2: 90, y3: 90 },
  { arg: 220, y1: 40, y2: 95, y3: 120 },
  { arg: 230, y1: -12, y2: 10, y3: 32 },
  { arg: 240, y1: -32, y2: 30, y3: 12 },
  { arg: 255, y1: -20, y2: 20, y3: 30 },
  { arg: 270, y1: -12, y2: 10, y3: 32 },
  { arg: 280, y1: -32, y2: 30, y3: 12 },
  { arg: 290, y1: -20, y2: 20, y3: 30 },
  { arg: 295, y1: -39, y2: 50, y3: 19 },
  { arg: 300, y1: -10, y2: 10, y3: 15 },
  { arg: 310, y1: 10, y2: 10, y3: 15 },
  { arg: 320, y1: 30, y2: 100, y3: 13 },
  { arg: 330, y1: 40, y2: 110, y3: 14 },
  { arg: 340, y1: 50, y2: 90, y3: 90 },
  { arg: 350, y1: 40, y2: 95, y3: 120 },
  { arg: 360, y1: -12, y2: 10, y3: 32 },
  { arg: 367, y1: -32, y2: 30, y3: 12 },
  { arg: 370, y1: -20, y2: 20, y3: 30 },
  { arg: 380, y1: -12, y2: 10, y3: 32 },
  { arg: 390, y1: -32, y2: 30, y3: 12 },
  { arg: 400, y1: -20, y2: 20, y3: 30 },
  { arg: 410, y1: -39, y2: 50, y3: 19 },
  { arg: 420, y1: -10, y2: 10, y3: 15 },
  { arg: 430, y1: 10, y2: 10, y3: 15 },
  { arg: 440, y1: 30, y2: 100, y3: 13 },
  { arg: 450, y1: 40, y2: 110, y3: 14 },
  { arg: 460, y1: 50, y2: 90, y3: 90 },
  { arg: 470, y1: 40, y2: 95, y3: 120 },
  { arg: 480, y1: -12, y2: 10, y3: 32 },
  { arg: 490, y1: -32, y2: 30, y3: 12 },
  { arg: 500, y1: -20, y2: 20, y3: 30 },
  { arg: 510, y1: -12, y2: 10, y3: 32 },
  { arg: 520, y1: -32, y2: 30, y3: 12 },
  { arg: 530, y1: -20, y2: 20, y3: 30 },
  { arg: 540, y1: -39, y2: 50, y3: 19 },
  { arg: 550, y1: -10, y2: 10, y3: 15 },
  { arg: 555, y1: 10, y2: 10, y3: 15 },
  { arg: 560, y1: 30, y2: 100, y3: 13 },
  { arg: 570, y1: 40, y2: 110, y3: 14 },
  { arg: 580, y1: 50, y2: 90, y3: 90 },
  { arg: 590, y1: 40, y2: 95, y3: 12 },
  { arg: 600, y1: -12, y2: 10, y3: 32 },
  { arg: 610, y1: -32, y2: 30, y3: 12 },
  { arg: 620, y1: -20, y2: 20, y3: 30 },
  { arg: 630, y1: -12, y2: 10, y3: 32 },
  { arg: 640, y1: -32, y2: 30, y3: 12 },
  { arg: 650, y1: -20, y2: 20, y3: 30 },
  { arg: 660, y1: -39, y2: 50, y3: 19 },
  { arg: 670, y1: -10, y2: 10, y3: 15 },
  { arg: 680, y1: 10, y2: 10, y3: 15 },
  { arg: 690, y1: 30, y2: 100, y3: 13 },
  { arg: 700, y1: 40, y2: 110, y3: 14 },
  { arg: 710, y1: 50, y2: 90, y3: 90 },
  { arg: 720, y1: 40, y2: 95, y3: 120 },
  { arg: 730, y1: 20, y2: 190, y3: 130 },
  { arg: 740, y1: -32, y2: 30, y3: 12 },
  { arg: 750, y1: -20, y2: 20, y3: 30 },
  { arg: 760, y1: -12, y2: 10, y3: 32 },
  { arg: 770, y1: -32, y2: 30, y3: 12 },
  { arg: 780, y1: -20, y2: 20, y3: 30 },
  { arg: 790, y1: -39, y2: 50, y3: 19 },
  { arg: 800, y1: -10, y2: 10, y3: 15 },
  { arg: 810, y1: 10, y2: 10, y3: 15 },
  { arg: 820, y1: 30, y2: 100, y3: 13 },
  { arg: 830, y1: 40, y2: 110, y3: 14 },
  { arg: 840, y1: 50, y2: 90, y3: 90 },
  { arg: 850, y1: 40, y2: 95, y3: 120 },
  { arg: 860, y1: -12, y2: 10, y3: 32 },
  { arg: 870, y1: -32, y2: 30, y3: 12 },
  { arg: 880, y1: -20, y2: 20, y3: 30 },
];

var states = [
  {
    name: "California",
    population: 38802500 * 0.3,
    capital: "Sacramento",
    area: 423967,
    region: "East US",
    older: "Yes",
  },
  {
    name: "California",
    population: 38802500 * 0.7,
    capital: "Sacramento",
    area: 423967,
    region: "East US",
    older: "No",
  },
  {
    name: "Texas",
    population: 26956958 * 0.4,
    capital: "Austin",
    area: 695662,
    region: "South US",
    older: "Yes",
  },
  {
    name: "Texas",
    population: 26956958 * 0.6,
    capital: "Austin",
    area: 695662,
    region: "South US",
    older: "No",
  },
  {
    name: "Florida",
    population: 19893297 * 0.86,
    capital: "Tallahassee",
    area: 170312,
    region: "South US",
    older: "Yes",
  },
  {
    name: "Florida",
    population: 19893297 * 0.14,
    capital: "Tallahassee",
    area: 170312,
    region: "South US",
    older: "No",
  },
  {
    name: "New York",
    population: 19746227 * 0.8,
    capital: "Albany",
    area: 141297,
    region: "North US",
    older: "No",
  },
  {
    name: "New York",
    population: 19746227 * 0.2,
    capital: "Albany",
    area: 141297,
    region: "North US",
    older: "Yes",
  },
  {
    name: "Illinois",
    population: 12880580 * 0.76,
    capital: "Springfield",
    area: 149995,
    region: "East US",
    older: "No",
  },
  {
    name: "Illinois",
    population: 12880580 * 0.24,
    capital: "Springfield",
    area: 149995,
    region: "East US",
    older: "Yes",
  },
  {
    name: "Pennsylvania",
    population: 12787209 * 0.35,
    capital: "Harrisburg",
    area: 119280,
    region: "East US",
    older: "Yes",
  },
  {
    name: "Pennsylvania",
    population: 12787209 * 0.65,
    capital: "Harrisburg",
    area: 119280,
    region: "East US",
    older: "No",
  },
  {
    name: "Ohio",
    population: 11594163 * 0.5,
    capital: "Columbus",
    area: 116098,
    region: "East US",
    older: "Yes",
  },
  {
    name: "Ohio",
    population: 11594163 * 0.5,
    capital: "Columbus",
    area: 116098,
    region: "East US",
    older: "No",
  },
  {
    name: "Georgia",
    population: 10097343 * 0.41,
    capital: "Atlanta",
    area: 153910,
    region: "East US",
    older: "Yes",
  },
  {
    name: "Georgia",
    population: 10097343 * 0.59,
    capital: "Atlanta",
    area: 153910,
    region: "East US",
    older: "No",
  },
  {
    name: "North Carolina",
    population: 9943964 * 0.7,
    capital: "Raleigh",
    area: 139391,
    region: "East US",
    older: "No",
  },
  {
    name: "North Carolina",
    population: 9943964 * 0.3,
    capital: "Raleigh",
    area: 139391,
    region: "East US",
    older: "Yes",
  },
  {
    name: "Michigan",
    population: 9909877 * 0.4,
    capital: "Lansing",
    area: 250487,
    region: "North US",
    older: "Yes",
  },
  {
    name: "Michigan",
    population: 9909877 * 0.6,
    capital: "Lansing",
    area: 250487,
    region: "North US",
    older: "No",
  },
];

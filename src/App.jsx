import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, Download, Plus, X, Settings, Database, FileSpreadsheet, BarChart3, Save, FolderOpen, Filter, Palette, Layout, TrendingUp, Activity, Target } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const DataVisualizationPlatform = () => {
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);
  const [dashboards, setDashboards] = useState([]);
  const [activeDashboard, setActiveDashboard] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState({ x: '', y: '', category: '' });
  const [filters, setFilters] = useState({});
  const [colorScheme, setColorScheme] = useState('default');

  const colorSchemes = {
    default: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347', '#67b7dc'],
    ocean: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'],
    forest: ['#2d4a2b', '#4a7c59', '#8eb897', '#c5d86d', '#f7f3ce', '#e8b04b', '#c85450', '#8b4049'],
    sunset: ['#ff6b6b', '#f9844a', '#ee6c4d', '#c9ada7', '#f8b500', '#ffcb69', '#e76f51', '#f4a261']
  };

  const chartTypes = [
    { id: 'line', name: '折線圖', icon: TrendingUp },
    { id: 'bar', name: '長條圖', icon: BarChart3 },
    { id: 'pie', name: '圓餅圖', icon: Target },
    { id: 'scatter', name: '散點圖', icon: Activity },
    { id: 'area', name: '面積圖', icon: TrendingUp },
    { id: 'radar', name: '雷達圖', icon: BarChart3 }
  ];

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const fileExt = file.name.split('.').pop().toLowerCase();

    reader.onload = (e) => {
      const content = e.target.result;
      let data = [];
      let columns = [];

      if (fileExt === 'csv') {
        const result = Papa.parse(content, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        data = result.data;
        columns = result.meta.fields;
      } else if (['xlsx', 'xls'].includes(fileExt)) {
        const workbook = XLSX.read(content, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
        columns = Object.keys(data[0] || {});
      }

      const newDataset = {
        id: Date.now(),
        name: file.name,
        data: data,
        columns: columns,
        createdAt: new Date().toISOString()
      };

      setDatasets(prev => [...prev, newDataset]);
      setActiveDataset(newDataset.id);
    };

    if (fileExt === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  }, []);

  const createDashboard = useCallback(() => {
    const newDashboard = {
      id: Date.now(),
      name: `儀表板 ${dashboards.length + 1}`,
      charts: [],
      layout: 'grid',
      createdAt: new Date().toISOString()
    };
    setDashboards(prev => [...prev, newDashboard]);
    setActiveDashboard(newDashboard.id);
  }, [dashboards.length]);

  const addChartToDashboard = useCallback((chartType) => {
    if (!activeDashboard || !activeDataset) return;

    const newChart = {
      id: Date.now(),
      type: chartType,
      datasetId: activeDataset,
      columns: { ...selectedColumns },
      filters: { ...filters },
      colorScheme: colorScheme,
      title: `${chartType} 圖表`,
      size: { width: 400, height: 300 },
      position: { x: 0, y: 0 }
    };

    setDashboards(prev => prev.map(d => 
      d.id === activeDashboard 
        ? { ...d, charts: [...d.charts, newChart] }
        : d
    ));
  }, [activeDashboard, activeDataset, selectedColumns, filters, colorScheme]);

  const removeChart = useCallback((dashboardId, chartId) => {
    setDashboards(prev => prev.map(d => 
      d.id === dashboardId 
        ? { ...d, charts: d.charts.filter(c => c.id !== chartId) }
        : d
    ));
  }, []);

  const getFilteredData = useCallback((datasetId, chartFilters = {}) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return [];

    let filteredData = [...dataset.data];
    
    Object.entries(chartFilters).forEach(([column, value]) => {
      if (value && value !== '') {
        filteredData = filteredData.filter(row => row[column] === value);
      }
    });

    return filteredData;
  }, [datasets]);

  const renderChart = useCallback((chart) => {
    const data = getFilteredData(chart.datasetId, chart.filters);
    const colors = colorSchemes[chart.colorScheme || 'default'];

    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.columns.x} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={chart.columns.y} stroke={colors[0]} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.columns.x} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={chart.columns.y} fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey={chart.columns.y}
                nameKey={chart.columns.x}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.columns.x} />
              <YAxis dataKey={chart.columns.y} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={data} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.columns.x} />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey={chart.columns.y} stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey={chart.columns.x} />
              <PolarRadiusAxis />
              <Radar dataKey={chart.columns.y} stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        );
      
      default:
        return <div>未知圖表類型</div>;
    }
  }, [getFilteredData, colorSchemes]);

  const currentDataset = useMemo(() => 
    datasets.find(d => d.id === activeDataset),
    [datasets, activeDataset]
  );

  const currentDashboard = useMemo(() => 
    dashboards.find(d => d.id === activeDashboard),
    [dashboards, activeDashboard]
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 側邊欄 */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">資料視覺化平台</h1>
        </div>
        
        {/* 資料集管理 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Database className="mr-2" size={20} />
              資料集
            </h2>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload size={20} className="text-blue-600 hover:text-blue-800" />
            </label>
          </div>
          
          <div className="space-y-2">
            {datasets.map(dataset => (
              <div
                key={dataset.id}
                onClick={() => setActiveDataset(dataset.id)}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  activeDataset === dataset.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <FileSpreadsheet size={16} className="mr-2" />
                  <span className="text-sm truncate">{dataset.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 儀表板管理 */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Layout className="mr-2" size={20} />
              儀表板
            </h2>
            <Plus
              size={20}
              onClick={createDashboard}
              className="text-green-600 hover:text-green-800 cursor-pointer"
            />
          </div>
          
          <div className="space-y-2">
            {dashboards.map(dashboard => (
              <div
                key={dashboard.id}
                onClick={() => setActiveDashboard(dashboard.id)}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  activeDashboard === dashboard.id
                    ? 'bg-green-100 text-green-800'
                    : 'hover:bg-gray-100'
                }`}
              >
                <span className="text-sm">{dashboard.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="flex-1 flex flex-col">
        {/* 工具列 */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              {currentDataset && (
                <>
                  <select
                    value={selectedColumns.x}
                    onChange={(e) => setSelectedColumns(prev => ({ ...prev, x: e.target.value }))}
                    className="px-3 py-2 border rounded"
                  >
                    <option value="">選擇 X 軸</option>
                    {currentDataset.columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedColumns.y}
                    onChange={(e) => setSelectedColumns(prev => ({ ...prev, y: e.target.value }))}
                    className="px-3 py-2 border rounded"
                  >
                    <option value="">選擇 Y 軸</option>
                    {currentDataset.columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  
                  <select
                    value={colorScheme}
                    onChange={(e) => setColorScheme(e.target.value)}
                    className="px-3 py-2 border rounded"
                  >
                    <option value="default">預設配色</option>
                    <option value="ocean">海洋</option>
                    <option value="forest">森林</option>
                    <option value="sunset">日落</option>
                  </select>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {chartTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => addChartToDashboard(type.id)}
                  disabled={!activeDataset || !activeDashboard}
                  className={`p-2 rounded transition-colors ${
                    !activeDataset || !activeDashboard
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  title={type.name}
                >
                  <type.icon size={20} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 儀表板顯示區域 */}
        <div className="flex-1 p-4 overflow-auto">
          {currentDashboard ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentDashboard.charts.map(chart => (
                <div
                  key={chart.id}
                  className="bg-white rounded-lg shadow p-4"
                  style={{ height: chart.size.height }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{chart.title}</h3>
                    <X
                      size={16}
                      onClick={() => removeChart(currentDashboard.id, chart.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    />
                  </div>
                  {renderChart(chart)}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <BarChart3 size={64} className="mx-auto mb-4 text-gray-300" />
                <p>請先建立或選擇一個儀表板</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataVisualizationPlatform;
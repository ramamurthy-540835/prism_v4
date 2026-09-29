{/* Component Editor Modal */}
      {showComponentEditor && editingComponent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#1E293B',
            borderRadius: '0.5rem',
            width: '100%',
            maxWidth: '32rem',
            maxHeight: '80%',
            overflowY: 'auto',
            border: '1px solid #475569',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #475569',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                Edit Component
              </h2>
              <button
                onClick={() => setShowComponentEditor(false)}
                style={{ padding: '0.5rem', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
              >
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={editingComponent.title}
                  onChange={(e) => setEditingComponent({ ...editingComponent, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#374151',
                    border: '1px solid #6B7280',
                    borderRadius: '0.25rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
                  Description
                </label>
                <textarea
                  value={editingComponent.description}
                  onChange={(e) => setEditingComponent({ ...editingComponent, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#374151',
                    border: '1px solid #6B7280',
                    borderRadius: '0.25rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Color and Shape */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
                    Color
                  </label>
                  <select
                    value={editingComponent.color}
                    onChange={(e) => setEditingComponent({ ...editingComponent, color: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#374151',
                      border: '1px solid #6B7280',
                      borderRadius: '0.import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Settings, Database, Brain, Server, Code, FileText, Upload, Zap, Globe, Shield, Edit3, Save, X, Move, Plus, Trash2, Copy } from 'lucide-react';

const DynamicArchitectureGenerator = () => {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('phi3');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonEditorContent, setJsonEditorContent] = useState('');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState(null);
  const [showComponentEditor, setShowComponentEditor] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const diagramRef = useRef(null);

  // Enhanced default configuration with more models
  const defaultConfig = {
    "title": "Healthcare Data Quality Engine",
    "subtitle": "AI-Powered Agentic Data Validation System",
    "grid": {
      "rows": 6,
      "cols": 4,
      "cellWidth": 280,
      "cellHeight": 120,
      "gap": 20
    },
    "components": {
      "A1": {
        "id": "data_source",
        "title": "Raw Healthcare Dataset",
        "description": "Patient records, demographics, medical history",
        "icon": "database",
        "color": "blue",
        "shape": "rectangle",
        "width": 280,
        "height": 120,
        "details": ["📊 1000+ patient records", "🏥 Multiple data sources", "⚠️ Quality issues present"],
        "connections": ["A2"]
      },
      "A2": {
        "id": "dq_rules",
        "title": "DQ Rules Engine",
        "description": "30+ validation rules",
        "icon": "shield",
        "color": "green",
        "shape": "rectangle",
        "width": 280,
        "height": 120,
        "details": ["✅ Format validation", "📏 Range checks", "🔍 Pattern matching"],
        "connections": ["B2"]
      },
      "B2": {
        "id": "training_data",
        "title": "Training Data Generation",
        "description": "Annotated examples",
        "icon": "file-text",
        "color": "yellow",
        "shape": "rectangle",
        "width": 280,
        "height": 120,
        "details": ["📝 Input-output pairs", "🎯 DQ annotations", "📊 JSON structured"],
        "connections": ["A3"]
      },
      "A3": {
        "id": "ai_model",
        "title": "AI Model Fine-tuning",
        "description": "Large Language Model (EleutherAI/gpt-neo-1.3B)",
        "icon": "brain",
        "color": "purple",
        "shape": "circle",
        "width": 280,
        "height": 280,
        "details": ["Context: 2048 tokens", "Parameters: 1.3B", "Training: JSON-focused", "Output: 9k+ tokens"],
        "connections": ["A4", "B4"]
      },
      "A4": {
        "id": "api_server",
        "title": "REST API Server",
        "description": "Real-time validation service",
        "icon": "server",
        "color": "orange",
        "shape": "square",
        "width": 200,
        "height": 200,
        "details": ["🌐 HTTP endpoints", "⚡ Sub-200ms response", "🔄 1000+ req/min"],
        "connections": ["B4"]
      },
      "B4": {
        "id": "agentic_ai",
        "title": "Agentic AI",
        "description": "Autonomous validation agent",
        "icon": "zap",
        "color": "indigo",
        "shape": "oval",
        "width": 250,
        "height": 150,
        "details": ["🤖 Self-managing", "🧠 Context-aware", "📈 Adaptive learning"],
        "connections": ["A5"]
      },
      "A5": {
        "id": "analytics",
        "title": "Validation Results & Analytics",
        "description": "Detailed quality metrics and insights",
        "icon": "globe",
        "color": "red",
        "shape": "rectangle",
        "width": 280,
        "height": 120,
        "details": ["📊 Quality scores", "🎯 Rule-by-rule analysis", "📈 Trend analytics"],
        "connections": []
      }
    },
    "styles": {
      "blue": { "bg": "#3B82F6", "border": "#60A5FA", "text": "#FFFFFF" },
      "green": { "bg": "#10B981", "border": "#34D399", "text": "#FFFFFF" },
      "yellow": { "bg": "#F59E0B", "border": "#FBBF24", "text": "#FFFFFF" },
      "purple": { "bg": "#8B5CF6", "border": "#A78BFA", "text": "#FFFFFF" },
      "orange": { "bg": "#F97316", "border": "#FB923C", "text": "#FFFFFF" },
      "indigo": { "bg": "#6366F1", "border": "#818CF8", "text": "#FFFFFF" },
      "red": { "bg": "#EF4444", "border": "#F87171", "text": "#FFFFFF" },
      "pink": { "bg": "#EC4899", "border": "#F472B6", "text": "#FFFFFF" },
      "cyan": { "bg": "#06B6D4", "border": "#22D3EE", "text": "#FFFFFF" }
    },
    "genai_models": [
      {
        "id": "phi3",
        "name": "Phi-3 Mini",
        "endpoint": "http://10.100.15.67:12139/v1/chat/completions",
        "description": "Fast general-purpose model"
      },
      {
        "id": "deepseek",
        "name": "DeepSeek Coder",
        "endpoint": "http://10.100.15.67:1137/v1/chat/completions",
        "description": "Specialized for coding tasks"
      },
      {
        "id": "mistral",
        "name": "Mistral 7B",
        "endpoint": "http://10.100.15.67:12143/v1/chat/completions",
        "description": "Balanced performance model"
      },
      {
        "id": "codellama",
        "name": "Code Llama",
        "endpoint": "http://10.100.15.67:12142/v1/chat/completions",
        "description": "Code-specialized model"
      },
      {
        "id": "deepseek_r1",
        "name": "DeepSeek R1",
        "endpoint": "http://10.100.15.67:12141/v1/chat/completions",
        "description": "Advanced reasoning model"
      },
      {
        "id": "sqlcoder",
        "name": "SQL Coder",
        "endpoint": "http://10.100.15.67:1138/v1/chat/completions",
        "description": "SQL-specialized model"
      }
    ]
  };

  // Initialize with default config
  useEffect(() => {
    setConfig(defaultConfig);
    setJsonEditorContent(JSON.stringify(defaultConfig, null, 2));
  }, []);

  // Icon mapping with more options
  const getIcon = (iconName) => {
    const icons = {
      'database': Database,
      'shield': Shield,
      'file-text': FileText,
      'brain': Brain,
      'server': Server,
      'zap': Zap,
      'globe': Globe,
      'code': Code,
      'upload': Upload,
      'download': Download,
      'settings': Settings,
      'edit': Edit3,
      'save': Save,
      'move': Move,
      'plus': Plus,
      'trash': Trash2,
      'copy': Copy
    };
    return icons[iconName] || Database;
  };

  // Convert Excel-like position to grid coordinates
  const parsePosition = (position) => {
    const col = position.charCodeAt(0) - 65;
    const row = parseInt(position.slice(1)) - 1;
    return { row, col };
  };

  // Calculate actual pixel position
  const getPixelPosition = (position) => {
    if (!config) return { x: 0, y: 0 };
    
    const { row, col } = parsePosition(position);
    const { gap } = config.grid;
    
    return {
      x: col * (300 + gap) + gap,
      y: row * (200 + gap) + gap + 100
    };
  };

  // Get component shape style
  const getShapeStyle = (component) => {
    const baseStyle = {
      width: `${component.width || 280}px`,
      height: `${component.height || 120}px`,
    };

    switch (component.shape) {
      case 'circle':
        return { 
          ...baseStyle, 
          borderRadius: '50%',
          width: `${Math.min(component.width || 280, component.height || 280)}px`,
          height: `${Math.min(component.width || 280, component.height || 280)}px`
        };
      case 'oval':
        return { ...baseStyle, borderRadius: `${(component.height || 120) / 2}px` };
      case 'square':
        const size = Math.min(component.width || 200, component.height || 200);
        return { ...baseStyle, width: `${size}px`, height: `${size}px`, borderRadius: '0.5rem' };
      case 'rectangle':
      default:
        return { ...baseStyle, borderRadius: '0.75rem' };
    }
  };

  // Generate position from coordinates
  const generatePosition = (row, col) => {
    return String.fromCharCode(65 + col) + (row + 1);
  };

  // Context menu functions
  const handleRightClick = (e, position) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      position: position
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const editComponent = (position) => {
    const component = config.components[position];
    setEditingComponent({ position, ...component });
    setShowComponentEditor(true);
    closeContextMenu();
  };

  const duplicateComponent = (position) => {
    const component = { ...config.components[position] };
    component.id = `${component.id}_copy_${Date.now()}`;
    component.title = `${component.title} (Copy)`;
    
    // Find next available position
    let row = 0, col = 0;
    let newPosition = generatePosition(row, col);
    
    while (config.components[newPosition] && row < config.grid.rows) {
      col++;
      if (col >= config.grid.cols) {
        col = 0;
        row++;
      }
      newPosition = generatePosition(row, col);
    }

    setConfig(prev => ({
      ...prev,
      components: { ...prev.components, [newPosition]: component }
    }));
    closeContextMenu();
  };

  const startConnection = (position) => {
    setConnectionMode(true);
    setConnectionStart(position);
    closeContextMenu();
  };

  const endConnection = (position) => {
    if (connectionMode && connectionStart && connectionStart !== position) {
      setConfig(prev => {
        const newComponents = { ...prev.components };
        const startComp = newComponents[connectionStart];
        if (!startComp.connections) startComp.connections = [];
        if (!startComp.connections.includes(position)) {
          startComp.connections.push(position);
        }
        return { ...prev, components: newComponents };
      });
    }
    setConnectionMode(false);
    setConnectionStart(null);
  };

  const saveComponentChanges = () => {
    if (!editingComponent) return;
    
    const { position, ...componentData } = editingComponent;
    setConfig(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [position]: componentData
      }
    }));
    setShowComponentEditor(false);
    setEditingComponent(null);
  };

  // Grid adjustment functions
  const adjustGrid = (type, delta) => {
    setConfig(prev => ({
      ...prev,
      grid: {
        ...prev.grid,
        [type]: Math.max(1, prev.grid[type] + delta)
      }
    }));
  };

  // Enhanced GenAI integration with better prompting
  const generateDynamicContent = async (prompt) => {
    if (!config || !selectedModel || !prompt.trim()) return;
    
    setIsLoading(true);
    
    try {
      const modelConfig = config.genai_models.find(m => m.id === selectedModel);
      if (!modelConfig) throw new Error('Model not found');

      const systemPrompt = `You are an architecture diagram generator. Generate a JSON configuration for architecture components based on the user's request.

Current context: ${JSON.stringify(config, null, 2)}

User request: ${prompt}

Please return ONLY a valid JSON object with the following structure:
{
  "title": "Architecture Title",
  "subtitle": "Architecture Subtitle", 
  "new_components": {
    "C1": {
      "id": "unique_id",
      "title": "Component Title",
      "description": "Brief description",
      "icon": "icon_name",
      "color": "color_name",
      "details": ["detail 1", "detail 2", "detail 3"],
      "connections": []
    }
  }
}

Available icons: database, shield, file-text, brain, server, zap, globe, code, upload, download, settings, edit, save, move, plus, trash, copy
Available colors: blue, green, yellow, purple, orange, indigo, red, pink, cyan`;

      const response = await fetch(modelConfig.endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Model request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from model');
      }

      console.log('AI Response:', content);

      // Extract JSON from response
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const aiContent = JSON.parse(jsonMatch[0]);
      
      // Update config with AI-generated content
      setConfig(prev => {
        const updated = {
          ...prev,
          title: aiContent.title || prev.title,
          subtitle: aiContent.subtitle || prev.subtitle,
          components: {
            ...prev.components,
            ...(aiContent.new_components || {})
          }
        };
        
        setJsonEditorContent(JSON.stringify(updated, null, 2));
        return updated;
      });
      
    } catch (error) {
      console.error('Failed to generate content:', error);
      alert(`Failed to generate content: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // JSON Editor functions
  const openJsonEditor = () => {
    setJsonEditorContent(JSON.stringify(config, null, 2));
    setShowJsonEditor(true);
  };

  const saveJsonChanges = () => {
    try {
      const newConfig = JSON.parse(jsonEditorContent);
      setConfig(newConfig);
      setShowJsonEditor(false);
      alert('Configuration updated successfully!');
    } catch (error) {
      alert('Invalid JSON format. Please check your syntax.');
    }
  };

  // Component manipulation functions
  const addNewComponent = () => {
    if (!config) return;
    
    // Find next available position
    let row = 0, col = 0;
    let position = generatePosition(row, col);
    
    while (config.components[position] && row < config.grid.rows) {
      col++;
      if (col >= config.grid.cols) {
        col = 0;
        row++;
      }
      position = generatePosition(row, col);
    }

    if (row >= config.grid.rows) {
      alert('No more space available. Increase grid size or remove components.');
      return;
    }

    const newComponent = {
      id: `component_${Date.now()}`,
      title: "New Component",
      description: "Click to edit",
      icon: "database",
      color: "blue",
      shape: "rectangle",
      width: 280,
      height: 120,
      details: ["Detail 1", "Detail 2", "Detail 3"],
      connections: []
    };

    setConfig(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [position]: newComponent
      }
    }));
  };

  const deleteComponent = (position) => {
    if (!window.confirm(`Delete component at ${position}?`)) return;
    
    setConfig(prev => {
      const newComponents = { ...prev.components };
      delete newComponents[position];
      
      // Remove connections to deleted component
      Object.keys(newComponents).forEach(pos => {
        if (newComponents[pos].connections) {
          newComponents[pos].connections = newComponents[pos].connections.filter(
            conn => conn !== position
          );
        }
      });
      
      const updated = { ...prev, components: newComponents };
      setJsonEditorContent(JSON.stringify(updated, null, 2));
      return updated;
    });
  };

  // Drag and drop functionality
  const handleMouseDown = useCallback((e, position) => {
    if (!config) return;
    
    const component = config.components[position];
    if (!component) return;

    const rect = e.currentTarget.getBoundingClientRect();
    
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    setSelectedComponent(position);
    setIsDragging(true);
    
    e.preventDefault();
  }, [config]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !selectedComponent || !config) return;
    
    const diagramRect = diagramRef.current.getBoundingClientRect();
    const x = e.clientX - diagramRect.left - dragOffset.x;
    const y = e.clientY - diagramRect.top - dragOffset.y - 100;
    
    // Calculate grid position
    const gap = config.grid.gap;
    const col = Math.round((x - gap) / (300 + gap));
    const row = Math.round((y - gap) / (200 + gap));
    
    // Ensure within bounds
    if (col >= 0 && col < config.grid.cols && row >= 0 && row < config.grid.rows) {
      const newPosition = generatePosition(row, col);
      
      if (newPosition !== selectedComponent && !config.components[newPosition]) {
        // Update component position
        setConfig(prev => {
          const newComponents = { ...prev.components };
          const component = newComponents[selectedComponent];
          
          // Update connections
          Object.keys(newComponents).forEach(pos => {
            if (newComponents[pos].connections) {
              newComponents[pos].connections = newComponents[pos].connections.map(
                conn => conn === selectedComponent ? newPosition : conn
              );
            }
          });
          
          delete newComponents[selectedComponent];
          newComponents[newPosition] = component;
          
          return { ...prev, components: newComponents };
        });
        
        setSelectedComponent(newPosition);
      }
    }
  }, [isDragging, selectedComponent, config, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setSelectedComponent(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Export as PNG
  const exportToPNG = async () => {
    if (!diagramRef.current) return;

    try {
      const html2canvas = window.html2canvas;
      if (html2canvas) {
        const canvas = await html2canvas(diagramRef.current, {
          backgroundColor: '#f8fafc',
          scale: 2,
          useCORS: true
        });
        
        const link = document.createElement('a');
        link.download = `architecture-diagram-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } else {
        alert('Please install html2canvas library or use browser screenshot (F12 → Screenshot)');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please use browser screenshot (F12 → Screenshot)');
    }
  };

  // File operations
  const loadConfigFromFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const newConfig = JSON.parse(e.target.result);
        setConfig(newConfig);
        setJsonEditorContent(JSON.stringify(newConfig, null, 2));
        alert('Configuration loaded successfully!');
      } catch (error) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const saveConfigAsJSON = () => {
    if (!config) return;
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `architecture-config-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle click outside to close modals
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu && !event.target.closest('[data-context-menu]')) {
        closeContextMenu();
      }
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  if (!config) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', fontSize: '1.25rem' }}>🔄 Loading configuration...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', padding: '1rem' }}>
      {/* Enhanced Control Panel */}
      <div style={{ 
        backgroundColor: '#1E293B', 
        borderRadius: '0.5rem', 
        padding: '1.5rem', 
        marginBottom: '1.5rem', 
        border: '1px solid #475569',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          color: 'white', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ padding: '0.5rem', backgroundColor: '#0891B2', borderRadius: '0.5rem' }}>
            <Settings style={{ width: '2rem', height: '2rem', color: 'white' }} />
          </div>
          <span style={{ color: '#22D3EE' }}>Enhanced Architecture Generator</span>
        </h1>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          {/* Model Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
              GenAI Model
            </label>
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#374151',
                border: '1px solid #6B7280',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.875rem'
              }}
            >
              {config.genai_models?.map(model => (
                <option key={model.id} value={model.id} title={model.description}>
                  {model.name}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
              {config.genai_models?.find(m => m.id === selectedModel)?.description}
            </div>
          </div>

          {/* Custom Prompt */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
              AI Prompt
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., microservices architecture with API gateway"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#374151',
                border: '1px solid #6B7280',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* AI Actions */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
              AI Actions
            </label>
            <button
              onClick={() => generateDynamicContent(customPrompt)}
              disabled={isLoading || !customPrompt.trim()}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: isLoading || !customPrompt.trim() ? '#6B7280' : '#8B5CF6',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: '500',
                fontSize: '0.875rem',
                cursor: isLoading || !customPrompt.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Brain style={{ width: '1rem', height: '1rem' }} />
                  <span>Generate AI</span>
                </>
              )}
            </button>
          </div>

          {/* Component Actions */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
              Components
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={addNewComponent}
                style={{
                  flex: '1',
                  padding: '0.75rem',
                  backgroundColor: '#10B981',
                  color: 'white',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Add Component"
              >
                <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
              <button
                onClick={openJsonEditor}
                style={{
                  flex: '1',
                  padding: '0.75rem',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Edit JSON"
              >
                <Edit3 style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>
          </div>

          {/* Grid Controls */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
              Grid Controls
            </label>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <button
                onClick={() => adjustGrid('rows', -1)}
                style={{ padding: '0.5rem', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                title="Decrease Rows"
              >
                -
              </button>
              <span style={{ color: 'white', fontSize: '0.875rem', minWidth: '60px', textAlign: 'center' }}>
                {config.grid.rows}×{config.grid.cols}
              </span>
              <button
                onClick={() => adjustGrid('rows', 1)}
                style={{ padding: '0.5rem', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                title="Increase Rows"
              >
                +
              </button>
              <button
                onClick={() => adjustGrid('cols', -1)}
                style={{ padding: '0.5rem', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                title="Decrease Cols"
              >
                -
              </button>
              <button
                onClick={() => adjustGrid('cols', 1)}
                style={{ padding: '0.5rem', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                title="Increase Cols"
              >
                +
              </button>
            </div>
          </div>

          {/* Connection Mode Toggle */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
              Connection Mode
            </label>
            <button
              onClick={() => {
                setConnectionMode(!connectionMode);
                setConnectionStart(null);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: connectionMode ? '#EF4444' : '#8B5CF6',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {connectionMode ? 'Exit Connection' : 'Connect Components'}
            </button>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
              File Operations
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label 
                style={{
                  flex: '1',
                  padding: '0.75rem',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Load JSON"
              >
                <Upload style={{ width: '1.25rem', height: '1.25rem' }} />
                <input type="file" accept=".json" onChange={loadConfigFromFile} style={{ display: 'none' }} />
              </label>
              
              <button
                onClick={saveConfigAsJSON}
                style={{
                  flex: '1',
                  padding: '0.75rem',
                  backgroundColor: '#10B981',
                  color: 'white',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Save JSON"
              >
                <Download style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
              
              <button
                onClick={exportToPNG}
                style={{
                  flex: '1',
                  padding: '0.75rem',
                  backgroundColor: '#F97316',
                  color: 'white',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Export PNG"
              >
                <Download style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          borderRadius: '0.5rem',
          padding: '1rem',
          border: '1px solid #475569'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: '#CBD5E1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database style={{ width: '1rem', height: '1rem', color: '#22D3EE' }} />
                <span>Components: <span style={{ color: 'white', fontWeight: '600' }}>{Object.keys(config.components).length}</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe style={{ width: '1rem', height: '1rem', color: '#10B981' }} />
                <span>Grid: <span style={{ color: 'white', fontWeight: '600' }}>{config.grid.cols}×{config.grid.rows}</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Brain style={{ width: '1rem', height: '1rem', color: '#8B5CF6' }} />
                <span>Model: <span style={{ color: 'white', fontWeight: '600' }}>{config.genai_models?.find(m => m.id === selectedModel)?.name}</span></span>
              </div>
              {connectionMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FBBF24' }}>
                  <span>🔗 Connection Mode: {connectionStart ? `From ${connectionStart}` : 'Select start component'}</span>
                </div>
              )}
            </div>
            {isDragging && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FBBF24' }}>
                <Move style={{ width: '1rem', height: '1rem' }} />
                <span>Dragging: <span style={{ fontWeight: '600' }}>{selectedComponent}</span></span>
              </div>
            )}
          </div>
        </div>
      </div>

                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#374151',
                      border: '1px solid #6B7280',
                      borderRadius: '0.25rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  >
                    {Object.keys(config.styles).map(color => (
                      <option key={color} value={color}>{color.charAt(0).toUpperCase() + color.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
                    Shape
                  </label>
                  <select
                    value={editingComponent.shape || 'rectangle'}
                    onChange={(e) => setEditingComponent({ ...editingComponent, shape: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#374151',
                      border: '1px solid #6B7280',
                      borderRadius: '0.25rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="square">Square</option>
                    <option value="circle">Circle</option>
                    <option value="oval">Oval</option>
                  </select>
                </div>
              </div>

              {/* Size */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
                    Width
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="500"
                    value={editingComponent.width || 280}
                    onChange={(e) => setEditingComponent({ ...editingComponent, width: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#374151',
                      border: '1px solid #6B7280',
                      borderRadius: '0.25rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
                    Height
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="500"
                    value={editingComponent.height || 120}
                    onChange={(e) => setEditingComponent({ ...editingComponent, height: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: '#374151',
                      border: '1px solid #6B7280',
                      borderRadius: '0.25rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Icon */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
                  Icon
                </label>
                <select
                  value={editingComponent.icon}
                  onChange={(e) => setEditingComponent({ ...editingComponent, icon: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#374151',
                    border: '1px solid #6B7280',
                    borderRadius: '0.25rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="database">Database</option>
                  <option value="shield">Shield</option>
                  <option value="file-text">File Text</option>
                  <option value="brain">Brain</option>
                  <option value="server">Server</option>
                  <option value="zap">Zap</option>
                  <option value="globe">Globe</option>
                  <option value="code">Code</option>
                  <option value="settings">Settings</option>
                  <option value="upload">Upload</option>
                  <option value="download">Download</option>
                </select>
              </div>

              {/* Details */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '0.5rem' }}>
                  Details (one per line)
                </label>
                <textarea
                  value={editingComponent.details?.join('\n') || ''}
                  onChange={(e) => setEditingComponent({ ...editingComponent, details: e.target.value.split('\n').filter(d => d.trim()) })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#374151',
                    border: '1px solid #6B7280',
                    borderRadius: '0.25rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Save Button */}
              <button
                onClick={saveComponentChanges}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10B981',
                  color: 'white',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          data-context-menu
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            backgroundColor: '#1E293B',
            border: '1px solid #475569',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
            minWidth: '150px'
          }}
        >
          <button
            onClick={() => editComponent(contextMenu.position)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '0.5rem 0.5rem 0 0',
              fontSize: '0.875rem'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✏️ Edit Component
          </button>
          <button
            onClick={() => duplicateComponent(contextMenu.position)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            📋 Duplicate
          </button>
          <button
            onClick={() => startConnection(contextMenu.position)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            🔗 Connect From Here
          </button>
          <button
            onClick={() => deleteComponent(contextMenu.position)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#EF4444',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '0 0 0.5rem 0.5rem',
              fontSize: '0.875rem'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {/* JSON Editor Modal */}
      {showJsonEditor && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#1E293B',
            borderRadius: '0.5rem',
            width: '100%',
            maxWidth: '72rem',
            height: '80%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #475569'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              borderBottom: '1px solid #475569',
              backgroundColor: '#1E293B',
              borderTopLeftRadius: '0.5rem',
              borderTopRightRadius: '0.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Code style={{ width: '1.5rem', height: '1.5rem', color: '#10B981' }} />
                <span>Edit Configuration JSON</span>
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={saveJsonChanges}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10B981',
                    color: 'white',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '500',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Save style={{ width: '1rem', height: '1rem' }} />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={() => setShowJsonEditor(false)}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#EF4444',
                    color: 'white',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, padding: '1.5rem' }}>
              <textarea
                value={jsonEditorContent}
                onChange={(e) => setJsonEditorContent(e.target.value)}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#111827',
                  color: '#10B981',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #475569',
                  resize: 'none',
                  outline: 'none'
                }}
                spellCheck={false}
                placeholder="Edit your JSON configuration here..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Architecture Diagram */}
      <div 
        ref={diagramRef}
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '0.5rem',
          padding: '2rem',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          width: '100%',
          height: `${config.grid.rows * (config.grid.cellHeight + config.grid.gap) + 200}px`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.75rem'
          }}>
            {config.title}
          </h1>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            {config.subtitle}
          </h2>
        </div>

        {/* Components */}
        {Object.entries(config.components).map(([position, component]) => {
          const { x, y } = getPixelPosition(position);
          const style = config.styles[component.color] || config.styles.blue;
          const IconComponent = getIcon(component.icon);
          const isSelected = selectedComponent === position;
          const shapeStyle = getShapeStyle(component);
          const isConnectionStart = connectionStart === position;

          return (
            <div
              key={position}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                ...shapeStyle,
                boxShadow: isSelected ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 4px #FBBF24' : 
                          isConnectionStart ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 4px #10B981' :
                          '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
                border: `2px solid ${style.border}`,
                background: `linear-gradient(135deg, ${style.bg} 0%, ${style.bg}CC 100%)`,
                color: style.text,
                padding: '1rem',
                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.3s ease',
                cursor: connectionMode ? (connectionStart ? 'crosshair' : 'pointer') : (isDragging ? 'grabbing' : 'grab'),
                zIndex: isDragging && selectedComponent === position ? 50 : 10,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}
              onMouseDown={(e) => {
                if (connectionMode) {
                  if (connectionStart) {
                    endConnection(position);
                  } else {
                    startConnection(position);
                  }
                } else {
                  handleMouseDown(e, position);
                }
              }}
              onContextMenu={(e) => handleRightClick(e, position)}
            >
              {/* Component Controls */}
              <div style={{
                position: 'absolute',
                top: '-0.5rem',
                right: '-0.5rem',
                display: 'flex',
                gap: '0.25rem',
                opacity: 0,
                transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    editComponent(position);
                  }}
                  style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transform: 'scale(1)',
                    transition: 'transform 0.2s ease',
                    marginRight: '0.25rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Edit component"
                >
                  <Edit3 style={{ width: '0.75rem', height: '0.75rem' }} />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteComponent(position);
                  }}
                  style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    backgroundColor: '#EF4444',
                    color: 'white',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transform: 'scale(1)',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Delete component"
                >
                  <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
                </button>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ 
                  padding: '0.5rem', 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                  borderRadius: component.shape === 'circle' ? '50%' : '0.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconComponent style={{ width: '2rem', height: '2rem' }} />
                </div>
              </div>
              
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 'bold', 
                marginBottom: '0.5rem', 
                lineHeight: '1.2',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {component.title}
              </h3>
              
              <p style={{ 
                fontSize: '0.875rem', 
                marginBottom: '0.75rem', 
                opacity: 0.9, 
                lineHeight: '1.2',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {component.description}
              </p>
              
              <div style={{ fontSize: '0.75rem', maxHeight: '4rem', overflow: 'hidden' }}>
                {component.details?.slice(0, 3).map((detail, index) => (
                  <div key={index} style={{ opacity: 0.8, lineHeight: '1.2', marginBottom: '0.25rem' }}>
                    {detail}
                  </div>
                ))}
              </div>

              {/* Position Label */}
              <div style={{
                position: 'absolute',
                top: '0.25rem',
                left: '0.25rem',
                fontSize: '0.75rem',
                opacity: 0.5,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                padding: '0.125rem 0.5rem',
                borderRadius: '0.25rem'
              }}>
                {position}
              </div>

              {/* Connection indicators */}
              {connectionMode && connectionStart && (
                <div style={{
                  position: 'absolute',
                  bottom: '-0.5rem',
                  right: '-0.5rem',
                  width: '1rem',
                  height: '1rem',
                  backgroundColor: connectionStart === position ? '#10B981' : '#8B5CF6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.5rem',
                  color: 'white'
                }}>
                  {connectionStart === position ? '🎯' : '🔗'}
                </div>
              )}
            </div>
          );
        })}

        {/* Enhanced Connections with curved arrows */}
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="12"
              markerHeight="8"
              refX="11"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 12 4, 0 8" fill="#374151" />
            </marker>
          </defs>
          {Object.entries(config.components).map(([position, component]) => {
            if (!component.connections) return null;
            
            return component.connections.map((targetPosition, index) => {
              const startPos = getPixelPosition(position);
              const endPos = getPixelPosition(targetPosition);
              const startComp = config.components[position];
              const endComp = config.components[targetPosition];
              
              if (!endComp) return null;
              
              const startX = startPos.x + (startComp.width || 280) / 2;
              const startY = startPos.y + (startComp.height || 120);
              const endX = endPos.x + (endComp.width || 280) / 2;
              const endY = endPos.y;

              // Calculate control points for curved path
              const midY = startY + (endY - startY) / 2;

              return (
                <g key={`${position}-${targetPosition}-${index}`}>
                  <path
                    d={`M ${startX} ${startY} Q ${startX} ${midY} ${endX} ${endY}`}
                    stroke="#374151"
                    strokeWidth="3"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    style={{ filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1))' }}
                  />
                </g>
              );
            });
          })}
        </svg>

        {/* Drop zones for dragging */}
        {isDragging && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {Array.from({ length: config.grid.rows }, (_, row) =>
              Array.from({ length: config.grid.cols }, (_, col) => {
                const x = col * (300 + config.grid.gap) + config.grid.gap;
                const y = row * (200 + config.grid.gap) + config.grid.gap + 100;
                const cellLabel = String.fromCharCode(65 + col) + (row + 1);
                const isOccupied = config.components[cellLabel];
                const isTarget = cellLabel === selectedComponent;
                
                if (isOccupied && !isTarget) return null;
                
                return (
                  <div
                    key={`dropzone-${row}-${col}`}
                    style={{
                      position: 'absolute',
                      left: `${x}px`,
                      top: `${y}px`,
                      width: '280px',
                      height: '120px',
                      border: `2px dashed ${isTarget ? '#FBBF24' : '#10B981'}`,
                      backgroundColor: isTarget ? 'rgba(251, 191, 36, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '0.5rem',
                      boxShadow: isTarget ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.875rem', color: '#374151', padding: '0.5rem', fontWeight: 'bold' }}>
                      {cellLabel}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Click outside handlers - removed duplicate */}  <div
                    key={`dropzone-${row}-${col}`}
                    style={{
                      position: 'absolute',
                      left: `${x}px`,
                      top: `${y}px`,
                      width: `${config.grid.cellWidth}px`,
                      height: `${config.grid.cellHeight}px`,
                      border: `2px dashed ${isTarget ? '#FBBF24' : '#10B981'}`,
                      backgroundColor: isTarget ? 'rgba(251, 191, 36, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '0.5rem',
                      boxShadow: isTarget ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.875rem', color: '#374151', padding: '0.5rem', fontWeight: 'bold' }}>
                      {cellLabel}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Enhanced Status and Config Info */}
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Architecture Stats */}
        <div style={{
          backgroundColor: '#1E293B',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid #475569',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ padding: '0.5rem', backgroundColor: '#0891B2', borderRadius: '0.5rem' }}>
              <Database style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
            </div>
            <span>Architecture Statistics</span>
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ backgroundColor: '#111827', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #475569' }}>
              <div style={{ color: '#9CA3AF', marginBottom: '0.25rem' }}>Components</div>
              <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#22D3EE' }}>
                {Object.keys(config.components).length}
              </div>
            </div>
            <div style={{ backgroundColor: '#111827', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #475569' }}>
              <div style={{ color: '#9CA3AF', marginBottom: '0.25rem' }}>Connections</div>
              <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#10B981' }}>
                {Object.values(config.components).reduce((acc, comp) => acc + (comp.connections?.length || 0), 0)}
              </div>
            </div>
            <div style={{ backgroundColor: '#111827', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #475569' }}>
              <div style={{ color: '#9CA3AF', marginBottom: '0.25rem' }}>Grid Size</div>
              <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#8B5CF6' }}>
                {config.grid.cols}×{config.grid.rows}
              </div>
            </div>
            <div style={{ backgroundColor: '#111827', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #475569' }}>
              <div style={{ color: '#9CA3AF', marginBottom: '0.25rem' }}>AI Models</div>
              <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#F97316' }}>
                {config.genai_models?.length || 0}
              </div>
            </div>
          </div>

          {/* Active Model Info */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#111827', borderRadius: '0.5rem', border: '1px solid #475569' }}>
            <div style={{ color: '#9CA3AF', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Brain style={{ width: '1rem', height: '1rem' }} />
              <span>Active Model</span>
            </div>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '1.125rem', marginBottom: '0.25rem' }}>
              {config.genai_models?.find(m => m.id === selectedModel)?.name || 'None'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'monospace' }}>
              {config.genai_models?.find(m => m.id === selectedModel)?.endpoint}
            </div>
          </div>
        </div>

        {/* JSON Configuration Preview */}
        <div style={{
          backgroundColor: '#1E293B',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid #475569',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{ padding: '0.5rem', backgroundColor: '#10B981', borderRadius: '0.5rem' }}>
                <Code style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
              </div>
              <span>Configuration Preview</span>
            </h3>
            <button
              onClick={openJsonEditor}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3B82F6',
                color: 'white',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Edit3 style={{ width: '1rem', height: '1rem' }} />
              <span>Edit Full JSON</span>
            </button>
          </div>
          
          <div style={{ backgroundColor: '#111827', borderRadius: '0.5rem', border: '1px solid #475569', overflow: 'hidden' }}>
            <pre style={{
              padding: '1rem',
              color: '#10B981',
              fontSize: '0.75rem',
              overflowY: 'auto',
              maxHeight: '20rem',
              fontFamily: 'monospace',
              margin: 0,
              lineHeight: 1.5
            }}>
              {JSON.stringify({
                title: config.title,
                subtitle: config.subtitle,
                components_count: Object.keys(config.components).length,
                grid: config.grid,
                active_model: config.genai_models?.find(m => m.id === selectedModel)?.name,
                sample_component: Object.values(config.components)[0]
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div style={{
        marginTop: '2rem',
        backgroundColor: '#1E293B',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        border: '1px solid #475569',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ padding: '0.5rem', backgroundColor: '#3B82F6', borderRadius: '0.5rem' }}>
            <FileText style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
          </div>
          <span>Usage Instructions</span>
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #475569' }}>
            <h4 style={{
              fontWeight: '600',
              color: 'white',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Brain style={{ width: '1.25rem', height: '1.25rem', color: '#8B5CF6' }} />
              <span>🤖 AI Generation</span>
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: '#CBD5E1' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#22D3EE' }}>•</span>
                <span>Select a GenAI model from the dropdown</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#22D3EE' }}>•</span>
                <span>Enter a descriptive prompt (e.g., "microservices with API gateway")</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#22D3EE' }}>•</span>
                <span>Click "Generate AI" to create new components</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#22D3EE' }}>•</span>
                <span>AI will suggest architecture components based on your prompt</span>
              </li>
            </ul>
          </div>
          
          <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #475569' }}>
            <h4 style={{
              fontWeight: '600',
              color: 'white',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Move style={{ width: '1.25rem', height: '1.25rem', color: '#10B981' }} />
              <span>🎯 Component Management</span>
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: '#CBD5E1' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#10B981' }}>•</span>
                <span>Drag components to reposition them on the grid</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#10B981' }}>•</span>
                <span>Click the "+" button to add new components</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#10B981' }}>•</span>
                <span>Hover over components to see delete option</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#10B981' }}>•</span>
                <span>Use "Edit JSON" for advanced configuration</span>
              </li>
            </ul>
          </div>
          
          <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #475569' }}>
            <h4 style={{
              fontWeight: '600',
              color: 'white',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Download style={{ width: '1.25rem', height: '1.25rem', color: '#F97316' }} />
              <span>💾 File Operations</span>
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: '#CBD5E1' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#F97316' }}>•</span>
                <span>Load JSON: Import existing configurations</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#F97316' }}>•</span>
                <span>Save JSON: Export current configuration</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#F97316' }}>•</span>
                <span>Export PNG: Save diagram as image</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#F97316' }}>•</span>
                <span>Edit JSON: Direct configuration editing</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CSS Animation for spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default DynamicArchitectureGenerator;
import React, { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import {
  Database, Shield, FileText, Brain, Server, Zap, Globe, Code,
  Upload, Download, Settings, Edit3, Save, Move, Plus, Trash2,
  Copy, X
} from 'lucide-react';
import '../styles/ArchitectureGenerator.css';

// Add ComponentItem component
const ComponentItem = ({
  position,
  component,
  onConnect,
  connectionMode,
  isSelected,
  isConnectionStart,
  pixelPos,
  Icon,
  shapeStyle,
  colorStyle,
  handleRightClick,
  handleMouseDown,
  ConnectionPort,
  handleConnectionDragStart,
  handleConnectionDrop
}) => {
  return (
    <div
      className={`component ${connectionMode ? 'connection-mode' : ''} ${isSelected ? 'selected' : ''} ${isConnectionStart ? 'connection-start' : ''}`}
      style={{
        position: 'absolute',
        left: `${pixelPos.x}px`,
        top: `${pixelPos.y}px`,
        ...shapeStyle,
        background: colorStyle.bg,
        borderColor: colorStyle.border,
        color: colorStyle.text,
      }}
      onClick={() => onConnect(position)}
      onContextMenu={(e) => handleRightClick(e, position)}
      onMouseDown={(e) => handleMouseDown(e, position)}
    >
      {/* Component content */}
      <div className="component-content">
        <div className="component-icon">
          <Icon size={24} />
        </div>
        <h3 className="component-title">{component.title}</h3>
        <p className="component-description">{component.description}</p>
        {component.details && (
          <div className="component-details">
            {component.details.slice(0, 2).map((detail, idx) => (
              <div key={idx} className="detail-item">{detail}</div>
            ))}
          </div>
        )}
      </div>

      {/* Connection ports */}
      {connectionMode && (
        <>
          <ConnectionPort
            position="top"
            componentPosition={position}
            onDragStart={handleConnectionDragStart}
            onDrop={handleConnectionDrop}
          />
          <ConnectionPort
            position="right"
            componentPosition={position}
            onDragStart={handleConnectionDragStart}
            onDrop={handleConnectionDrop}
          />
          <ConnectionPort
            position="bottom"
            componentPosition={position}
            onDragStart={handleConnectionDragStart}
            onDrop={handleConnectionDrop}
          />
          <ConnectionPort
            position="left"
            componentPosition={position}
            onDragStart={handleConnectionDragStart}
            onDrop={handleConnectionDrop}
          />
        </>
      )}
    </div>
  );
};

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
  const [selectedArrowType, setSelectedArrowType] = useState('single');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionPreview, setConnectionPreview] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [draggedConnection, setDraggedConnection] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const diagramRef = useRef(null);

  // Initialize with external config
  useEffect(() => {
    const loadConfiguration = async () => {
      const configPath = '/config/defaultConfig.json'; // Public folder path
      
      try {
        console.log(`Loading config from: ${configPath}`);
        const response = await fetch(configPath);
        if (response.ok) {
          const externalConfig = await response.json();
          console.log('Successfully loaded external configuration');
          console.log('Config preview:', {
            title: externalConfig.title,
            componentCount: Object.keys(externalConfig.components || {}).length,
            modelsCount: externalConfig.genai_models?.length || 0
          });
          setConfig(externalConfig);
          setJsonEditorContent(JSON.stringify(externalConfig, null, 2));
        } else {
          throw new Error(`Failed to load: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Could not load external configuration:', error.message);
        alert(`Configuration file not found at ${configPath}. Please ensure the file exists and is accessible.`);
      }
    };

    loadConfiguration();
  }, []);

  // Icon mapping
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
    const { cellWidth, cellHeight, gap } = config.grid;

    return {
      x: col * (cellWidth + gap) + gap,
      y: row * (cellHeight + gap) + gap + 100
    };
  };

  // Generate position from coordinates
  const generatePosition = (row, col) => {
    return String.fromCharCode(65 + col) + (row + 1);
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
    setIsConnecting(true);

    // Calculate preview start position
    const startPos = getPixelPosition(position);
    const startComp = config.components[position];
    setConnectionPreview({
      startX: startPos.x + (startComp.width || 280) / 2,
      startY: startPos.y + (startComp.height || 120) / 2
    });

    closeContextMenu();
  };

  // Enhanced connection mode logic
  const handleComponentClick = (position) => {
    if (connectionMode) {
      if (!connectionStart) {
        // Start connection
        setConnectionStart(position);
        setIsConnecting(true);

        // Calculate preview start position
        const startPos = getPixelPosition(position);
        const startComp = config.components[position];
        setConnectionPreview({
          startX: startPos.x + (startComp.width || 280) / 2,
          startY: startPos.y + (startComp.height || 120) / 2
        });
      } else if (connectionStart !== position) {
        // Complete connection
        endConnection(position);
      } else {
        // Cancel connection (clicked same component)
        setConnectionMode(false);
        setConnectionStart(null);
        setIsConnecting(false);
        setConnectionPreview(null);
      }
    }
  };

  // Add connection validation
  const addConnection = (from, to) => {
    if (from === to) return false; // Prevent self-connections

    setConfig(prev => {
      const newComponents = { ...prev.components };
      const startComp = newComponents[from];
      if (!startComp) return prev;

      if (!startComp.connections) startComp.connections = [];

      // Check if connection already exists
      const exists = startComp.connections.some(conn =>
        (typeof conn === 'string' ? conn : conn.to) === to
      );

      if (!exists) {
        const newConnection = {
          to,
          type: selectedArrowType,
          label: `${selectedArrowType} connection`
        };
        startComp.connections.push(newConnection);
      }

      return { ...prev, components: newComponents };
    });

    return true;
  };

  // Update endConnection to use validation
  const endConnection = (position) => {
    if (connectionMode && connectionStart && connectionStart !== position) {
      const success = addConnection(connectionStart, position);
      if (success) {
        console.log(`Connection created: ${connectionStart} -> ${position}`);
      }
    }
    setConnectionMode(false);
    setConnectionStart(null);
    setIsConnecting(false);
    setConnectionPreview(null);
  };

  // Add mouse tracking for connection preview
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isConnecting && connectionStart) {
        const diagramRect = diagramRef.current?.getBoundingClientRect();
        if (diagramRect) {
          setMousePosition({
            x: e.clientX - diagramRect.left,
            y: e.clientY - diagramRect.top
          });
        }
      }
    };

    if (isConnecting) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isConnecting, connectionStart]);

  // Add escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && connectionMode) {
        setConnectionMode(false);
        setConnectionStart(null);
        setIsConnecting(false);
        setConnectionPreview(null);
      }
    };

    if (connectionMode) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [connectionMode]);

  // Save component changes
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

  // Enhanced GenAI integration
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
        mode: 'cors',
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
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to generate content: ';
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage += 'Network error - Check if the AI server is running and CORS is configured properly. ';
        errorMessage += 'Try running your AI server with CORS headers or use a proxy.';
      } else if (error.message.includes('CORS')) {
        errorMessage += 'CORS error - The AI server needs to allow browser requests. ';
        errorMessage += 'Add CORS headers to your server or use a proxy.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
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
            conn => (typeof conn === 'string' ? conn : conn.to) !== position
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
    const { cellWidth, cellHeight, gap } = config.grid;
    const col = Math.round((x - gap) / (cellWidth + gap));
    const row = Math.round((y - gap) / (cellHeight + gap));

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
                conn => {
                  if (typeof conn === 'string') {
                    return conn === selectedComponent ? newPosition : conn;
                  } else {
                    return conn.to === selectedComponent ? { ...conn, to: newPosition } : conn;
                  }
                }
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
      const canvas = await html2canvas(diagramRef.current, {
        backgroundColor: '#f8fafc',
        scale: 2,
        useCORS: true,
        logging: false, // Disable console logs
        allowTaint: true
      });

      const link = document.createElement('a');
      link.download = `architecture-diagram-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try using browser screenshot (F12 → Screenshot)');
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

  // Reload configuration from external file
  const reloadConfiguration = async () => {
    const configPath = '/config/defaultConfig.json'; // Public folder path
    
    try {
      console.log(`Reloading config from: ${configPath}`);
      const response = await fetch(configPath + `?t=${Date.now()}`); // Add cache bust
      if (response.ok) {
        const externalConfig = await response.json();
        console.log('Successfully reloaded external configuration');
        setConfig(externalConfig);
        setJsonEditorContent(JSON.stringify(externalConfig, null, 2));
        alert('Configuration reloaded successfully!');
      } else {
        throw new Error(`Failed to reload: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to reload configuration:', error.message);
      alert(`Could not reload configuration from ${configPath}. Check if the file exists and is accessible.`);
    }
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

  // Connection Port Component
  const ConnectionPort = ({ position, componentPosition, onDragStart, onDrop }) => {
    const handleDragStart = (e) => {
      e.stopPropagation();
      setDraggedConnection({
        from: componentPosition,
        fromPort: position,
        startX: e.clientX,
        startY: e.clientY
      });
      onDragStart(componentPosition, position);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (draggedConnection && draggedConnection.from !== componentPosition) {
        onDrop(draggedConnection.from, componentPosition);
      }
      setDraggedConnection(null);
      setDropTarget(null);
    };

    const handleDragEnter = (e) => {
      e.preventDefault();
      if (draggedConnection && draggedConnection.from !== componentPosition) {
        setDropTarget(componentPosition);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      // Only clear if we're actually leaving the port area
      if (!e.currentTarget.contains(e.relatedTarget)) {
        setDropTarget(null);
      }
    };

    return (
      <div
        className={`port port-${position} ${dropTarget === componentPosition ? 'drop-target' : ''}`}
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        data-position={position}
        title={`Drag to connect from ${componentPosition}`}
      />
    );
  };

  // Drag start handler
  const handleConnectionDragStart = (fromComponent, fromPort) => {
    setConnectionMode(true);
    setConnectionStart(fromComponent);
    document.body.style.cursor = 'grabbing';

    // Calculate drag start position
    const startPos = getPixelPosition(fromComponent);
    const startComp = config.components[fromComponent];
    // setDragPreview removed - drag preview functionality disabled
  };

  // Drop handler
  const handleConnectionDrop = (fromComponent, toComponent) => {
    if (fromComponent !== toComponent) {
      // Create connection
      setConfig(prev => {
        const newComponents = { ...prev.components };
        const startComp = newComponents[fromComponent];
        if (!startComp.connections) startComp.connections = [];

        const newConnection = {
          to: toComponent,
          type: selectedArrowType,
          label: `${selectedArrowType} connection`
        };

        // Check if connection already exists
        const existingConnection = startComp.connections.find(
          conn => (typeof conn === 'string' ? conn : conn.to) === toComponent
        );

        if (!existingConnection) {
          startComp.connections.push(newConnection);
        }

        return { ...prev, components: newComponents };
      });
    }

    // Reset drag state
    setDraggedConnection(null);
    setDropTarget(null);
    setConnectionMode(false);
    setConnectionStart(null);
    // setDragPreview removed
    document.body.style.cursor = 'default';
  };

  // Mouse move for drag preview - removed since setDragPreview is disabled

  // Prepare connections data for ConnectionsLayer
  const prepareConnectionsData = useCallback(() => {
    console.log('Config components:', config?.components);
    const connections = [];
    Object.entries(config.components).forEach(([position, component]) => {
      console.log(`Component ${position}:`, component.connections);
      if (!component.connections) return;

      component.connections.forEach((connection, index) => {
        const targetPosition = typeof connection === 'string' ? connection : connection.to;
        const connectionType = typeof connection === 'object' ? connection.type : 'single';
        const connectionLabel = typeof connection === 'object' ? connection.label : '';

        connections.push({
          id: `${position}-${targetPosition}-${index}`,
          from: position,
          to: targetPosition,
          type: connectionType,
          label: connectionLabel
        });
      });
    });
    console.log('Final connections array:', connections);
    return connections;
  }, [config?.components]);

  // Add debug function to check connections
  const debugConnections = useCallback(() => {
    const connections = prepareConnectionsData();
    console.log('Config components:', config?.components);
    console.log('Prepared connections:', connections);
    console.log('Connections with components found:',
      connections.map(conn => ({
        ...conn,
        fromFound: !!config?.components[conn.from],
        toFound: !!config?.components[conn.to],
        fromComponent: config?.components[conn.from],
        toComponent: config?.components[conn.to]
      }))
    );

    // Check if any connections exist
    const totalConnections = Object.values(config?.components || {}).reduce((acc, comp) =>
      acc + (comp.connections?.length || 0), 0
    );
    console.log('Total connections in config:', totalConnections);
  }, [config?.components, prepareConnectionsData]);

  // Call debug function when connections or components change
  useEffect(() => {
    if (config?.components) {
      debugConnections();
    }
  }, [config?.components, debugConnections]);

  // Enhanced ConnectionsLayer with better debugging
  const ConnectionsLayer = ({ connections, components }) => {
    console.log('ConnectionsLayer received:', { connections, components });

    if (!connections || connections.length === 0) {
      console.log('No connections to render');
      return null;
    }

    return (
      <svg
        className="connections-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 15
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
            fill="#4f46e5"
          >
            <polygon points="0 0, 10 3.5, 0 7" />
          </marker>

          <marker
            id="arrowhead-bi"
            markerWidth="10"
            markerHeight="7"
            refX="1"
            refY="3.5"
            orient="auto"
            fill="#4f46e5"
          >
            <polygon points="10 0, 0 3.5, 10 7" />
          </marker>

          <marker
            id="arrowhead-single"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
            fill="#3b82f6"
          >
            <polygon points="0 0, 10 3.5, 0 7" />
          </marker>

          <marker
            id="arrowhead-data"
            markerWidth="12"
            markerHeight="8"
            refX="11"
            refY="4"
            orient="auto"
            fill="#8b5cf6"
          >
            <polygon points="0 0, 12 4, 0 8" />
          </marker>
        </defs>

        {connections.map((conn, index) => {
          console.log(`Rendering connection ${index}:`, conn);

          const fromCompPos = getPixelPosition(conn.from);
          const toCompPos = getPixelPosition(conn.to);
          const fromComp = components[conn.from];
          const toComp = components[conn.to];

          console.log(`Connection ${index} positions:`, {
            fromCompPos,
            toCompPos,
            fromComp: !!fromComp,
            toComp: !!toComp
          });

          if (!fromComp || !toComp) {
            console.log(`Skipping connection ${index} - missing component`);
            return null;
          }

          // Calculate connection points
          const fromX = fromCompPos.x + (fromComp.width || 280) / 2;
          const fromY = fromCompPos.y + (fromComp.height || 120);
          const toX = toCompPos.x + (toComp.width || 280) / 2;
          const toY = toCompPos.y;

          console.log(`Connection ${index} coordinates:`, { fromX, fromY, toX, toY });

          // Create smooth curved path - Fix this calculation
          const dy = toY - fromY;
          const curve = Math.max(50, Math.abs(dy) * 0.3); // Ensure minimum curve

          const pathData = `M ${fromX} ${fromY}
                           C ${fromX} ${fromY + curve},
                             ${toX} ${toY - curve},
                             ${toX} ${toY}`;

          // Determine arrow markers and styles based on type
          let markerEnd = "url(#arrowhead-single)";
          let markerStart = "";
          let strokeColor = "#3b82f6";
          let strokeDasharray = "none";

          switch (conn.type) {
            case "bidirectional":
              markerStart = "url(#arrowhead-bi)";
              markerEnd = "url(#arrowhead)";
              strokeColor = "#10b981";
              break;
            case "dataFlow":
              markerEnd = "url(#arrowhead-data)";
              strokeColor = "#8b5cf6";
              strokeDasharray = "10,5";
              break;
            case "oneToMany":
              strokeColor = "#f59e0b";
              strokeDasharray = "5,5";
              break;
            default:
              strokeColor = "#3b82f6";
          }

          return (
            <g key={`${conn.from}-${conn.to}-${index}`}>
              <path
                d={pathData}
                stroke={strokeColor}
                strokeWidth="3"
                fill="none"
                markerEnd={markerEnd}
                markerStart={markerStart}
                className="connection-path"
                style={{
                  strokeDasharray: strokeDasharray
                }}
              />

              {/* Connection label */}
              {conn.label && (
                <>
                  <rect
                    x={(fromX + toX) / 2 - conn.label.length * 3}
                    y={(fromY + toY) / 2 - 12}
                    width={conn.label.length * 6}
                    height={16}
                    rx="4"
                    ry="4"
                    fill="rgba(255, 255, 255, 0.9)"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <text
                    x={(fromX + toX) / 2}
                    y={(fromY + toY) / 2 - 4}
                    textAnchor="middle"
                    className="connection-label"
                    style={{
                      fontSize: '11px',
                      fill: '#374151',
                      fontWeight: '500',
                      pointerEvents: 'none'
                    }}
                  >
                    {conn.label}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  // Debug component to show connection statistics
  const ConnectionDebugInfo = () => {
    if (!config?.components) return null;

    const connections = prepareConnectionsData();
    const totalConnections = Object.values(config.components).reduce((acc, comp) =>
      acc + (comp.connections?.length || 0), 0
    );

    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div>Total Connections: {totalConnections}</div>
        <div>Rendered Connections: {connections.length}</div>
        <div>Components: {Object.keys(config.components).length}</div>
        <button
          onClick={() => console.table(connections)}
          style={{ marginTop: '5px', padding: '2px 5px' }}
        >
          Log Connections
        </button>
      </div>
    );
  };

  if (!config) {
    return (
      <div className="loading-screen">
        <div className="loading-text">🔄 Loading configuration from external file...</div>
        <div className="loading-subtext">Make sure /config/defaultConfig.json exists</div>
      </div>
    );
  }

  return (
    <div className="architecture-generator">
      {/* Enhanced Control Panel */}
      <div className="control-panel">
        <h1 className="control-panel-header">
          <div className="header-icon">
            <Settings style={{ width: '2rem', height: '2rem', color: 'white' }} />
          </div>
          <span className="header-title">Enhanced Architecture Generator</span>
          <button 
            className="btn btn-info btn-small"
            onClick={() => setPanelMinimized(!panelMinimized)}
            style={{ marginLeft: 'auto' }}
          >
            {panelMinimized ? '⬆️ Expand' : '⬇️ Minimize'}
          </button>
        </h1>

        {!panelMinimized && (
          <>
            <div className="controls-grid">
          {/* Model Selection */}
          <div className="form-group">
            <label className="form-label">GenAI Model</label>
            <select
              className="form-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {config.genai_models?.map(model => (
                <option key={model.id} value={model.id} title={model.description}>
                  {model.name}
                </option>
              ))}
            </select>
            <div className="form-description">
              {config.genai_models?.find(m => m.id === selectedModel)?.description}
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">AI Prompt</label>
            <input
              className="form-input"
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., microservices architecture with API gateway"
            />
          </div>

          {/* AI Actions */}
          <div className="form-group">
            <label className="form-label">AI Actions</label>
            <button
              className={`btn ${isLoading || !customPrompt.trim() ? 'btn-primary' : 'btn-primary'}`}
              onClick={() => generateDynamicContent(customPrompt)}
              disabled={isLoading || !customPrompt.trim()}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Brain className="btn-icon" />
                  <span>Generate AI</span>
                </>
              )}
            </button>
          </div>

          {/* Component Actions */}
          <div className="form-group">
            <label className="form-label">Components</label>
            <div className="btn-group">
              <button className="btn btn-success" onClick={addNewComponent} title="Add Component">
                <Plus className="btn-icon" />
              </button>
              <button className="btn btn-info" onClick={openJsonEditor} title="Edit JSON">
                <Edit3 className="btn-icon" />
              </button>
            </div>
          </div>

          {/* File Operations */}
          <div className="form-group">
            <label className="form-label">File Operations</label>
            <div className="btn-group">
              <button className="btn btn-primary" onClick={reloadConfiguration} title="Reload Config">
                <Settings className="btn-icon" />
              </button>
              <label className="btn btn-info" title="Load JSON">
                <Upload className="btn-icon" />
                <input type="file" accept=".json" onChange={loadConfigFromFile} style={{ display: 'none' }} />
              </label>
              <button className="btn btn-success" onClick={saveConfigAsJSON} title="Save JSON">
                <Download className="btn-icon" />
              </button>
              <button className="btn btn-warning" onClick={exportToPNG} title="Export PNG">
                <Download className="btn-icon" />
              </button>
            </div>
          </div>

          {/* Grid Controls */}
          <div className="form-group">
            <label className="form-label">Grid Controls</label>
            <div className="grid-controls">
              <button className="btn btn-danger btn-small" onClick={() => adjustGrid('rows', -1)} title="Decrease Rows">-</button>
              <span className="grid-display">{config.grid.rows}×{config.grid.cols}</span>
              <button className="btn btn-success btn-small" onClick={() => adjustGrid('rows', 1)} title="Increase Rows">+</button>
              <button className="btn btn-danger btn-small" onClick={() => adjustGrid('cols', -1)} title="Decrease Cols">-</button>
              <button className="btn btn-success btn-small" onClick={() => adjustGrid('cols', 1)} title="Increase Cols">+</button>
            </div>
          </div>

          {/* Enhanced Connection Mode Toggle */}
          <div className="form-group">
            <label className="form-label">Connection Mode</label>
            <button
              className={`btn ${connectionMode ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => {
                if (connectionMode) {
                  // Exit connection mode
                  setConnectionMode(false);
                  setConnectionStart(null);
                  setIsConnecting(false);
                  setConnectionPreview(null);
                  setDraggedConnection(null);
                  setDropTarget(null);
                  // setDragPreview removed
                } else {
                  // Enter connection mode
                  setConnectionMode(true);
                }
              }}
            >
              {connectionMode ? (
                <>
                  <X className="btn-icon" />
                  <span>Exit Connection</span>
                </>
              ) : (
                <>
                  <Zap className="btn-icon" />
                  <span>Connect Components</span>
                </>
              )}
            </button>
            {connectionMode && (
              <div className="form-description">
                💡 Click components to connect or drag from the dots on component edges
              </div>
            )}
          </div>

          {/* Arrow Type Selector - Add this after Connection Mode */}
          {connectionMode && (
            <div className="form-group">
              <label className="form-label">Arrow Type</label>
              <div className="arrow-type-selector">
                {config.arrow_types && Object.entries(config.arrow_types).map(([type, typeConfig]) => (
                  <button
                    key={type}
                    className={`arrow-type-btn ${selectedArrowType === type ? 'active' : ''}`}
                    onClick={() => setSelectedArrowType(type)}
                  >
                    {typeConfig.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div> {/* Close controls-grid */}

        {/* Status Info */}
        <div className="status-info">
          <div className="status-row">
            <div className="status-items">
              <div className="status-item">
                <Database style={{ width: '1rem', height: '1rem', color: '#22D3EE' }} />
                <span>Components: <span className="status-value">{Object.keys(config.components).length}</span></span>
              </div>
              <div className="status-item">
                <Globe style={{ width: '1rem', height: '1rem', color: '#10B981' }} />
                <span>Grid: <span className="status-value">{config.grid.cols}×{config.grid.rows}</span></span>
              </div>
              <div className="status-item">
                <Brain style={{ width: '1rem', height: '1rem', color: '#8B5CF6' }} />
                <span>Model: <span className="status-value">{config.genai_models?.find(m => m.id === selectedModel)?.name}</span></span>
              </div>
              <div className="status-item">
                <Zap style={{ width: '1rem', height: '1rem', color: '#F59E0B' }} />
                <span>Connections: <span className="status-value">{Object.values(config.components).reduce((acc, comp) => acc + (comp.connections?.length || 0), 0)}</span></span>
              </div>
              {connectionMode && (
                <div className="status-connection">
                  🔗 Connection Mode: {connectionStart ? `From ${connectionStart}` : 'Select start component'}
                </div>
              )}
            </div>
            {isDragging && (
              <div className="status-dragging">
                <Move style={{ width: '1rem', height: '1rem' }} />
                <span>Dragging: <span style={{ fontWeight: '600' }}>{selectedComponent}</span></span>
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div> {/* Close control-panel */}

      {/* Component Editor Modal */}
      {showComponentEditor && editingComponent && (
        <div className="modal-overlay">
          <div className="modal-content modal-medium">
            <div className="modal-header">
              <h2 className="modal-title">Edit Component</h2>
              <button className="btn btn-danger btn-round" onClick={() => setShowComponentEditor(false)}>
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>

            <div className="modal-body">
              {/* Title */}
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  type="text"
                  value={editingComponent.title}
                  onChange={(e) => setEditingComponent({ ...editingComponent, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={editingComponent.description}
                  onChange={(e) => setEditingComponent({ ...editingComponent, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Color and Shape */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <select
                    className="form-select"
                    value={editingComponent.color}
                    onChange={(e) => setEditingComponent({ ...editingComponent, color: e.target.value })}
                  >
                    {Object.keys(config.styles).map(color => (
                      <option key={color} value={color}>{color.charAt(0).toUpperCase() + color.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Shape</label>
                  <select
                    className="form-select"
                    value={editingComponent.shape || 'rectangle'}
                    onChange={(e) => setEditingComponent({ ...editingComponent, shape: e.target.value })}
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
                <div className="form-group">
                  <label className="form-label">Width</label>
                  <input
                    className="form-input"
                    type="number"
                    min="100"
                    max="500"
                    value={editingComponent.width || 280}
                    onChange={(e) => setEditingComponent({ ...editingComponent, width: parseInt(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Height</label>
                  <input
                    className="form-input"
                    type="number"
                    min="100"
                    max="500"
                    value={editingComponent.height || 120}
                    onChange={(e) => setEditingComponent({ ...editingComponent, height: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              {/* Icon */}
              <div className="form-group">
                <label className="form-label">Icon</label>
                <select
                  className="form-select"
                  value={editingComponent.icon}
                  onChange={(e) => setEditingComponent({ ...editingComponent, icon: e.target.value })}
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
              <div className="form-group">
                <label className="form-label">Details (one per line)</label>
                <textarea
                  className="form-textarea"
                  value={editingComponent.details?.join('\n') || ''}
                  onChange={(e) => setEditingComponent({ ...editingComponent, details: e.target.value.split('\n').filter(d => d.trim()) })}
                  rows={4}
                />
              </div>

              {/* Save Button */}
              <button className="btn btn-success" onClick={saveComponentChanges}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div className="context-menu" data-context-menu style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}>
          <button className="context-menu-item" onClick={() => editComponent(contextMenu.position)}>
            ✏️ Edit Component
          </button>
          <button className="context-menu-item" onClick={() => duplicateComponent(contextMenu.position)}>
            📋 Duplicate
          </button>
          <button className="context-menu-item" onClick={() => startConnection(contextMenu.position)}>
            🔗 Connect From Here
          </button>
          <button className="context-menu-item danger" onClick={() => deleteComponent(contextMenu.position)}>
            🗑️ Delete
          </button>
        </div>
      )}

      {/* JSON Editor Modal */}
      {showJsonEditor && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2 className="modal-title">
                <Code style={{ width: '1.5rem', height: '1.5rem', color: '#10B981' }} />
                <span>Edit Configuration JSON</span>
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-success" onClick={saveJsonChanges}>
                  <Save style={{ width: '1rem', height: '1rem' }} />
                  <span>Save Changes</span>
                </button>
                <button className="btn btn-danger btn-round" onClick={() => setShowJsonEditor(false)}>
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>
            </div>
            <div className="modal-body-flex">
              <textarea
                className="json-editor"
                value={jsonEditorContent}
                onChange={(e) => setJsonEditorContent(e.target.value)}
                spellCheck={false}
                placeholder="Edit your JSON configuration here..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Architecture Diagram with enhanced structure */}
      <div
        ref={diagramRef}
        className={`diagram-container architecture-container ${isDragging ? 'dragging' : ''}`}
        style={{ 
          height: `${config.grid.rows * (config.grid.cellHeight + config.grid.gap) + 200}px`,
          minHeight: '600px',
          position: 'relative'
        }}
      >
        {/* Grid background */}
        <div className="grid-background" />

        {/* Title */}
        <div className="diagram-title">
          <h1 className="diagram-main-title">{config.title}</h1>
          <h2 className="diagram-subtitle">{config.subtitle}</h2>
        </div>

        {/* Connection Mode Overlay */}
        {connectionMode && (
          <div className="connection-mode-overlay">
            <div>🔗 Connection Mode Active</div>
            {connectionStart ? (
              <div>
                <div>From: <strong>{connectionStart}</strong></div>
                <div>Click target component or press ESC to cancel</div>
                <div className="arrow-type-preview">
                  <span>Type: {config.arrow_types?.[selectedArrowType]?.label || '→ Single'}</span>
                </div>
              </div>
            ) : (
              <div>Click source component to start connecting</div>
            )}
          </div>
        )}

        {/* Components using ComponentItem */}
        {Object.entries(config.components).map(([position, component]) => {
          const pixelPos = getPixelPosition(position);
          const Icon = getIcon(component.icon);
          const shapeStyle = getShapeStyle(component);
          const colorStyle = config.styles[component.color] || config.styles.blue;

          return (
            <ComponentItem
              key={position}
              position={position}
              component={component}
              onConnect={handleComponentClick}
              connectionMode={connectionMode}
              isSelected={selectedComponent === position}
              isConnectionStart={connectionStart === position}
              pixelPos={pixelPos}
              Icon={Icon}
              shapeStyle={shapeStyle}
              colorStyle={colorStyle}
              handleRightClick={handleRightClick}
              handleMouseDown={handleMouseDown}
              ConnectionPort={ConnectionPort}
              handleConnectionDragStart={handleConnectionDragStart}
              handleConnectionDrop={handleConnectionDrop}
            />
          );
        })}

        {/* Enhanced Connections overlay - Make sure this renders */}
        <ConnectionsLayer
          connections={prepareConnectionsData()}
          components={config.components}
        />

        {/* Connection preview while connecting */}
        {connectionPreview && isConnecting && connectionStart && (
          <svg className="connections-svg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
            <path
              className="connection-preview"
              d={`M ${connectionPreview.startX} ${connectionPreview.startY} L ${mousePosition.x} ${mousePosition.y}`}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
            />
          </svg>
        )}

        {/* Drop zones for dragging */}
        {isDragging && (
          <div className="drop-zones">
            {Array.from({ length: config.grid.rows }, (_, row) =>
              Array.from({ length: config.grid.cols }, (_, col) => {
                const x = col * (config.grid.cellWidth + config.grid.gap) + config.grid.gap;
                const y = row * (config.grid.cellHeight + config.grid.gap) + config.grid.gap + 100;
                const cellLabel = String.fromCharCode(65 + col) + (row + 1);
                const isOccupied = config.components[cellLabel];
                const isTarget = cellLabel === selectedComponent;

                if (isOccupied && !isTarget) return null;

                return (
                  <div
                    key={`dropzone-${row}-${col}`}
                    className={`drop-zone ${isTarget ? 'target' : 'available'}`}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      width: `${config.grid.cellWidth}px`,
                      height: `${config.grid.cellHeight}px`,
                    }}
                  >
                    <div className="drop-zone-label">{cellLabel}</div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Enhanced Status and Config Info */}
      <div className="stats-grid">
        {/* Architecture Stats */}
        <div className="stats-card">
          <h3 className="stats-card-header">
            <div className="stats-icon blue">
              <Database style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
            </div>
            <span>Architecture Statistics</span>
          </h3>

          <div className="stats-grid-inner">
            <div className="stat-item">
              <div className="stat-label">Components</div>
              <div className="stat-value blue">{Object.keys(config.components).length}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Connections</div>
              <div className="stat-value green">
                {Object.values(config.components).reduce((acc, comp) => acc + (comp.connections?.length || 0), 0)}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Grid Size</div>
              <div className="stat-value purple">{config.grid.cols}×{config.grid.rows}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">AI Models</div>
              <div className="stat-value orange">{config.genai_models?.length || 0}</div>
            </div>
          </div>

          {/* Active Model Info */}
          <div className="model-info">
            <div className="model-info-header">
              <Brain style={{ width: '1rem', height: '1rem' }} />
              <span>Active Model</span>
            </div>
            <div className="model-name">
              {config.genai_models?.find(m => m.id === selectedModel)?.name || 'None'}
            </div>
            <div className="model-endpoint">
              {config.genai_models?.find(m => m.id === selectedModel)?.endpoint}
            </div>
          </div>
        </div>

        {/* JSON Configuration Preview */}
        <div className="stats-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="stats-card-header" style={{ marginBottom: 0 }}>
              <div className="stats-icon green">
                <Code style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
              </div>
              <span>Configuration Preview</span>
            </h3>
            <button className="btn btn-info" onClick={openJsonEditor}>
              <Edit3 style={{ width: '1rem', height: '1rem' }} />
              <span>Edit Full JSON</span>
            </button>
          </div>

          <div className="config-preview">
            <pre className="config-code">
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
      <div className="stats-card">
        <h3 className="stats-card-header">
          <div className="stats-icon blue">
            <FileText style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
          </div>
          <span>Usage Instructions</span>
        </h3>

        <div className="instructions-grid">
          <div className="instruction-card">
            <h4 className="instruction-header">
              <Brain style={{ width: '1.25rem', height: '1.25rem', color: '#8B5CF6' }} />
              <span>🤖 AI Generation</span>
            </h4>
            <ul className="instruction-list">
              <li className="instruction-item">
                <span className="instruction-bullet blue">•</span>
                <span>Select a GenAI model from the dropdown</span>
              </li>
              <li className="instruction-item">
                <span className="instruction-bullet blue">•</span>
                <span>Enter a descriptive prompt (e.g., "microservices with API gateway")</span>
              </li>
              <li className="instruction-item">
                <span className="instruction-bullet blue">•</span>
                <span>Click "Generate AI" to create new components</span>
              </li>
              <li className="instruction-item">
                <span className="instruction-bullet blue">•</span>
                <span>AI will suggest architecture components based on your prompt</span>
              </li>
            </ul>
          </div>

          <div className="instruction-card">
            <h4 className="instruction-header">
              <Move style={{ width: '1.25rem', height: '1.25rem', color: '#10B981' }} />
              <span>🎯 Component Management</span>
            </h4>
            <ul className="instruction-list">
              <li className="instruction-item">
                <span className="instruction-bullet green">•</span>
                <span>Drag components to reposition them on the grid</span>
              </li>
              <li className="instruction-item">
                <span className="instruction-bullet green">•</span>
                <span>Click the "+" button to add new components</span>
              </li>
              <li className="instruction-item">
                <span className="instruction-bullet green">•</span>
                <span>Hover over components to see edit/delete options</span>
              </li>
              <li className="instruction-item">
                <span className="instruction-bullet green">•</span>
                <span>Right-click components for context menu</span>
              </li>
            </ul>
          </div>

          <div className="instruction-card">
            <h4 className="instruction-header">
              <Download style={{ width: '1.25rem', height: '1.25rem', color: '#F97316' }} />
              <span>💾 File Operations</span>
            </h4>
            <ul className="instruction-list">
              <li className="instruction-item">
                <span className="instruction-bullet orange">•</span>
                <span>Load JSON: Import existing configurations</span>
              </li>
              <li className="instruction-item">
                <span className="instruction-bullet orange">•</span>
                <span>Save JSON: Export current configuration</span>
              </li>
              <li className="instruction-item">
                <span className="instruction-bullet orange">•</span>
                <span>Export PNG: Save diagram as image</span>
              </li>
              <li className="instruction-item">
                <span className="instruction-bullet orange">•</span>
                <span>Edit JSON: Direct configuration editing</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicArchitectureGenerator;

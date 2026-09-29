import React, { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import {
  Database, Shield, FileText, Brain, Server, Zap, Globe, Code,
  Upload, Download, Settings, Edit3, Save, Move, Plus, Trash2,
  Copy, X
} from 'lucide-react';
import '../styles/ArchitectureGenerator.css';

// Helper functions for domain, role, and tech stack context
const getDomainContext = (domainId, masterConfig) => {
  if (masterConfig?.domains?.[domainId]) {
    return masterConfig.domains[domainId];
  }
  // Fallback to default domains
  const fallbackDomains = [
    { id: 'banking', label: 'Banking & Finance', description: 'Core banking, digital banking, risk management' },
    { id: 'healthcare', label: 'Healthcare', description: 'EMR, telemedicine, clinical analytics' },
    { id: 'retail', label: 'Retail & E-commerce', description: 'E-commerce, inventory, customer analytics' },
    { id: 'telecom', label: 'Telecommunications', description: 'Network management, billing, customer portal' },
    { id: 'manufacturing', label: 'Manufacturing', description: 'IoT, supply chain, quality control' },
    { id: 'logistics', label: 'Logistics', description: 'Supply chain, fleet management, tracking' }
  ];
  return fallbackDomains.find(d => d.id === domainId) || { label: 'General', description: 'General purpose architecture' };
};

const getRoleContext = (roleId, masterConfig) => {
  if (masterConfig?.roles?.[roleId]) {
    return masterConfig.roles[roleId];
  }
  // Fallback to default roles
  const fallbackRoles = [
    { id: 'architect', label: 'Solution Architect', focus: 'Technical Design' },
    { id: 'developer', label: 'Developer', focus: 'Implementation' },
    { id: 'sales', label: 'Sales', focus: 'Business Value' },
    { id: 'project_manager', label: 'Project Manager', focus: 'Timeline & Budget' },
    { id: 'presales', label: 'Pre-sales', focus: 'Solution Demo' },
    { id: 'account_manager', label: 'Account Manager', focus: 'Client Relations' }
  ];
  return fallbackRoles.find(r => r.id === roleId) || { label: 'Architect', focus: 'Technical Design' };
};

const getTechStackContext = (techStackIds, masterConfig) => {
  if (masterConfig?.tech_stacks) {
    const allTechs = Object.values(masterConfig.tech_stacks).flat();
    return techStackIds.map(id => {
      const tech = allTechs.find(t => t.id === id);
      return tech ? tech.label : id;
    });
  }
  // Fallback to default tech stacks
  const fallbackTechStacks = {
    cloud: [{ id: 'aws', label: 'Amazon AWS' }, { id: 'azure', label: 'Microsoft Azure' }],
    ai_ml: [{ id: 'genai', label: 'Generative AI' }, { id: 'langchain', label: 'LangChain' }],
    databases: [{ id: 'neo4j', label: 'Neo4j GraphDB' }, { id: 'mongodb', label: 'MongoDB' }]
  };
  const allTechs = Object.values(fallbackTechStacks).flat();
  return techStackIds.map(id => {
    const tech = allTechs.find(t => t.id === id);
    return tech ? tech.label : id;
  });
};

// Enhanced Configuration Selector Component
const ConfigurationSelector = ({ onConfigSelect, currentConfig, generateDynamicContent, masterConfig }) => {
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedTechStack, setSelectedTechStack] = useState([]);
  const [selectedRole, setSelectedRole] = useState('architect');
  const [availableConfigs, setAvailableConfigs] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Use master config if available, otherwise fall back to default configs
  const domains = masterConfig?.domains ? Object.entries(masterConfig.domains).map(([id, config]) => ({
    id,
    label: config.label,
    icon: config.icon,
    color: config.color,
    description: config.description
  })) : [
    { id: 'banking', label: 'Banking & Finance', icon: '🏦', color: 'blue', description: 'Core banking, digital banking, risk management' },
    { id: 'healthcare', label: 'Healthcare', icon: '🏥', color: 'red', description: 'EMR, telemedicine, clinical analytics' },
    { id: 'retail', label: 'Retail & E-commerce', icon: '🛒', color: 'green', description: 'E-commerce, inventory, customer analytics' },
    { id: 'telecom', label: 'Telecommunications', icon: '📱', color: 'purple', description: 'Network management, billing, customer portal' },
    { id: 'manufacturing', label: 'Manufacturing', icon: '🏭', color: 'orange', description: 'IoT, supply chain, quality control' },
    { id: 'logistics', label: 'Logistics', icon: '🚚', color: 'yellow', description: 'Supply chain, fleet management, tracking' }
  ];

  const techStacks = masterConfig?.tech_stacks || {
    cloud: [
      { id: 'aws', label: 'Amazon AWS', icon: '☁️', color: 'orange' },
      { id: 'azure', label: 'Microsoft Azure', icon: '☁️', color: 'blue' },
      { id: 'gcp', label: 'Google Cloud', icon: '☁️', color: 'green' },
      { id: 'ibm_cloud', label: 'IBM Cloud', icon: '☁️', color: 'indigo' },
      { id: 'oracle_cloud', label: 'Oracle Cloud', icon: '☁️', color: 'red' }
    ],
    data: [
      { id: 'bigquery', label: 'BigQuery', icon: '🗄️', color: 'blue' },
      { id: 'redshift', label: 'Amazon Redshift', icon: '🗄️', color: 'orange' },
      { id: 'snowflake', label: 'Snowflake', icon: '❄️', color: 'cyan' },
      { id: 'databricks', label: 'Databricks', icon: '🔥', color: 'red' },
      { id: 'synapse', label: 'Azure Synapse', icon: '🗄️', color: 'blue' }
    ],
    ai_ml: [
      { id: 'genai', label: 'Generative AI', icon: '🤖', color: 'purple' },
      { id: 'langchain', label: 'LangChain', icon: '🔗', color: 'green' },
      { id: 'langgraph', label: 'LangGraph', icon: '📊', color: 'blue' },
      { id: 'agentic_ai', label: 'Agentic AI', icon: '🧠', color: 'indigo' },
      { id: 'rag', label: 'RAG System', icon: '📚', color: 'orange' },
      { id: 'fine_tuning', label: 'Model Fine-tuning', icon: '⚙️', color: 'yellow' }
    ],
    databases: [
      { id: 'neo4j', label: 'Neo4j GraphDB', icon: '🕸️', color: 'green' },
      { id: 'mongodb', label: 'MongoDB', icon: '🍃', color: 'green' },
      { id: 'postgresql', label: 'PostgreSQL', icon: '🐘', color: 'blue' },
      { id: 'redis', label: 'Redis', icon: '🔴', color: 'red' }
    ],
    integration: [
      { id: 'search_engine', label: 'Search (Google/Elastic)', icon: '🔍', color: 'blue' },
      { id: 'maps_api', label: 'Maps API', icon: '🗺️', color: 'green' },
      { id: 'storage', label: 'Cloud Storage', icon: '💾', color: 'gray' },
      { id: 'serpapi', label: 'SerpAPI (Google Search)', icon: '🐍', color: 'yellow' }
    ]
  };

  const roles = masterConfig?.roles ? Object.entries(masterConfig.roles).map(([id, config]) => ({
    id,
    label: config.label,
    icon: config.icon,
    focus: config.focus
  })) : [
    { id: 'architect', label: 'Solution Architect', icon: '🏗️', focus: 'Technical Design' },
    { id: 'developer', label: 'Developer', icon: '👨‍💻', focus: 'Implementation' },
    { id: 'sales', label: 'Sales', icon: '💼', focus: 'Business Value' },
    { id: 'marketing', label: 'Marketing', icon: '📈', focus: 'Customer Journey' },
    { id: 'presales', label: 'Pre-sales', icon: '🎯', focus: 'Solution Demo' },
    { id: 'project_manager', label: 'Project Manager', icon: '📋', focus: 'Timeline & Budget' },
    { id: 'account_manager', label: 'Account Manager', icon: '🤝', focus: 'Client Relations' }
  ];

  // Load available configurations based on selections and master config
  useEffect(() => {
    const loadConfigs = async () => {
      if (selectedDomain) {
        try {
          // Use master config templates if available
          if (masterConfig?.templates?.[selectedDomain]) {
            const domainTemplates = masterConfig.templates[selectedDomain];
            const configs = Object.entries(domainTemplates).map(([key, template]) => ({
              name: `${selectedDomain} - ${template.name}`,
              path: template.path,
              type: template.type || key,
              description: template.description
            }));
            setAvailableConfigs(configs);
            console.log(`📋 Loaded ${configs.length} templates for ${selectedDomain} from master config`);
          } else {
            // Fallback to original domain-specific configs
            const domainConfigs = await Promise.allSettled([
              fetch(`/config/domains/${selectedDomain}/core.json`),
              fetch(`/config/domains/${selectedDomain}/advanced.json`),
              fetch(`/config/domains/${selectedDomain}/enterprise.json`)
            ]);

            const configs = [];
            domainConfigs.forEach((result, index) => {
              if (result.status === 'fulfilled' && result.value.ok) {
                const configNames = ['Core', 'Advanced', 'Enterprise'];
                configs.push({
                  name: `${selectedDomain} - ${configNames[index]}`,
                  path: result.value.url,
                  type: configNames[index].toLowerCase()
                });
              }
            });

            setAvailableConfigs(configs);
            console.log(`📋 Loaded ${configs.length} fallback templates for ${selectedDomain}`);
          }
        } catch (error) {
          console.error('Error loading domain configs:', error);
        }
      }
    };

    loadConfigs();
  }, [selectedDomain, masterConfig]);

  const handleGenerateConfig = async () => {
    // Generate AI-powered configuration using enhanced prompt system
    const domainContext = domains.find(d => d.id === selectedDomain);
    const prompt = `${domainContext?.description} architecture with enhanced ${selectedRole} perspective`;
    
    // Call the enhanced generateDynamicContent function with domain-specific parameters
    if (generateDynamicContent) {
      await generateDynamicContent(prompt, selectedDomain, selectedTechStack, selectedRole);
    }
  };

  return (
    <div className="config-selector">
      <div className="config-header">
        <h2>🎯 Smart Architecture Generator</h2>
        <p>Choose your domain, technology stack, and role to generate tailored architecture diagrams</p>
      </div>

      {/* Domain Selection */}
      <div className="selection-section">
        <h3>1. Select Domain</h3>
        <div className="domain-grid">
          {domains.map(domain => (
            <div
              key={domain.id}
              className={`domain-card ${selectedDomain === domain.id ? 'selected' : ''}`}
              onClick={() => setSelectedDomain(domain.id)}
            >
              <div className="domain-icon">{domain.icon}</div>
              <div className="domain-label">{domain.label}</div>
              <div className="domain-desc">{domain.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Selection */}
      <div className="selection-section">
        <h3>2. Select Your Role</h3>
        <div className="role-selector">
          {roles.map(role => (
            <button
              key={role.id}
              className={`role-btn ${selectedRole === role.id ? 'active' : ''}`}
              onClick={() => setSelectedRole(role.id)}
            >
              <span className="role-icon">{role.icon}</span>
              <div>
                <div className="role-label">{role.label}</div>
                <div className="role-focus">{role.focus}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Technology Stack Selection */}
      <div className="selection-section">
        <h3>3. Select Technology Stack</h3>
        
        {Object.entries(techStacks).map(([category, techs]) => (
          <div key={category} className="tech-category">
            <h4>{category.replace('_', ' ').toUpperCase()}</h4>
            <div className="tech-grid">
              {techs.map(tech => (
                <button
                  key={tech.id}
                  className={`tech-card ${selectedTechStack.includes(tech.id) ? 'selected' : ''}`}
                  onClick={() => {
                    if (selectedTechStack.includes(tech.id)) {
                      setSelectedTechStack(prev => prev.filter(id => id !== tech.id));
                    } else {
                      setSelectedTechStack(prev => [...prev, tech.id]);
                    }
                  }}
                >
                  <span className="tech-icon">{tech.icon}</span>
                  <span className="tech-label">{tech.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Options */}
      <div className="selection-section">
        <button 
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          ⚙️ Advanced Options {showAdvanced ? '▼' : '▶'}
        </button>
        
        {showAdvanced && (
          <div className="advanced-options">
            <div className="option-group">
              <h4>🔍 External Integrations</h4>
              <label className="checkbox-option">
                <input type="checkbox" /> Google Search API (SerpAPI)
              </label>
              <label className="checkbox-option">
                <input type="checkbox" /> Maps Integration
              </label>
              <label className="checkbox-option">
                <input type="checkbox" /> Real-time Analytics
              </label>
            </div>
            
            <div className="option-group">
              <h4>🤖 AI Knowledge Services</h4>
              <label className="checkbox-option">
                <input type="checkbox" /> RAG Knowledge Base
              </label>
              <label className="checkbox-option">
                <input type="checkbox" /> Vector Database
              </label>
              <label className="checkbox-option">
                <input type="checkbox" /> Agent Orchestration
              </label>
            </div>

            <div className="option-group">
              <h4>📊 Project Management Tools</h4>
              <label className="checkbox-option">
                <input type="checkbox" /> JIRA Integration
              </label>
              <label className="checkbox-option">
                <input type="checkbox" /> Cost Tracking
              </label>
              <label className="checkbox-option">
                <input type="checkbox" /> Timeline Management
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Available Templates */}
      {availableConfigs.length > 0 && (
        <div className="selection-section">
          <h3>4. Pre-built Templates</h3>
          <div className="template-grid">
            {availableConfigs.map((config, index) => (
              <button
                key={index}
                className="template-card"
                onClick={() => onConfigSelect(config.path)}
              >
                <div className="template-name">{config.name}</div>
                <div className="template-type">{config.type}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="generate-section">
        <button
          className="generate-btn"
          onClick={handleGenerateConfig}
          disabled={!selectedDomain || selectedTechStack.length === 0}
        >
          🚀 Generate Smart Architecture
        </button>
        
        <div className="generation-summary">
          <p>
            <strong>Domain:</strong> {domains.find(d => d.id === selectedDomain)?.label || 'Not selected'}<br/>
            <strong>Role:</strong> {roles.find(r => r.id === selectedRole)?.label}<br/>
            <strong>Tech Stack:</strong> {selectedTechStack.length} components selected
          </p>
        </div>
      </div>
    </div>
  );
};

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
  const [showConfigSelector, setShowConfigSelector] = useState(false);
  const [masterConfig, setMasterConfig] = useState(null);
  const diagramRef = useRef(null);

  // 🔧 External API Integrations
  
  // SerpAPI integration for real-time search
  const searchWithSerpAPI = async (query) => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          api_key: process.env.REACT_APP_SERPAPI_KEY 
        })
      });
      return await response.json();
    } catch (error) {
      console.error('SerpAPI search failed:', error);
      return null;
    }
  };

  // Integration in RAG system
  // eslint-disable-next-line no-unused-vars
  const enhanceWithRealTimeData = async (query) => {
    const searchResults = await searchWithSerpAPI(query);
    if (searchResults) {
      // Process and store in vector database
      console.log('Search results for RAG enhancement:', searchResults);
      // Update knowledge base
    }
  };

  // Google Maps integration for location-based components
  const addLocationServices = (architecture) => {
    if (architecture.domain === 'retail' || architecture.domain === 'logistics') {
      return {
        ...architecture,
        components: {
          ...architecture.components,
          "MAPS1": {
            "id": "location_services",
            "title": "Location-Based Services",
            "description": "Google Maps integration for store/warehouse locations",
            "icon": "globe",
            "color": "green",
            "details": ["🗺️ Store locator", "📍 Delivery tracking", "🚚 Route optimization"],
            "connections": []
          }
        }
      };
    }
    return architecture;
  };

  // 🤖 AI Agent Framework Integration
  
  // LangChain agent configuration
  const createLangChainAgent = (domain, capabilities) => {
    return {
      "id": "langchain_agent",
      "title": "LangChain AI Agent",
      "description": `Intelligent agent for ${domain} domain operations`,
      "icon": "brain",
      "color": "purple",
      "details": [
        "🔗 LangChain framework",
        "🤖 Multi-tool agent",
        "📚 RAG capabilities",
        "🔄 Memory management"
      ],
      "capabilities": capabilities,
      "tools": ["search", "calculator", "database_query", "api_calls"]
    };
  };

  // LangGraph workflow definition
  // eslint-disable-next-line no-unused-vars
  const createAgentWorkflow = (domain) => {
    const workflows = {
      banking: {
        nodes: ["customer_service", "fraud_detection", "compliance_check"],
        edges: [
          ["customer_service", "fraud_detection"],
          ["fraud_detection", "compliance_check"]
        ]
      },
      healthcare: {
        nodes: ["patient_intake", "diagnosis_support", "treatment_plan"],
        edges: [
          ["patient_intake", "diagnosis_support"],
          ["diagnosis_support", "treatment_plan"]
        ]
      },
      retail: {
        nodes: ["inventory_management", "customer_analytics", "recommendation_engine"],
        edges: [
          ["inventory_management", "customer_analytics"],
          ["customer_analytics", "recommendation_engine"]
        ]
      }
    };
    
    return workflows[domain] || workflows.banking;
  };

  // 📊 Project Management Integration
  
  // JIRA project creation and tracking
  // eslint-disable-next-line no-unused-vars
  const createJiraProject = async (architecture) => {
    const projectData = {
      key: architecture.domain?.toUpperCase() || 'ARCH',
      name: architecture.title,
      description: architecture.subtitle,
      components: Object.keys(architecture.components || {}).map(key => ({
        name: architecture.components[key].title,
        description: architecture.components[key].description
      }))
    };
    
    console.log('JIRA project data generated:', projectData);
    // Create JIRA project and tickets
    // This would typically be done through a backend API
    return projectData;
  };

  // Automated cost estimation based on components
  const estimateCosts = (architecture) => {
    const costRules = {
      cloud_provider: { aws: 1.0, azure: 0.9, gcp: 0.8 },
      ai_services: { basic: 500, advanced: 2000, enterprise: 5000 },
      database: { postgresql: 200, mongodb: 300, neo4j: 800 },
      compute: { small: 100, medium: 500, large: 2000 }
    };
    
    let totalCost = 0;
    const breakdown = {};
    
    Object.values(architecture.components || {}).forEach(component => {
      // Calculate cost based on component type and size
      const componentCost = calculateComponentCost(component, costRules);
      totalCost += componentCost;
      breakdown[component.id] = componentCost;
    });
    
    return {
      monthly_estimate: totalCost,
      annual_estimate: totalCost * 12,
      breakdown: breakdown
    };
  };

  // Helper function to calculate individual component costs
  const calculateComponentCost = (component, costRules) => {
    let cost = 0;
    
    // Base cost by component type
    if (component.icon === 'database') cost += costRules.database.postgresql;
    if (component.icon === 'brain') cost += costRules.ai_services.advanced;
    if (component.icon === 'server') cost += costRules.compute.medium;
    if (component.icon === 'globe') cost += costRules.compute.small;
    
    // Add base cost if none assigned
    if (cost === 0) cost = 100;
    
    return cost;
  };

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

  // Load master configuration for smart features
  useEffect(() => {
    const loadMasterConfig = async () => {
      try {
        console.log('🔧 Loading master configuration...');
        const response = await fetch('/config/master_config.json');
        if (response.ok) {
          const masterConfig = await response.json();
          console.log('✅ Successfully loaded master configuration:', {
            domains: Object.keys(masterConfig.domains || {}).length,
            techStacks: Object.keys(masterConfig.tech_stacks || {}).length,
            roles: Object.keys(masterConfig.roles || {}).length,
            templates: Object.keys(masterConfig.templates || {}).length
          });
          setMasterConfig(masterConfig);
          
          // Use master config to populate dropdowns and options
          console.log('🎯 Master config will drive:');
          console.log('- Domain selection:', Object.keys(masterConfig.domains || {}));
          console.log('- Technology stacks:', Object.keys(masterConfig.tech_stacks || {}));
          console.log('- Available roles:', Object.keys(masterConfig.roles || {}));
          console.log('- Template configurations:', Object.keys(masterConfig.templates || {}));
        } else {
          console.warn('⚠️ Master config not found, using default configurations');
        }
      } catch (error) {
        console.error('❌ Failed to load master configuration:', error.message);
        console.log('📝 Master config should be placed at /public/config/master_config.json');
      }
    };

    loadMasterConfig();
  }, []);

  // Enhanced domain-specific prompt generation
  const generateDomainSpecificPrompt = (domain, techStack, role, userPrompt, masterConfig) => {
    const domainContext = getDomainContext(domain, masterConfig);
    const roleContext = getRoleContext(role, masterConfig);
    const techContext = getTechStackContext(techStack, masterConfig);

    return `You are an expert solution architect specializing in ${domainContext.label}.

DOMAIN: ${domainContext.label}
FOCUS: ${roleContext.focus}
TECH STACK: ${techContext.join(', ')}

Create a comprehensive architecture for: ${userPrompt}

REQUIREMENTS:
${role === 'sales' ? '- Focus on business value, ROI, and competitive advantages' : ''}
${role === 'architect' ? '- Emphasize scalability, security, and technical excellence' : ''}
${role === 'developer' ? '- Include APIs, development tools, and implementation details' : ''}
${role === 'project_manager' ? '- Include timeline, resource planning, and cost considerations' : ''}
${role === 'presales' ? '- Focus on solution demonstration and proof of concept' : ''}
${role === 'account_manager' ? '- Emphasize client relations and business continuity' : ''}

TECHNOLOGY INTEGRATION:
${techStack.includes('langchain') ? '- Include LangChain agents for AI orchestration' : ''}
${techStack.includes('rag') ? '- Design RAG system for knowledge retrieval' : ''}
${techStack.includes('neo4j') ? '- Use Neo4j for relationship mapping and graph analytics' : ''}
${techStack.includes('serpapi') ? '- Integrate Google Search API for real-time data' : ''}
${techStack.includes('genai') ? '- Include Generative AI services and LLM integration' : ''}
${techStack.includes('agentic_ai') ? '- Design multi-agent AI systems with coordination' : ''}

OUTPUT FORMAT:
Return a valid JSON configuration with components, connections, and metadata.
Include role-specific information in the "role_specific_views" section.

\`\`\`json
{
  "title": "Architecture Title",
  "subtitle": "Architecture Subtitle", 
  "domain": "${domain}",
  "components": {
    // Component definitions
  },
  "role_specific_views": {
    "${role}": {
      // Role-specific information
    }
  }
}
\`\`\``;
  };

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
      'copy': Copy,
      // ADD MISSING MAPPINGS:
      'cpu': Server,        // Fix for B3, A3, A4, B4
      'cloud': Database,    // Fix for B1, B2  
      'activity': Zap,      // Fix for C3
      'network': Globe      // Fix for D1
    };
    
    return icons[iconName] || Database; // Fallback
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
      y: row * (cellHeight + gap) + gap + 50  // Reduced from +100 to +50 for better connection alignment
    };
  };

  // Generate position from coordinates
  const generatePosition = (row, col) => {
    return String.fromCharCode(65 + col) + (row + 1);
  };

  // Get component shape style
  const getShapeStyle = (component) => {
    // Add safety check
    if (!component) {
      return {
        width: '280px',
        height: '120px',
        borderRadius: '0.75rem'
      };
    }

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

  // Enhanced GenAI integration with domain-specific prompts
  const generateDynamicContent = async (prompt, domain = null, techStack = [], role = 'architect') => {
    if (!config || !selectedModel || !prompt.trim()) return;

    setIsLoading(true);

    try {
      const modelConfig = config.genai_models.find(m => m.id === selectedModel);
      if (!modelConfig) throw new Error('Model not found');

      // Enhanced system prompt based on domain and role
      const systemPrompt = domain ? 
        generateDomainSpecificPrompt(domain, techStack, role, prompt, masterConfig) :
        `Generate the infrastructure as a valid JSON object only. Return it inside a \`\`\`json code block. Do not include any explanation, markdown, or extra text.

You are an architecture diagram generator. Generate a JSON configuration for architecture components based on the user's request.

Current context: ${JSON.stringify(config, null, 2)}

User request: ${prompt}

Please return ONLY a valid JSON object with the following structure inside a \`\`\`json code block:
\`\`\`json
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
\`\`\`

Available icons: database, shield, file-text, brain, server, zap, globe, code, upload, download, settings, edit, save, move, plus, trash, copy
Available colors: blue, green, yellow, purple, orange, indigo, red, pink, cyan

IMPORTANT: Return ONLY the JSON inside a code block. No explanations or additional text.`;

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

      // 🔍 DEBUG: Log full raw response
      console.log("🔍 RAW AI response:", content);

      let aiContent;
      try {
        // Try to match ```json blocks (more flexible regex)
        const jsonBlock = content.match(/```json\s*([\s\S]*?)```/i);
        if (jsonBlock) {
          console.log("✅ Found JSON code block");
          aiContent = JSON.parse(jsonBlock[1].trim());
        } else {
          // Try to match any top-level JSON object manually
          const braceMatch = content.match(/{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*}/s);
          if (braceMatch) {
            console.log("✅ Found JSON object via fallback");
            aiContent = JSON.parse(braceMatch[0]);
          } else {
            // Show raw response for debugging
            alert("LLM raw response: \n" + content.substring(0, 1000));
            throw new Error("❌ No valid JSON found in LLM response.");
          }
        }

        console.log("✅ Parsed AI content:", aiContent);

      } catch (err) {
        console.error("❌ JSON parsing failed:", err.message);
        // Show raw response for debugging when parsing fails
        alert("JSON parsing failed. Raw response: \n" + content.substring(0, 1000));
        throw new Error(`JSON parsing failed: ${err.message}`);
      }

      // 🔧 Use aiContent safely after validation
      if (!aiContent) {
        throw new Error('❌ No valid AI content parsed');
      }

      // Apply enhancements based on domain and tech stack
      let enhancedContent = { ...aiContent };
      
      // Add location services for retail/logistics
      if (domain === 'retail' || domain === 'logistics') {
        enhancedContent = addLocationServices(enhancedContent);
      }

      // Add LangChain agent if selected in tech stack
      if (techStack.includes('langchain')) {
        const agentComponent = createLangChainAgent(domain, ['search', 'reasoning', 'planning']);
        enhancedContent.new_components = {
          ...enhancedContent.new_components,
          AGENT1: agentComponent
        };
      }

      // Generate cost estimation
      if (role === 'project_manager' || role === 'sales') {
        const costs = estimateCosts(enhancedContent);
        enhancedContent.cost_estimation = costs;
        console.log('💰 Cost estimation:', costs);
      }

      // Update config with AI-generated content
      setConfig(prev => {
        const updated = {
          ...prev,
          title: enhancedContent.title || prev.title,
          subtitle: enhancedContent.subtitle || prev.subtitle,
          domain: enhancedContent.domain || domain,
          components: {
            ...prev.components,
            ...(enhancedContent.new_components || enhancedContent.components || {})
          },
          role_specific_views: {
            ...prev.role_specific_views,
            ...(enhancedContent.role_specific_views || {})
          },
          cost_estimation: enhancedContent.cost_estimation
        };

        console.log("✅ Updated configuration:", updated);
        setJsonEditorContent(JSON.stringify(updated, null, 2));
        return updated;
      });

      // Close configuration selector if it was used
      if (domain) {
        setShowConfigSelector(false);
      }

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

  // Handle configuration selection from ConfigurationSelector
  const handleConfigSelect = async (configPath) => {
    try {
      const response = await fetch(configPath);
      if (response.ok) {
        const selectedConfig = await response.json();
        setConfig(selectedConfig);
        setJsonEditorContent(JSON.stringify(selectedConfig, null, 2));
        setShowConfigSelector(false);
        console.log('Configuration loaded from template:', configPath);
      }
    } catch (error) {
      console.error('Failed to load selected configuration:', error);
      alert('Failed to load the selected configuration template.');
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
      
      // Safety check before deletion
      if (!newComponents[position]) {
        console.warn(`Component at ${position} doesn't exist`);
        return prev;
      }
      
      delete newComponents[position];

      // Remove connections to deleted component
      Object.keys(newComponents).forEach(pos => {
        if (newComponents[pos] && newComponents[pos].connections) {
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

    // Add safety check for selected component
    if (!config.components[selectedComponent]) {
      setIsDragging(false);
      setSelectedComponent(null);
      return;
    }

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
    console.log('🔧 prepareConnectionsData called with config:', !!config);
    
    if (!config) {
      console.log('❌ No config found');
      return [];
    }

    // 🔧 CRITICAL: Check if connections exist at TOP LEVEL (your JSON has them there)
    if (config.connections && Array.isArray(config.connections)) {
      console.log('✅ Found connections at config.connections:', config.connections.length);
      return config.connections;
    }

    // 🔧 FALLBACK: Check component-level connections (old format)
    console.log('🔍 Checking component-level connections...');
    const connections = [];
    
    if (config.components) {
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
    }
    
    console.log(`📊 Final connections extracted: ${connections.length}`);
    return connections;
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

  // Debug component removed to prevent interface blocking

  // Debug panel removed to prevent interface blocking

  // Enhanced ConnectionsLayer with better debugging
  const ConnectionsLayer = ({ connections, components }) => {
    console.log('🎨 ConnectionsLayer render:', {
      connectionsCount: connections?.length || 0,
      componentsCount: Object.keys(components || {}).length,
      hasGetPixelPosition: !!getPixelPosition
    });

    if (!connections || !Array.isArray(connections) || connections.length === 0) {
      return null; // Simply return null instead of debug overlay
    }

    if (!components || Object.keys(components).length === 0) {
      return null; // Simply return null instead of debug overlay
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

        {/* Render all connections */}
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

  // Debug component to show connection statistics (commented out to avoid unused variable warning)
  /*
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
  */

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
            <div className="btn-group">
              <button
                className="btn btn-info"
                onClick={() => window.open('/ai', '_blank')}
                title="Smart Architecture Generator"
              >
                <Brain className="btn-icon" />
                <span>Smart Generator</span>
              </button>
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

      {/* Configuration Selector Modal */}
      {showConfigSelector && (
        <div className="modal-overlay">
          <div className="modal-content modal-xlarge">
            <div className="modal-header">
              <h2 className="modal-title">
                <Brain style={{ width: '1.5rem', height: '1.5rem', color: '#8B5CF6' }} />
                <span>Smart Architecture Generator</span>
              </h2>
              <button className="btn btn-danger btn-round" onClick={() => setShowConfigSelector(false)}>
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>
            <div className="modal-body-flex">
              <ConfigurationSelector
                onConfigSelect={handleConfigSelect}
                currentConfig={config}
                generateDynamicContent={generateDynamicContent}
                masterConfig={masterConfig}
              />
            </div>
          </div>
        </div>
      )}

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
          // Add safety check here
          if (!component) {
            console.warn(`Component at position ${position} is undefined`);
            return null;
          }

          const pixelPos = getPixelPosition(position);
          const Icon = getIcon(component.icon || 'database'); // Fallback icon
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
        }).filter(Boolean)} {/* Filter out null values */}

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

          {/* Cost Estimation Display */}
          {config.cost_estimation && (
            <div className="cost-estimation-display">
              <div className="cost-header">
                <span>💰 Cost Estimation</span>
              </div>
              <div className="cost-stats">
                <div className="cost-item">
                  <span className="cost-label">Monthly:</span>
                  <span className="cost-value">${config.cost_estimation.monthly_estimate?.toLocaleString()}</span>
                </div>
                <div className="cost-item">
                  <span className="cost-label">Annual:</span>
                  <span className="cost-value">${config.cost_estimation.annual_estimate?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Master Config Status */}
          {masterConfig && (
            <div className="master-config-status">
              <div className="master-config-header">
                <span>🔧 Master Configuration Loaded</span>
              </div>
              <div className="master-config-stats">
                <div className="config-stat">
                  <span className="config-label">Domains:</span>
                  <span className="config-value">{Object.keys(masterConfig.domains || {}).length}</span>
                </div>
                <div className="config-stat">
                  <span className="config-label">Tech Stacks:</span>
                  <span className="config-value">{Object.keys(masterConfig.tech_stacks || {}).length}</span>
                </div>
                <div className="config-stat">
                  <span className="config-label">Roles:</span>
                  <span className="config-value">{Object.keys(masterConfig.roles || {}).length}</span>
                </div>
                <div className="config-stat">
                  <span className="config-label">Templates:</span>
                  <span className="config-value">{Object.keys(masterConfig.templates || {}).length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Domain Display */}
          {config.domain && (
            <div className="domain-display">
              <div className="domain-header">
                <span>🏢 Domain</span>
              </div>
              <div className="domain-value">{config.domain}</div>
            </div>
          )}

          {/* Role-Specific Views */}
          {config.role_specific_views && Object.keys(config.role_specific_views).length > 0 && (
            <div className="role-views-display">
              <div className="role-header">
                <span>👥 Active Views</span>
              </div>
              <div className="role-list">
                {Object.keys(config.role_specific_views).map(role => (
                  <span key={role} className="role-tag">{role}</span>
                ))}
              </div>
            </div>
          )}

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

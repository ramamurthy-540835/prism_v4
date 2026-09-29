import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
  Brain, 
  Settings, 
  Zap, 
  ExternalLink, 
  BookOpen, 
  X, 
  CheckCircle,
  Network,
  Activity,
  Database,
  Globe,
  Server,
  Shield,
  Cpu,
  RefreshCw,
  AlertCircle,
  GitBranch
} from 'lucide-react';

// Import CSS for bio-inspired styling
import '../styles/BioInspiredGenerator.css';

// Import your actual AI service and configurations
import { AIArchitectureService } from '../lib/AdvancedAgenticAI';

// Import your enhanced configurations
import enhancedDomains from '../config/enhanced-domains.json';
import enhancedRoles from '../config/enhanced-roles.json';
import enhancedTechStack from '../config/enhanced-tech-stack.json';
import enhancedTemplates from '../config/enhanced-templates.json';

// Enhanced Component Generator that uses selected technologies
class TechnologyComponentGenerator {
  static generateComponentsFromTechStack(selectedTech, enhancedTechStack, domain, requirements) {
    const components = {};
    
    // Generate components for ALL selected technologies
    const techComponents = this.mapTechnologiesToComponents(selectedTech, enhancedTechStack);
    
    // Generate core architecture components
    const coreComponents = this.generateCoreComponents(domain, requirements);
    
    // Generate domain-specific components based on prompt
    const domainComponents = this.generateDomainSpecificComponents(domain, requirements);
    
    // Generate GenAI components from prompt analysis
    const aiComponents = this.generateAIComponents(requirements);
    
    // Merge all components
    let allComponents = { 
      ...techComponents, 
      ...coreComponents, 
      ...domainComponents,
      ...aiComponents
    };
    
    const componentCount = Object.keys(allComponents).length;
    console.log(`Initial component count: ${componentCount}`);
    
    // 🔧 FIX: Ensure we have enough components to reasonably fill the grid
    const maxCols = 4; // Always 4 columns but max 3 components per row
    const optimalRows = Math.ceil(componentCount / 4); // Always divide by 4
    const gridCapacity = optimalRows * 3; // But max 3 components per row
    const emptySlots = gridCapacity - componentCount;
    
    console.log(`Grid capacity: ${gridCapacity}, empty slots: ${emptySlots}, rows calculation: ${componentCount}/4 = ${optimalRows} rows`);
    
    // Add supplementary components if we have too many empty slots
    if (emptySlots > 2 && componentCount < 16) {
      const supplementaryComponents = this.generateSupplementaryComponents(domain, emptySlots);
      allComponents = { ...allComponents, ...supplementaryComponents };
      console.log(`Added ${Object.keys(supplementaryComponents).length} supplementary components`);
    }
    
    console.log(`Final component count: ${Object.keys(allComponents).length}`);
    return allComponents;
  }

  // NEW: Generate supplementary components to fill grid efficiently
  static generateSupplementaryComponents(domain, slotsToFill) {
    const components = {};
    const supplementaryTypes = [
      { id: 'backup_service', title: 'Backup & Recovery', description: 'Data backup and disaster recovery', icon: 'shield', color: 'indigo' },
      { id: 'logging_service', title: 'Centralized Logging', description: 'Log aggregation and analysis', icon: 'activity', color: 'yellow' },
      { id: 'notification_service', title: 'Notification Hub', description: 'Email, SMS, and push notifications', icon: 'server', color: 'green' },
      { id: 'analytics_service', title: 'Analytics Engine', description: 'Business intelligence and reporting', icon: 'cpu', color: 'purple' },
      { id: 'file_storage', title: 'File Storage Service', description: 'Document and media storage', icon: 'database', color: 'orange' },
      { id: 'audit_service', title: 'Audit Trail Service', description: 'Compliance and audit logging', icon: 'shield', color: 'red' }
    ];
    
    for (let i = 0; i < Math.min(slotsToFill, supplementaryTypes.length); i++) {
      const comp = supplementaryTypes[i];
      components[`supplementary_${comp.id}`] = {
        id: comp.id,
        title: comp.title,
        description: comp.description,
        icon: comp.icon,
        color: comp.color,
        shape: 'rectangle',
        width: 320, // Larger standardized width
        height: 200, // Larger standardized height
        details: ['Supplementary service', 'High availability', 'Auto-scaling']
      };
    }
    
    return components;
  }

  static mapTechnologiesToComponents(selectedTech, enhancedTechStack) {
    const components = {};

    selectedTech.forEach((techId, index) => {
      const tech = this.findTechnologyById(techId, enhancedTechStack);
      if (tech) {
        const component = this.createComponentFromTechnology(tech, index);
        components[`tech_${techId}`] = component;
      }
    });

    return components;
  }

  static generateDomainSpecificComponents(domain, requirements) {
    const components = {};
    const reqLower = (requirements || '').toLowerCase();
    
    if (domain?.id === 'manufacturing' || reqLower.includes('manufacturing')) {
      components['mes_system'] = {
        id: 'mes_system',
        title: 'Manufacturing Execution System',
        description: 'Real-time production control and monitoring',
        icon: 'settings',
        color: 'orange',
        shape: 'rectangle',
        width: 320, // Larger standardized width
        height: 200, // Larger standardized height
        details: ['Production tracking', 'Work order management', 'Quality control']
      };

      components['iot_platform'] = {
        id: 'iot_platform',
        title: 'Industrial IoT Platform',
        description: 'Sensor data collection and device management',
        icon: 'network',
        color: 'green',
        shape: 'hexagon',
        width: 320, // Larger standardized width
        height: 200, // Larger standardized height
        details: ['OPC-UA support', 'MQTT protocols', 'Edge computing']
      };

      components['predictive_maintenance'] = {
        id: 'predictive_maintenance',
        title: 'Predictive Maintenance AI',
        description: 'ML-powered equipment failure prediction',
        icon: 'brain',
        color: 'cyan',
        shape: 'circle',
        width: 300, // Standardized width
        height: 180, // Standardized height
        details: ['Machine learning', 'Anomaly detection', 'Maintenance scheduling']
      };

      components['quality_control'] = {
        id: 'quality_control',
        title: 'Computer Vision QC',
        description: 'Automated quality inspection system',
        icon: 'activity',
        color: 'purple',
        shape: 'circle',
        width: 300, // Standardized width
        height: 180, // Standardized height
        details: ['Defect detection', 'Statistical process control', 'Real-time inspection']
      };

      components['digital_twin'] = {
        id: 'digital_twin',
        title: 'Digital Twin Platform',
        description: 'Virtual factory simulation and modeling',
        icon: 'cpu',
        color: 'yellow',
        shape: 'rectangle',
        width: 300, // Standardized width
        height: 180, // Standardized height
        details: ['3D simulation', 'Process optimization', 'Virtual commissioning']
      };
    }

    if (domain?.id === 'healthcare' || reqLower.includes('healthcare')) {
      components['fhir_service'] = {
        id: 'fhir_service',
        title: 'FHIR Compliance Engine',
        description: 'HL7 FHIR data standards implementation',
        icon: 'database',
        color: 'green',
        shape: 'oval',
        width: 300, // Standardized width
        height: 180, // Standardized height
        details: ['FHIR R4 support', 'Data validation', 'Interoperability']
      };

      components['ehr_integration'] = {
        id: 'ehr_integration',
        title: 'EHR Integration Hub',
        description: 'Electronic health record system integration',
        icon: 'server',
        color: 'blue',
        shape: 'hexagon',
        width: 300, // Standardized width
        height: 180, // Standardized height
        details: ['Epic integration', 'Cerner connectivity', 'Data synchronization']
      };
    }

    return components;
  }

  static generateAIComponents(requirements) {
    const components = {};
    const reqLower = (requirements || '').toLowerCase();
    
    // Add GenAI components based on prompt analysis
    if (reqLower.includes('ai') || reqLower.includes('machine learning') || reqLower.includes('ml')) {
      components['genai_orchestrator'] = {
        id: 'genai_orchestrator',
        title: 'GenAI Orchestration Hub',
        description: 'Multi-model AI coordination and routing',
        icon: 'brain',
        color: 'cyan',
        shape: 'circle',
        width: 300, // Standardized width
        height: 180, // Standardized height
        details: ['Model selection', 'Load balancing', 'Response aggregation']
      };

      // Add specific AI model endpoints
      const aiModels = [
        { id: 'phi3', name: 'Phi-3 Mini', use: 'Quick analysis' },
        { id: 'deepseek', name: 'DeepSeek Coder', use: 'Code generation' },
        { id: 'mistral', name: 'Mistral 7B', use: 'General reasoning' },
        { id: 'deepseek_r1', name: 'DeepSeek R1', use: 'Complex analysis' }
      ];

      aiModels.forEach((model, index) => {
        components[`ai_model_${model.id}`] = {
          id: `ai_model_${model.id}`,
          title: model.name,
          description: `AI model specialized for ${model.use}`,
          icon: 'cpu',
          color: 'yellow',
          shape: 'circle',
          width: 300, // Standardized width
          height: 180, // Standardized height
          details: [model.use, 'REST API', 'High availability']
        };
      });
    }

    if (reqLower.includes('computer vision') || reqLower.includes('vision')) {
      components['vision_ai'] = {
        id: 'vision_ai',
        title: 'Computer Vision Engine',
        description: 'Image and video analysis AI system',
        icon: 'activity',
        color: 'purple',
        shape: 'circle',
        width: 300, // Standardized width
        height: 180, // Standardized height
        details: ['Object detection', 'Quality inspection', 'Real-time processing']
      };
    }

    return components;
  }

  static findTechnologyById(techId, enhancedTechStack) {
    for (const category of Object.values(enhancedTechStack)) {
      const tech = category.find(t => t.id === techId);
      if (tech) return { ...tech, category: this.getCategoryName(enhancedTechStack, tech) };
    }
    return null;
  }

  static getCategoryName(enhancedTechStack, tech) {
    for (const [categoryName, techs] of Object.entries(enhancedTechStack)) {
      if (techs.find(t => t.id === tech.id)) {
        return categoryName;
      }
    }
    return 'general';
  }

  static createComponentFromTechnology(tech, index) {
    const shapes = {
      'frontend': 'rounded',
      'backend': 'rectangle', 
      'database': 'oval',
      'cloud': 'hexagon',
      'devops': 'rectangle',
      'ai_ml': 'circle',
      'mobile': 'rounded'
    };

    const colors = {
      'frontend': 'blue',
      'backend': 'green',
      'database': 'purple', 
      'cloud': 'cyan',
      'devops': 'orange',
      'ai_ml': 'yellow',
      'mobile': 'pink'
    };

    const icons = {
      'frontend': 'globe',
      'backend': 'server',
      'database': 'database',
      'cloud': 'cloud', 
      'devops': 'settings',
      'ai_ml': 'brain',
      'mobile': 'smartphone'
    };

    // Create meaningful component based on technology
    const componentTitle = tech.category === 'database' ? 
      `${tech.label} Database` : 
      tech.category === 'frontend' ?
      `${tech.label} Frontend` :
      tech.category === 'backend' ?
      `${tech.label} Service` :
      tech.category === 'cloud' ?
      `${tech.label} Platform` :
      `${tech.label} Component`;

    return {
      id: `${tech.category}_${tech.id}`,
      title: componentTitle,
      description: tech.description || `${tech.label} technology component`,
      icon: icons[tech.category] || 'cpu',
      color: colors[tech.category] || 'indigo',
      shape: shapes[tech.category] || 'rectangle',
      width: 300, // Standardized width for consistent spacing
      height: 180, // Standardized height for consistent spacing
      details: tech.useCases || [
        `${tech.category} technology`,
        `Popularity: ${tech.popularity || 75}%`,
        tech.learningCurve || 'moderate'
      ],
      technology: tech
    };
  }

  static generateCoreComponents(domain, requirements) {
    const components = {};
    
    // Always add these core infrastructure components
    components['api_gateway'] = {
      id: 'api_gateway',
      title: 'API Gateway',
      description: 'Central API management and routing',
      icon: 'server',
      color: 'orange',
      shape: 'hexagon',
      width: 300, // Standardized width
      height: 180, // Standardized height
      details: ['Request routing', 'Authentication', 'Rate limiting']
    };

    components['load_balancer'] = {
      id: 'load_balancer',
      title: 'Load Balancer',
      description: 'Traffic distribution and high availability',
      icon: 'activity',
      color: 'cyan',
      shape: 'rectangle',
      width: 300, // Standardized width
      height: 180, // Standardized height
      details: ['Traffic distribution', 'Health checks', 'SSL termination']
    };

    components['monitoring_service'] = {
      id: 'monitoring_service',
      title: 'Monitoring & Observability',
      description: 'System health and performance monitoring',
      icon: 'activity',
      color: 'yellow',
      shape: 'rectangle',
      width: 300, // Standardized width
      height: 180, // Standardized height
      details: ['Metrics collection', 'Alerting', 'Log aggregation']
    };

    components['security_service'] = {
      id: 'security_service',
      title: 'Security Service',
      description: 'Authentication and authorization',
      icon: 'shield',
      color: 'red',
      shape: 'rectangle',
      width: 300, // Standardized width
      height: 180, // Standardized height
      details: ['Identity management', 'Access control', 'Audit logging']
    };

    // Add domain-specific components
    if (domain && domain.id === 'healthcare') {
      components['fhir_service'] = {
        id: 'fhir_service',
        title: 'FHIR Compliance Service',
        description: 'HL7 FHIR data standards compliance',
        icon: 'database',
        color: 'green',
        shape: 'oval',
        width: 300, // Standardized width
        height: 180, // Standardized height
        details: ['FHIR R4 support', 'Data validation', 'Interoperability']
      };
    }

    if (domain && domain.id === 'ecommerce') {
      components['payment_service'] = {
        id: 'payment_service',
        title: 'Payment Processing',
        description: 'Secure payment transaction handling',
        icon: 'lock',
        color: 'green',
        shape: 'rectangle',
        width: 300, // Standardized width
        height: 180, // Standardized height
        details: ['PCI compliance', 'Multiple gateways', 'Fraud detection']
      };
    }

    return components;
  }
}

// Enhanced Connection Generator for Real Architecture
class SmartConnectionGenerator {
  // ===================================================================
  // FIX 3: Enhanced Connection Validation with Self-Connection Prevention
  // ===================================================================
  static validateAndCleanConnections(connections) {
    console.log(`🔍 Validating ${connections.length} connections...`);
    
    const cleanedConnections = [];
    const issues = [];
    
    connections.forEach((conn, index) => {
      // Check for self-connections
      if (conn.from === conn.to) {
        issues.push(`Self-connection: ${conn.from} → ${conn.to}`);
        return; // Skip this connection
      }
      
      // Check for duplicate connections
      const isDuplicate = cleanedConnections.some(existing =>
        (existing.from === conn.from && existing.to === conn.to) ||
        (existing.from === conn.to && existing.to === conn.from && conn.type === 'bidirectional')
      );
      
      if (!isDuplicate) {
        cleanedConnections.push(conn);
      } else {
        issues.push(`Duplicate connection: ${conn.from} → ${conn.to}`);
      }
    });
    
    if (issues.length > 0) {
      console.log(`🔧  ${issues.length} connection issues:`);
      issues.forEach(issue => console.log(`   ❌ ${issue}`));
    }
    
    console.log(`✅ Validation complete: ${cleanedConnections.length} valid connections`);
    return cleanedConnections;
  }

  static generateConnections(components, requirements = '') {
    const connections = [];
    const componentEntries = Object.entries(components);
    const typeMapping = this.mapComponentTypes(components);
    
    console.log(`🔗 Generating connections for ${componentEntries.length} components`);
    console.log('Component types:', Object.keys(typeMapping).filter(key => typeMapping[key].length > 0));
    
    // Create layered architecture connections
    this.createArchitecturalLayers(typeMapping, connections);
    
    // Add data flow connections
    this.addDataFlowConnections(typeMapping, connections);
    
    // Add prompt-based intelligent connections
    this.addPromptBasedConnections(typeMapping, connections, requirements);
    
    // Add monitoring and cross-cutting connections
    this.addCrossCuttingConnections(typeMapping, connections);
    
    // Add GenAI specific connections
    this.addGenAIConnections(typeMapping, connections);
    
    // ENHANCED: Add dynamic row-based connections for better architecture
    this.addDynamicRowConnections(components, connections);
    
    // FINAL: Ensure ALL components are connected
    this.ensureAllComponentsConnected(Object.keys(components), connections);
    
    // ULTRA FINAL: Double-check for missing connections and fill gaps
    this.fillMissingConnections(components, connections);
    
    // ✅ NOTE: With improved spacing (320x200 + 40px gaps), connections now have sufficient room
    // and will not overlap due to cramped layout. Connection curves can breathe properly.
    
    // VERIFICATION: Comprehensive connection audit
    this.verifyAllComponentsConnected(components, connections);
    
    // ✅ NEW: Validate and clean connections
    const cleanedConnections = this.validateAndCleanConnections(connections);
    
    // Final verification with cleaned connections
    this.verifyAllComponentsConnected(components, cleanedConnections);
    
    console.log(`✅ Generated ${cleanedConnections.length} validated connections ensuring ALL components connected`);
    console.log(`🔗 Connection breakdown:`);
    console.log(`- Single: ${cleanedConnections.filter(c => c.type === 'single').length}`);
    console.log(`- Bidirectional: ${cleanedConnections.filter(c => c.type === 'bidirectional').length}`);
    console.log(`- One-to-Many: ${cleanedConnections.filter(c => c.type === 'oneToMany').length}`);
    console.log(`- Data Flow: ${cleanedConnections.filter(c => c.type === 'dataFlow').length}`);
    console.log(`- AI Connections: ${cleanedConnections.filter(c => c.label && c.label.includes('AI')).length}`);
    
    return cleanedConnections;
  }

  static addDynamicRowConnections(components, connections) {
    console.log('🔀 Adding dynamic row-based connections...');
    const componentPositions = Object.keys(components);
    
    // Group components by row (A1, A2, A3 = Row A)
    const rowGroups = {};
    componentPositions.forEach(pos => {
      const row = pos.charAt(0);
      if (!rowGroups[row]) rowGroups[row] = [];
      rowGroups[row].push(pos);
    });
    
    // Create horizontal connections within rows (peer services)
    Object.entries(rowGroups).forEach(([row, positions]) => {
      if (positions.length > 1) {
        // Connect ALL components in the row to each other (mesh pattern)
        for (let i = 0; i < positions.length; i++) {
          for (let j = i + 1; j < positions.length; j++) {
            const from = positions[i];
            const to = positions[j];
            
            // Check if connection already exists
            const exists = connections.find(c => 
              (c.from === from && c.to === to) || (c.from === to && c.to === from)
            );
            
            if (!exists) {
              connections.push({
                from,
                to,
                type: 'bidirectional',
                label: `Row ${row} Service Mesh`,
                style: 'mesh'
              });
            }
          }
        }
      }
    });
    
    // Create vertical connections between rows (layered architecture)
    const rows = Object.keys(rowGroups).sort();
    for (let i = 0; i < rows.length - 1; i++) {
      const currentRow = rowGroups[rows[i]];
      const nextRow = rowGroups[rows[i + 1]];
      
      // Connect EVERY component in current row to MULTIPLE components in next row
      currentRow.forEach((fromPos, fromIndex) => {
        nextRow.forEach((toPos, toIndex) => {
          // Create connections based on position alignment and type compatibility
          const shouldConnect = fromIndex === toIndex || // Same position index
                               fromIndex % nextRow.length === toIndex || // Cyclic connection
                               (fromIndex === 0 && toIndex === 0); // Always connect first components
          
          if (shouldConnect) {
            const exists = connections.find(c => 
              (c.from === fromPos && c.to === toPos) || (c.from === toPos && c.to === fromPos)
            );
            
            if (!exists) {
              connections.push({
                from: fromPos,
                to: toPos,
                type: 'dataFlow',
                label: `${rows[i]}→${rows[i + 1]} Data Flow`,
                style: 'streaming'
              });
            }
          }
        });
      });
    }
  }

  static ensureAllComponentsConnected(positions, connections) {
    const connectedComponents = new Set();
    
    connections.forEach(conn => {
      connectedComponents.add(conn.from);
      connectedComponents.add(conn.to);
    });

    const unconnected = positions.filter(pos => !connectedComponents.has(pos));
    
    if (unconnected.length > 0) {
      console.log(`🔧 Connecting ${unconnected.length} orphaned components`);
      
      const connectionCounts = {};
      connections.forEach(conn => {
        connectionCounts[conn.from] = (connectionCounts[conn.from] || 0) + 1;
        connectionCounts[conn.to] = (connectionCounts[conn.to] || 0) + 1;
      });
      
      const mostConnected = Object.keys(connectionCounts).reduce((a, b) => 
        connectionCounts[a] > connectionCounts[b] ? a : b, positions[0]);
      
      unconnected.forEach((orphan, index) => {
        const target = Object.keys(connectionCounts)[index % Object.keys(connectionCounts).length] || mostConnected;
        
        connections.push({
          from: orphan,
          to: target,
          type: 'single',
          label: 'System Integration Bridge',
          style: 'integration'
        });
        
        console.log(`🔗 Connected orphan ${orphan} to ${target}`);
      });
    }
  }

  static addGenAIConnections(types, connections) {
    // Connect GenAI orchestrator to individual AI models
    const genaiOrchestrators = Object.entries(types).reduce((acc, [type, positions]) => {
      positions.forEach(pos => {
        const components = this.getComponentsMap();
        if (components[pos]?.id === 'genai_orchestrator') {
          acc.push(pos);
        }
      });
      return acc;
    }, []);

    const aiModels = Object.entries(types).reduce((acc, [type, positions]) => {
      positions.forEach(pos => {
        const components = this.getComponentsMap();
        if (components[pos]?.id?.startsWith('ai_model_')) {
          acc.push(pos);
        }
      });
      return acc;
    }, []);

    // Connect orchestrator to AI models
    genaiOrchestrators.forEach(orchestrator => {
      aiModels.forEach(model => {
        connections.push({
          from: orchestrator,
          to: model,
          type: 'dataFlow',
          label: 'AI Model Routing'
        });
      });
    });

    // Connect business services to GenAI orchestrator
    genaiOrchestrators.forEach(orchestrator => {
      [...types.business_service, ...types.data_service].forEach(service => {
        connections.push({
          from: service,
          to: orchestrator,
          type: 'single',
          label: 'AI Requests'
        });
      });
    });
  }

  static addPromptBasedConnections(types, connections, requirements) {
    const reqLower = (requirements || '').toLowerCase();
    
    // Real-time connections for real-time systems
    if (reqLower.includes('real-time') || reqLower.includes('realtime')) {
      types.message_queue.forEach(queue => {
        [...types.business_service, ...types.data_service].forEach(service => {
          connections.push({
            from: service,
            to: queue,
            type: 'dataFlow',
            label: 'Real-time Events'
          });
        });
      });
    }
    
    // Compliance connections for regulated industries
    if (reqLower.includes('compliance') || reqLower.includes('hipaa') || reqLower.includes('gdpr') || reqLower.includes('sox')) {
      types.security.forEach(security => {
        [...types.database, ...types.data_service].forEach(component => {
          connections.push({
            from: component,
            to: security,
            type: 'bidirectional',
            label: 'Compliance Audit'
          });
        });
      });
    }
    
    // Scalability connections for high-scale systems
    if (reqLower.includes('scalable') || reqLower.includes('scale') || reqLower.includes('high availability')) {
      // Add load balancer connections
      const loadBalancers = Object.entries(types).reduce((acc, [type, positions]) => {
        positions.forEach(pos => {
          const components = this.getComponentsMap();
          if (components[pos]?.title?.toLowerCase().includes('load balancer')) {
            acc.push(pos);
          }
        });
        return acc;
      }, []);
      
      loadBalancers.forEach(lb => {
        [...types.business_service, ...types.api_gateway].forEach(service => {
          // 🔧 FIX: Prevent self-connections for load balancers
          if (service !== lb) {
            connections.push({
              from: lb,
              to: service,
              type: 'oneToMany',
              label: 'Load Distribution'
            });
          }
        });
      });
    }
    
    // Analytics connections for data processing
    if (reqLower.includes('analytics') || reqLower.includes('reporting') || reqLower.includes('dashboard')) {
      types.database.forEach(db => {
        types.business_service.forEach(service => {
          if (service !== db) {
            connections.push({
              from: db,
              to: service,
              type: 'dataFlow',
              label: 'Analytics Data'
            });
          }
        });
      });
    }
    
    // Manufacturing-specific connections
    if (reqLower.includes('manufacturing') || reqLower.includes('production') || reqLower.includes('factory')) {
      const iotPlatforms = Object.entries(types).reduce((acc, [type, positions]) => {
        positions.forEach(pos => {
          const components = this.getComponentsMap();
          if (components[pos]?.id === 'iot_platform') {
            acc.push(pos);
          }
        });
        return acc;
      }, []);
      
      iotPlatforms.forEach(iot => {
        types.business_service.forEach(service => {
          connections.push({
            from: iot,
            to: service,
            type: 'dataFlow',
            label: 'Sensor Data'
          });
        });
      });
    }
    
    // Healthcare-specific connections
    if (reqLower.includes('healthcare') || reqLower.includes('patient') || reqLower.includes('medical')) {
      const fhirServices = Object.entries(types).reduce((acc, [type, positions]) => {
        positions.forEach(pos => {
          const components = this.getComponentsMap();
          if (components[pos]?.id === 'fhir_service') {
            acc.push(pos);
          }
        });
        return acc;
      }, []);
      
      fhirServices.forEach(fhir => {
        types.database.forEach(db => {
          connections.push({
            from: fhir,
            to: db,
            type: 'bidirectional',
            label: 'FHIR Data Exchange'
          });
        });
      });
    }
  }

  static mapComponentTypes(components) {
    const types = {
      frontend: [],
      api_gateway: [],
      business_service: [],
      data_service: [],
      database: [],
      cache: [],
      message_queue: [],
      monitoring: [],
      security: [],
      ai_ml: [],
      genai_orchestrator: [],
      ai_models: [],
      iot_platform: [],
      vision_ai: [],
      external_api: []
    };

    Object.entries(components).forEach(([position, component]) => {
      const type = this.classifyComponent(component);
      if (types[type]) {
        types[type].push(position);
      } else {
        types.business_service.push(position);
      }
    });

    return types;
  }

  static classifyComponent(component) {
    const title = (component.title || '').toLowerCase();
    const desc = (component.description || '').toLowerCase();
    const id = (component.id || '').toLowerCase();
    
    // GenAI specific classifications
    if (id === 'genai_orchestrator' || title.includes('genai orchestration')) {
      return 'genai_orchestrator';
    }
    if (id.startsWith('ai_model_') || title.includes('phi-3') || title.includes('deepseek') || title.includes('mistral')) {
      return 'ai_models';
    }
    if (id === 'vision_ai' || title.includes('computer vision') || title.includes('vision engine')) {
      return 'vision_ai';
    }
    if (id === 'iot_platform' || title.includes('iot platform') || title.includes('industrial iot')) {
      return 'iot_platform';
    }
    
    // Standard classifications  
    if (title.includes('frontend') || title.includes('ui') || title.includes('interface') || title.includes('web app')) {
      return 'frontend';
    }
    if (title.includes('api gateway') || title.includes('gateway') || title.includes('proxy')) {
      return 'api_gateway';
    }
    if (title.includes('load balancer') || title.includes('load balancing') || title.includes('load distribution')) {
      return 'api_gateway'; // Treat load balancers as gateway-level components
    }
    if (title.includes('payment') || title.includes('billing') || title.includes('transaction')) {
      return 'business_service'; // Payment services are business logic
    }
    if (title.includes('database') || title.includes('storage') || title.includes('data store') || desc.includes('database')) {
      return 'database';
    }
    if (title.includes('cache') || title.includes('redis') || title.includes('memory')) {
      return 'cache';
    }
    if (title.includes('queue') || title.includes('message') || title.includes('kafka') || title.includes('event')) {
      return 'message_queue';
    }
    if (title.includes('monitor') || title.includes('metrics') || title.includes('logging') || title.includes('observability')) {
      return 'monitoring';
    }
    if (title.includes('auth') || title.includes('security') || title.includes('identity') || title.includes('oauth')) {
      return 'security';
    }
    if (title.includes('ai') || title.includes('ml') || title.includes('model') || title.includes('intelligence')) {
      return 'ai_ml';
    }
    if (title.includes('external') || title.includes('third party') || title.includes('integration')) {
      return 'external_api';
    }
    if (title.includes('data') && (title.includes('service') || title.includes('processor'))) {
      return 'data_service';
    }
    
    return 'business_service';
  }

  // Helper method to store components map for connection generation
  static componentsMap = {};
  
  static setComponentsMap(components) {
    this.componentsMap = components;
  }
  
  static getComponentsMap() {
    return this.componentsMap;
  }

  static createArchitecturalLayers(types, connections) {
    // Frontend -> API Gateway
    types.frontend.forEach(frontend => {
      types.api_gateway.forEach(gateway => {
        connections.push({
          from: frontend,
          to: gateway,
          type: 'single',
          label: 'HTTP/HTTPS Requests'
        });
      });
    });

    // API Gateway -> Business Services (and other services)
    types.api_gateway.forEach(gateway => {
      [...types.business_service, ...types.ai_ml, ...types.data_service].forEach(service => {
        connections.push({
          from: gateway,
          to: service,
          type: 'dataFlow',
          label: 'API Routing'
        });
      });
    });

    // Business Services -> Data Services
    types.business_service.forEach(business => {
      types.data_service.forEach(data => {
        connections.push({
          from: business,
          to: data,
          type: 'single',
          label: 'Data Operations'
        });
      });
    });

    // Data Services -> Database
    types.data_service.forEach(data => {
      types.database.forEach(db => {
        connections.push({
          from: data,
          to: db,
          type: 'bidirectional',
          label: 'CRUD Operations'
        });
      });
    });

    // If no data services, connect business services directly to database
    if (types.data_service.length === 0) {
      types.business_service.forEach(service => {
        types.database.forEach(db => {
          connections.push({
            from: service,
            to: db,
            type: 'bidirectional',
            label: 'Database Access'
          });
        });
      });
    }

    // Ensure all business services connect to databases if no other path exists
    types.business_service.forEach(service => {
      types.database.forEach(db => {
        // Only add if no existing connection
        const existingConnection = connections.find(c => 
          (c.from === service && c.to === db) || 
          (c.from === db && c.to === service)
        );
        if (!existingConnection) {
          connections.push({
            from: service,
            to: db,
            type: 'bidirectional',
            label: 'Database Access'
          });
        }
      });
    });

    // Connect similar services for redundancy/clustering
    if (types.api_gateway.length > 1) {
      for (let i = 0; i < types.api_gateway.length - 1; i++) {
        connections.push({
          from: types.api_gateway[i],
          to: types.api_gateway[i + 1],
          type: 'bidirectional',
          label: 'Gateway Sync'
        });
      }
    }

    if (types.database.length > 1) {
      for (let i = 0; i < types.database.length - 1; i++) {
        connections.push({
          from: types.database[i],
          to: types.database[i + 1],
          type: 'bidirectional',
          label: 'Data Replication'
        });
      }
    }
  }

  static addDataFlowConnections(types, connections) {
    // Cache connections - connect to all services that might need caching
    types.cache.forEach(cache => {
      [...types.business_service, ...types.data_service, ...types.api_gateway].forEach(service => {
        connections.push({
          from: service,
          to: cache,
          type: 'single',
          label: 'Cache Operations'
        });
      });
    });

    // Message queue connections - bidirectional for pub/sub
    types.message_queue.forEach(queue => {
      [...types.business_service, ...types.data_service].forEach(service => {
        connections.push({
          from: service,
          to: queue,
          type: 'bidirectional',
          label: 'Event Publishing/Consuming'
        });
      });
    });

    // AI/ML connections - ensure all business services can access AI
    types.ai_ml.forEach(ai => {
      [...types.business_service, ...types.api_gateway].forEach(service => {
        connections.push({
          from: service,
          to: ai,
          type: 'single',
          label: 'ML Inference'
        });
      });
    });

    // External API connections - connect to business services
    types.external_api.forEach(external => {
      [...types.business_service, ...types.api_gateway].forEach(service => {
        connections.push({
          from: service,
          to: external,
          type: 'single',
          label: 'External Integration'
        });
      });
    });

    // IoT Platform connections for manufacturing
    types.iot_platform.forEach(iot => {
      [...types.business_service, ...types.ai_ml].forEach(service => {
        connections.push({
          from: iot,
          to: service,
          type: 'dataFlow',
          label: 'Sensor Data Stream'
        });
      });
    });

    // Quality Control connections
    const qualityControlComponents = Object.entries(types).reduce((acc, [type, positions]) => {
      positions.forEach(pos => {
        const components = this.getComponentsMap();
        if (components[pos]?.id === 'quality_control') {
          acc.push(pos);
        }
      });
      return acc;
    }, []);

    qualityControlComponents.forEach(qc => {
      [...types.business_service, ...types.iot_platform].forEach(service => {
        connections.push({
          from: service,
          to: qc,
          type: 'dataFlow',
          label: 'Quality Data Feed'
        });
      });
      
      // 🔧 FIX: Ensure Quality Control connects to Monitoring for reporting
      types.monitoring.forEach(monitor => {
        connections.push({
          from: qc,
          to: monitor,
          type: 'oneToMany',
          label: 'Quality Reports'
        });
      });
    });
  }

  static ensureAllComponentsConnected(types, connections) {
    const allComponents = Object.values(types).flat();
    const connectedComponents = new Set();
    
    // Track all connected components
    connections.forEach(conn => {
      connectedComponents.add(conn.from);
      connectedComponents.add(conn.to);
    });

    // Find unconnected components and connect them intelligently
    allComponents.forEach(component => {
      if (!connectedComponents.has(component)) {
        console.log(`🔧 Found orphaned component: ${component}`);
        
        // Get the component details to determine best connection
        const components = this.getComponentsMap();
        const componentData = components[component];
        const componentType = this.classifyComponent(componentData);
        
        // Smart connection based on component type
        switch(componentType) {
          case 'frontend':
            // Frontend should connect to API gateways
            if (types.api_gateway.length > 0) {
              connections.push({
                from: component,
                to: types.api_gateway[0],
                type: 'single',
                label: 'UI Requests'
              });
            }
            break;
            
          case 'database':
          case 'cache':
            // Databases should connect to business services
            if (types.business_service.length > 0) {
              connections.push({
                from: types.business_service[0],
                to: component,
                type: 'bidirectional',
                label: 'Data Access'
              });
            }
            break;
            
          case 'monitoring':
            // Monitoring should receive data from all services
            [...types.business_service, ...types.api_gateway, ...types.database].forEach(service => {
              if (service !== component) {
                connections.push({
                  from: service,
                  to: component,
                  type: 'oneToMany',
                  label: 'Monitoring Data'
                });
              }
            });
            break;
            
          case 'security':
            // Security should connect to gateways and frontends
            [...types.frontend, ...types.api_gateway].forEach(service => {
              if (service !== component) {
                connections.push({
                  from: service,
                  to: component,
                  type: 'bidirectional',
                  label: 'Authentication'
                });
              }
            });
            break;
            
          case 'ai_ml':
          case 'vision_ai':
            // AI components should connect to business services
            [...types.business_service, ...types.iot_platform].forEach(service => {
              if (service !== component) {
                connections.push({
                  from: service,
                  to: component,
                  type: 'single',
                  label: 'AI Processing'
                });
              }
            });
            break;
            
          case 'iot_platform':
            // IoT should feed data to business services and AI
            [...types.business_service, ...types.ai_ml].forEach(service => {
              if (service !== component) {
                connections.push({
                  from: component,
                  to: service,
                  type: 'dataFlow',
                  label: 'IoT Data Stream'
                });
              }
            });
            break;
            
          default:
            // Default fallback: connect to the most connected component
            const connectionCounts = {};
            connections.forEach(conn => {
              connectionCounts[conn.from] = (connectionCounts[conn.from] || 0) + 1;
              connectionCounts[conn.to] = (connectionCounts[conn.to] || 0) + 1;
            });
            
            const mostConnected = Object.keys(connectionCounts).reduce((a, b) => 
              connectionCounts[a] > connectionCounts[b] ? a : b, allComponents[0]);
            
            if (mostConnected && mostConnected !== component) {
              connections.push({
                from: component,
                to: mostConnected,
                type: 'single',
                label: 'System Integration'
              });
            }
            break;
        }
        
        console.log(`✅ Connected orphan ${component}`);
      }
    });
  }

  static fillMissingConnections(components, connections) {
    console.log('🔍 Final check for missing connections...');
    
    const allPositions = Object.keys(components);
    const connectedComponents = new Set();
    const connectionCounts = {};
    
    // Track connections and count per component
    connections.forEach(conn => {
      connectedComponents.add(conn.from);
      connectedComponents.add(conn.to);
      connectionCounts[conn.from] = (connectionCounts[conn.from] || 0) + 1;
      connectionCounts[conn.to] = (connectionCounts[conn.to] || 0) + 1;
    });
    
    // Find components with insufficient connections (less than 2)
    const underconnectedComponents = allPositions.filter(pos => 
      (connectionCounts[pos] || 0) < 2
    );
    
    if (underconnectedComponents.length > 0) {
      console.log(`🔧 Found ${underconnectedComponents.length} under-connected components:`, underconnectedComponents);
      
      underconnectedComponents.forEach(component => {
        const currentConnections = connectionCounts[component] || 0;
        const neededConnections = Math.max(0, 3 - currentConnections); // Aim for at least 3 connections
        
        // Find best targets for connection
        const potentialTargets = allPositions
          .filter(pos => pos !== component)
          .filter(pos => !connections.find(c => 
            (c.from === component && c.to === pos) || (c.from === pos && c.to === component)
          ))
          .sort((a, b) => (connectionCounts[b] || 0) - (connectionCounts[a] || 0)); // Sort by most connected first
        
        // Add connections to top targets
        for (let i = 0; i < Math.min(neededConnections, potentialTargets.length); i++) {
          const target = potentialTargets[i];
          
          // Determine connection type based on component types
          const componentData = components[component];
          const targetData = components[target];
          const connectionType = this.determineConnectionType(componentData, targetData);
          const label = this.generateConnectionLabel(componentData, targetData);
          
          connections.push({
            from: component,
            to: target,
            type: connectionType,
            label: label,
            style: 'supplementary'
          });
          
          connectionCounts[component] = (connectionCounts[component] || 0) + 1;
          connectionCounts[target] = (connectionCounts[target] || 0) + 1;
          
          console.log(`🔗 Added supplementary connection: ${component} → ${target} (${label})`);
        }
      });
    }
    
    // Final verification
    const finalConnectionCounts = {};
    connections.forEach(conn => {
      finalConnectionCounts[conn.from] = (finalConnectionCounts[conn.from] || 0) + 1;
      finalConnectionCounts[conn.to] = (finalConnectionCounts[conn.to] || 0) + 1;
    });
    
    const stillOrphaned = allPositions.filter(pos => !finalConnectionCounts[pos]);
    if (stillOrphaned.length > 0) {
      console.log(`⚠️ Still orphaned components:`, stillOrphaned);
    } else {
      console.log(`✅ All ${allPositions.length} components now have connections!`);
    }
  }

  static determineConnectionType(fromComponent, toComponent) {
    const fromTitle = (fromComponent?.title || '').toLowerCase();
    const toTitle = (toComponent?.title || '').toLowerCase();
    
    // Database connections are usually bidirectional
    if (fromTitle.includes('database') || toTitle.includes('database')) {
      return 'bidirectional';
    }
    
    // Monitoring connections are usually oneToMany
    if (toTitle.includes('monitoring') || toTitle.includes('observability')) {
      return 'oneToMany';
    }
    
    // AI/ML connections are usually single direction
    if (toTitle.includes('ai') || toTitle.includes('ml') || toTitle.includes('vision')) {
      return 'single';
    }
    
    // Data flows
    if (fromTitle.includes('iot') || fromTitle.includes('sensor')) {
      return 'dataFlow';
    }
    
    return 'single'; // Default
  }

  static generateConnectionLabel(fromComponent, toComponent) {
    const fromTitle = (fromComponent?.title || '').toLowerCase();
    const toTitle = (toComponent?.title || '').toLowerCase();
    
    if (toTitle.includes('database')) return 'Data Storage';
    if (toTitle.includes('cache')) return 'Caching';
    if (toTitle.includes('monitoring')) return 'Telemetry';
    if (toTitle.includes('security')) return 'Security Check';
    if (toTitle.includes('ai') || toTitle.includes('ml')) return 'AI Processing';
    if (fromTitle.includes('iot')) return 'Sensor Data';
    if (fromTitle.includes('frontend')) return 'User Interface';
    if (toTitle.includes('gateway')) return 'API Gateway';
    
    return 'System Integration'; // Default
  }

  static addCrossCuttingConnections(types, connections) {
    // 🔧 FIX: Complete monitoring connections - ensure ALL components connect
    types.monitoring.forEach(monitor => {
      const allServices = [
        ...types.frontend,
        ...types.api_gateway,
        ...types.business_service,
        ...types.data_service,
        ...types.database,
        ...types.cache,
        ...types.ai_ml,
        ...types.iot_platform,
        ...types.external_api
      ];
      
      allServices.forEach(service => {
        // ✅ : Prevent self-connections here too
        if (service !== monitor) {
          connections.push({
            from: service,
            to: monitor,
            type: 'oneToMany',
            label: 'Metrics & Logs'
          });
        }
      });
    });

    // Security connections - also prevent self-connections
    types.security.forEach(security => {
      [...types.frontend, ...types.api_gateway].forEach(component => {
        if (component !== security) { // Prevent self-connections
          connections.push({
            from: component,
            to: security,
            type: 'bidirectional',
            label: 'Authentication'
          });
        }
      });
    });
  }

  // COMPREHENSIVE VERIFICATION: Ensure all components have connections
  static verifyAllComponentsConnected(components, connections) {
    console.log('🔍 VERIFICATION: Comprehensive connection audit...');
    
    const allPositions = Object.keys(components);
    const connectedComponents = new Set();
    const connectionCounts = {};
    const detailedReport = {};
    
    // Build detailed connection report
    connections.forEach(conn => {
      connectedComponents.add(conn.from);
      connectedComponents.add(conn.to);
      connectionCounts[conn.from] = (connectionCounts[conn.from] || 0) + 1;
      connectionCounts[conn.to] = (connectionCounts[conn.to] || 0) + 1;
      
      // Track connection details
      if (!detailedReport[conn.from]) detailedReport[conn.from] = { outgoing: [], incoming: [] };
      if (!detailedReport[conn.to]) detailedReport[conn.to] = { outgoing: [], incoming: [] };
      
      detailedReport[conn.from].outgoing.push(`${conn.to} (${conn.label})`);
      detailedReport[conn.to].incoming.push(`${conn.from} (${conn.label})`);
    });
    
    // Check for disconnected components
    const disconnectedComponents = allPositions.filter(pos => !connectedComponents.has(pos));
    const underConnectedComponents = allPositions.filter(pos => (connectionCounts[pos] || 0) < 2);
    
    // Report results
    console.log(`📊 CONNECTION AUDIT RESULTS:`);
    console.log(`   Total Components: ${allPositions.length}`);
    console.log(`   Connected Components: ${connectedComponents.size}`);
    console.log(`   Disconnected Components: ${disconnectedComponents.length}`);
    console.log(`   Under-connected (<2 connections): ${underConnectedComponents.length}`);
    console.log(`   Total Connections: ${connections.length}`);
    
    if (disconnectedComponents.length > 0) {
      console.error(`❌ DISCONNECTED COMPONENTS:`, disconnectedComponents);
    }
    
    if (underConnectedComponents.length > 0) {
      console.warn(`⚠️ UNDER-CONNECTED COMPONENTS:`, underConnectedComponents.map(c => `${c}(${connectionCounts[c] || 0})`));
    }
    
    // Success check
    if (disconnectedComponents.length === 0 && underConnectedComponents.length === 0) {
      console.log(`✅ VERIFICATION PASSED: All ${allPositions.length} components have adequate connections!`);
    } else {
      console.log(`🔧 FIXING remaining connection issues...`);
      
      // Emergency fix for any remaining issues
      [...disconnectedComponents, ...underConnectedComponents].forEach(component => {
        const needed = Math.max(2 - (connectionCounts[component] || 0), 0);
        const availableTargets = allPositions.filter(pos => pos !== component);
        
        for (let i = 0; i < needed && i < availableTargets.length; i++) {
          const target = availableTargets[i];
          connections.push({
            from: component,
            to: target,
            type: 'single',
            label: 'Emergency Integration Bridge',
            style: 'emergency'
          });
          console.log(`🚨 Emergency connection added: ${component} → ${target}`);
        }
      });
    }
    
    return {
      totalComponents: allPositions.length,
      connectedComponents: connectedComponents.size,
      disconnectedComponents: disconnectedComponents.length,
      underConnectedComponents: underConnectedComponents.length,
      totalConnections: connections.length,
      detailedReport
    };
  }
}

// Grid Layout Calculator with Better Distribution
class GridLayoutManager {
  static calculateGrid(componentCount) {
    console.log(`📐 DYNAMIC Grid calculation for ${componentCount} components`);
    
    // 🔧 FIX: Dynamic grid with max 3 components per row + breathing room
    const maxComponentsPerRow = 3; // Max 3 components per row
    const cols = 4; // Grid has 4 columns but we only use first 3
    
    if (componentCount <= 0) return { rows: 3, cols: 4 }; // Minimum 3 rows
    if (componentCount <= 3) return { rows: 3, cols: 4 }; // Minimum 3 rows even for few components
    
    // Calculate rows with extra breathing room
    const baseRows = Math.ceil(componentCount / maxComponentsPerRow);
    const rows = Math.max(3, baseRows + 4); // Add 4 extra rows for maximum spacing
    
    console.log(`📏 DYNAMIC Grid result: ${rows} rows × ${cols} cols for ${componentCount} components (base: ${baseRows}, with breathing room: ${rows})`);
    return { rows, cols };
  }

  static distributeComponents(components, gridConfig) {
    const positions = this.generatePositions(gridConfig);
    const componentEntries = Object.entries(components);
    const distributedComponents = {};

    // Sort components by type for better distribution
    const sortedComponents = this.sortComponentsByArchitecturalLayer(componentEntries);

    // Calculate dynamic cell size based on content
    const avgTitleLength = sortedComponents.reduce((sum, [_, comp]) => sum + (comp.title?.length || 0), 0) / sortedComponents.length;
    const avgDescLength = sortedComponents.reduce((sum, [_, comp]) => sum + (comp.description?.length || 0), 0) / sortedComponents.length;
    
    // 🔧 FIX: Use consistent larger sizing to prevent cramping
    const dynamicWidth = 380; // Much larger width for maximum spacing
    const dynamicHeight = 240; // Much larger height for maximum spacing

    console.log(`Maximum sizing: ${dynamicWidth}×${dynamicHeight} (maximum components for optimal layout, avg title: ${avgTitleLength.toFixed(1)}, desc: ${avgDescLength.toFixed(1)})`);

    sortedComponents.forEach(([key, component], index) => {
      if (index < positions.length) {
        const position = positions[index];
        distributedComponents[position] = {
          ...component,
          shape: this.getProperShape(component),
          icon: this.getProperIcon(component),
          color: this.getProperColor(component, index),
          width: dynamicWidth,
          height: dynamicHeight
        };
      }
    });

    return distributedComponents;
  }

  static generatePositions(gridConfig) {
    const positions = [];
    for (let row = 1; row <= gridConfig.rows; row++) {
      // 🔧 FIX: Only use first 3 columns per row (max 3 components per row)
      const maxColsPerRow = Math.min(3, gridConfig.cols);
      for (let col = 1; col <= maxColsPerRow; col++) {
        positions.push(`${String.fromCharCode(64 + row)}${col}`);
      }
    }
    return positions;
  }

  static sortComponentsByArchitecturalLayer(componentEntries) {
    const layerOrder = {
      'frontend': 0,
      'api_gateway': 1,
      'business_service': 2,
      'data_service': 3,
      'database': 4,
      'cache': 5,
      'message_queue': 6,
      'ai_ml': 7,
      'monitoring': 8,
      'security': 9,
      'external_api': 10
    };

    return componentEntries.sort(([, a], [, b]) => {
      const typeA = SmartConnectionGenerator.classifyComponent(a);
      const typeB = SmartConnectionGenerator.classifyComponent(b);
      return (layerOrder[typeA] || 99) - (layerOrder[typeB] || 99);
    });
  }

  static getProperShape(component) {
    const title = (component.title || '').toLowerCase();
    
    // Database components should be ovals
    if (title.includes('database') || title.includes('storage') || title.includes('warehouse')) {
      return 'oval';
    }
    
    // Decision/Gateway components should be diamonds or hexagons
    if (title.includes('gateway') || title.includes('proxy') || title.includes('router')) {
      return 'hexagon';
    }
    
    // AI/ML components should be circles
    if (title.includes('ai') || title.includes('ml') || title.includes('model') || title.includes('brain')) {
      return 'circle';
    }
    
    // Cache components should be rounded rectangles
    if (title.includes('cache') || title.includes('memory') || title.includes('redis')) {
      return 'rounded';
    }
    
    // Frontend components should be rounded
    if (title.includes('frontend') || title.includes('ui') || title.includes('web')) {
      return 'rounded';
    }
    
    // Default to rectangle for services
    return 'rectangle';
  }

  static getProperIcon(component) {
    const title = (component.title || '').toLowerCase();
    
    if (title.includes('database') || title.includes('storage')) return 'database';
    if (title.includes('frontend') || title.includes('ui') || title.includes('web')) return 'globe';
    if (title.includes('api') || title.includes('gateway') || title.includes('server')) return 'server';
    if (title.includes('cache') || title.includes('memory')) return 'zap';
    if (title.includes('monitor') || title.includes('metrics')) return 'activity';
    if (title.includes('security') || title.includes('auth')) return 'shield';
    if (title.includes('ai') || title.includes('ml') || title.includes('brain')) return 'brain';
    if (title.includes('queue') || title.includes('event') || title.includes('message')) return 'git-branch';
    if (title.includes('network') || title.includes('integration')) return 'network';
    if (title.includes('cloud') || title.includes('service')) return 'cloud';
    
    return 'cpu'; // Default
  }

  static getProperColor(component, index) {
    const colors = ['blue', 'green', 'purple', 'orange', 'yellow', 'red', 'indigo', 'cyan', 'pink'];
    const title = (component.title || '').toLowerCase();
    
    // Color by type for consistency
    if (title.includes('database')) return 'purple';
    if (title.includes('frontend')) return 'blue';
    if (title.includes('api') || title.includes('gateway')) return 'orange';
    if (title.includes('cache')) return 'red';
    if (title.includes('monitor')) return 'yellow';
    if (title.includes('security')) return 'green';
    if (title.includes('ai') || title.includes('ml')) return 'cyan';
    
    // Fallback to index-based color
    return colors[index % colors.length];
  }
}

// Main Enhanced AI Generator Component
const EnhancedAIGenerator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState('checking');

  // Initialize AI Architecture Service
  const aiServiceRef = useRef(null);
  
  useEffect(() => {
    aiServiceRef.current = new AIArchitectureService();
  }, []);

  // Form state using your enhanced configurations
  const [formData, setFormData] = useState({
    domain: 'healthcare',
    role: 'architect',
    prompt: 'Design a scalable patient management system with HIPAA compliance, real-time data processing, and integration with existing EMR systems.',
    selectedTech: ['react', 'nodejs', 'postgresql', 'redis', 'kubernetes'],
    businessRequirements: {
      scalability: 'high',
      security: 'maximum',
      compliance: 'required'
    }
  });

  // Check system health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        if (aiServiceRef.current) {
          const health = await aiServiceRef.current.checkHealth();
          setSystemHealth(health.status);
        }
      } catch (error) {
        console.error('Health check failed:', error);
        setSystemHealth('error');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get template text from enhanced templates
  const getTemplateText = useCallback((templateName) => {
    const templateMap = {
      'AI-Powered Healthcare Platform': 'healthcare_ai_platform',
      'Smart Manufacturing Ecosystem': 'smart_manufacturing',
      'Next-Gen E-commerce Platform': 'ecommerce_platform',
      'Aerospace Mission Control': 'aerospace_platform',
      'Secure Financial Services Platform': 'fintech_platform',
      'Autonomous Vehicle System': 'automotive_platform'
    };
    
    const templateId = templateMap[templateName];
    return enhancedTemplates[templateId]?.content || '';
  }, []);

  // Handle tech selection
  const handleTechChange = useCallback((techId, isSelected) => {
    setFormData(prev => ({
      ...prev,
      selectedTech: isSelected 
        ? [...prev.selectedTech, techId]
        : prev.selectedTech.filter(id => id !== techId)
    }));
  }, []);

  // Main architecture generation function
  const generateArchitecture = useCallback(async () => {
    if (!aiServiceRef.current) {
      setError('AI service not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚀 Starting AI architecture generation...');
      console.log(`Selected technologies: ${formData.selectedTech.join(', ')}`);
      console.log(`Domain: ${formData.domain}`);
      
      // Prepare requirements for AI service
      const requirements = {
        domain: formData.domain,
        role: formData.role,
        prompt: formData.prompt,
        techStack: formData.selectedTech,
        businessRequirements: formData.businessRequirements
      };

      // Call the actual AI service (but don't rely solely on it)
      let architectureResult;
      try {
        architectureResult = await aiServiceRef.current.generateArchitecture(requirements);
        console.log('AI Architecture result received');
      } catch (aiError) {
        console.warn('AI service failed, using fallback generation:', aiError);
        architectureResult = { architecture: { architecture: { components: {} } } };
      }

      // Extract components from the AI result or generate from selected technologies
      const aiComponents = architectureResult.architecture?.architecture?.components || {};
      
      // ALWAYS generate components from selected technologies (don't rely only on AI)
      const techComponents = TechnologyComponentGenerator.generateComponentsFromTechStack(
        formData.selectedTech,
        enhancedTechStack,
        enhancedDomains[formData.domain],
        formData.prompt
      );
      
      // Merge AI components with tech-generated components, prioritizing tech components
      const allComponents = { ...aiComponents, ...techComponents };
      
      console.log(`AI provided ${Object.keys(aiComponents).length} components, we generated ${Object.keys(techComponents).length} components`);
      console.log(`Total components: ${Object.keys(allComponents).length}`);
      
      // Calculate optimal grid
      const componentCount = Object.keys(allComponents).length;
      const gridConfig = GridLayoutManager.calculateGrid(componentCount);
      
      // Distribute components with proper shapes and styling
      const distributedComponents = GridLayoutManager.distributeComponents(allComponents, gridConfig);
      
      // Store components map for connection generation
      SmartConnectionGenerator.setComponentsMap(distributedComponents);
      
      // ✅ : Use updated connection generation with validation
      const connections = SmartConnectionGenerator.generateConnections(distributedComponents, formData.prompt);

      // ✅ ENHANCED: Add extra debugging
      console.log(`� FINAL RESULT VERIFICATION:`);
      console.log(`   Components: ${Object.keys(distributedComponents).length}`);
      console.log(`   Connections: ${connections.length}`);
      console.log(`   Grid: ${gridConfig.rows}×${gridConfig.cols}`);
      console.log(`   Connection Types:`, {
        single: connections.filter(c => c.type === 'single').length,
        bidirectional: connections.filter(c => c.type === 'bidirectional').length,
        oneToMany: connections.filter(c => c.type === 'oneToMany').length,
        dataFlow: connections.filter(c => c.type === 'dataFlow').length
      });
      console.log(`   First 5 connections:`, connections.slice(0, 5));
      console.log(`   Component Positions:`, Object.keys(distributedComponents));

      console.log(`✅ Generated architecture with ${componentCount} components and ${connections.length} VALIDATED connections`);

        // Build result with all fixes
        const enhancedResult = {
          title: ` ${enhancedDomains[formData.domain]?.label} Architecture`,
          subtitle: 'AI-Generated with Connection Fix',
          metadata: {
            created: new Date().toISOString(),
            version: '2.2.0',
            author: ' AI Architecture Generator',
            description: formData.prompt,
            bioMetrics: {
              evolutionGeneration: 1,
              genomicComplexity: componentCount,
              ecosystemDiversity: formData.selectedTech.length,
              adaptationScore: architectureResult.confidence_score ? Math.round(architectureResult.confidence_score * 100) : 85
            }
          },
          grid: {
            rows: gridConfig.rows,
            cols: gridConfig.cols,
            cellWidth: 380, // Much larger width for maximum spacing
            cellHeight: 240, // Much larger height for maximum spacing
            gap: 80, // Much larger gaps for maximum breathing room
            ratio: 'dynamic_responsive',
            utilization: ((componentCount / (gridConfig.rows * 3)) * 100).toFixed(1), // Use actual capacity (3 per row)
          layout: `${gridConfig.rows}×${gridConfig.cols} (max 3 per row)`
        },
        components: distributedComponents,
        connections: connections,
        arrow_types: {
          single: { color: '#60a5fa', strokeWidth: 2, dashArray: 'none', label: '→ Single' },        // Light blue
          bidirectional: { color: '#34d399', strokeWidth: 2, dashArray: 'none', label: '↔ Bi-directional' }, // Light green
          oneToMany: { color: '#fbbf24', strokeWidth: 3, dashArray: '5,5', label: '⟲ One to Many' },     // Light yellow
          dataFlow: { color: '#a78bfa', strokeWidth: 2, dashArray: '10,5', label: '⟿ Data Flow' }       // Light purple
        },
        styles: {
          blue: { bg: '#3B82F6', border: '#60A5FA', text: '#FFFFFF', accent: '#1D4ED8' },
          green: { bg: '#10B981', border: '#34D399', text: '#FFFFFF', accent: '#047857' },
          purple: { bg: '#8B5CF6', border: '#A78BFA', text: '#FFFFFF', accent: '#7C3AED' },
          orange: { bg: '#F97316', border: '#FB923C', text: '#FFFFFF', accent: '#EA580C' },
          yellow: { bg: '#F59E0B', border: '#FBBF24', text: '#FFFFFF', accent: '#D97706' },
          red: { bg: '#EF4444', border: '#F87171', text: '#FFFFFF', accent: '#DC2626' },
          indigo: { bg: '#6366F1', border: '#818CF8', text: '#FFFFFF', accent: '#4F46E5' },
          cyan: { bg: '#06B6D4', border: '#22D3EE', text: '#FFFFFF', accent: '#0891B2' }
        },
        genai_models: aiServiceRef.current.getAvailableModels(),
        _internal: {
          domain: enhancedDomains[formData.domain],
          role: enhancedRoles.find(r => r.id === formData.role),
          technologies: formData.selectedTech.map(techId => {
            // Find tech in enhanced tech stack
            for (const category of Object.values(enhancedTechStack)) {
              const tech = category.find(t => t.id === techId);
              if (tech) return tech;
            }
            return { id: techId, label: techId };
          }),
          connectionTypes: {
            total: connections.length,
            byType: {
              single: connections.filter(c => c.type === 'single').length,
              bidirectional: connections.filter(c => c.type === 'bidirectional').length,
              oneToMany: connections.filter(c => c.type === 'oneToMany').length,
              dataFlow: connections.filter(c => c.type === 'dataFlow').length
            },
            uniqueLabels: [...new Set(connections.map(c => c.label))].length,
            componentsConnected: [...new Set([...connections.map(c => c.from), ...connections.map(c => c.to)])].length
          },
          generationMethod: 'ai_enhanced_real',
          aiModel: architectureResult.model_info?.primary_model || 'AI Service'
        }
      };
      
      // 🔧 DEBUG: Log the exact result being set
      console.log('🔍 SETTING RESULT WITH CONNECTIONS:', {
        hasResult: !!enhancedResult,
        hasConnections: !!enhancedResult.connections,
        connectionCount: enhancedResult.connections?.length,
        connectionsArray: enhancedResult.connections,
        componentCount: Object.keys(enhancedResult.components || {}).length,
        gridLayout: `${enhancedResult.grid?.rows}×${enhancedResult.grid?.cols}`,
        utilization: enhancedResult.grid?.utilization
      });

      setResult(enhancedResult);
      console.log('✅ Architecture generated with', componentCount, 'components and', connections.length, 'connections');

    } catch (err) {
      console.error('❌ Generation failed:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  // Export functionality
  const exportArchitecture = useCallback(() => {
    if (!result) return;
    
    const exportData = {
      ...result,
      exportedAt: new Date().toISOString(),
      formData,
      configVersion: '2.1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-architecture-${formData.domain}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, formData]);

  // System status helpers
  const getSystemStatusColor = () => {
    switch (systemHealth) {
      case 'operational': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getSystemStatusIcon = () => {
    switch (systemHealth) {
      case 'operational': return React.createElement(CheckCircle, { size: 16 });
      case 'degraded': return React.createElement(AlertCircle, { size: 16 });
      case 'error': return React.createElement(X, { size: 16 });
      default: return React.createElement(RefreshCw, { size: 16, className: "animate-spin" });
    }
  };

  const componentStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)'
    },
    header: {
      background: 'rgba(30, 41, 59, 0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #334155',
      padding: '24px',
      maxWidth: '1280px',
      margin: '0 auto'
    },
    configPanel: {
      background: 'rgba(30, 41, 59, 0.5)',
      backdropFilter: 'blur(12px)',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px'
    },
    domainGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px'
    },
    domainCard: {
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #475569',
      background: 'rgba(51, 65, 85, 0.5)',
      color: '#cbd5e1',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    domainCardSelected: {
      borderColor: '#06b6d4',
      background: 'rgba(6, 182, 212, 0.1)',
      color: '#06b6d4'
    },
    roleCard: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #475569',
      background: 'rgba(51, 65, 85, 0.5)',
      color: '#cbd5e1',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'left',
      marginBottom: '8px'
    },
    roleCardSelected: {
      borderColor: '#10b981',
      background: 'rgba(16, 185, 129, 0.1)',
      color: '#10b981'
    },
    techGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '8px'
    },
    techCard: {
      padding: '8px',
      borderRadius: '8px',
      border: '1px solid #475569',
      background: 'rgba(51, 65, 85, 0.5)',
      color: '#94a3b8',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '12px'
    },
    techCardSelected: {
      borderColor: '#8b5cf6',
      background: 'rgba(139, 92, 246, 0.1)',
      color: '#8b5cf6'
    },
    generateBtn: {
      width: '100%',
      background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
      color: 'white',
      fontWeight: '600',
      padding: '16px 24px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px'
    },
    generateBtnDisabled: {
      background: 'linear-gradient(135deg, #475569 0%, #475569 100%)',
      cursor: 'not-allowed'
    },
    textarea: {
      width: '100%',
      background: 'rgba(51, 65, 85, 0.5)',
      border: '1px solid #475569',
      borderRadius: '8px',
      padding: '12px 16px',
      color: 'white',
      resize: 'none',
      fontSize: '14px'
    },
    templateBtn: {
      fontSize: '12px',
      padding: '8px 12px',
      background: 'rgba(75, 85, 99, 0.5)',
      color: '#cbd5e1',
      border: '1px solid #6b7280',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    }
  };

  return (
    <div style={componentStyles.container}>
      {/* Enhanced Header */}
      <div style={componentStyles.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={32} className="text-cyan-400" />
              <Network size={24} className="text-blue-400" />
              <Cpu size={20} className="text-purple-400" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                🧬 Enhanced AI Architecture Generator
              </h1>
              <p style={{ color: '#cbd5e1', margin: '4px 0 0 0' }}>
                Real AI-powered system design with dynamic connections
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className={getSystemStatusColor()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getSystemStatusIcon()}
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                {systemHealth === 'checking' ? 'Checking' : 
                 systemHealth === 'operational' ? 'Operational' :
                 systemHealth === 'degraded' ? 'Degraded' : 'Error'}
              </span>
            </div>
            
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>
              AI Models Ready
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Configuration Panel */}
          <div>
            {/* Domain Selection */}
            <div style={componentStyles.configPanel}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={20} className="text-cyan-400" />
                Domain Selection
              </h3>
              <div style={componentStyles.domainGrid}>
                {Object.entries(enhancedDomains).slice(0, 5).map(([key, domain]) => {
                  // Safety check for domain object
                  if (!domain || typeof domain !== 'object') {
                    console.warn(`Invalid domain object for key: ${key}`);
                    return null;
                  }
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setFormData(prev => ({ ...prev, domain: key }))}
                      style={{
                        ...componentStyles.domainCard,
                        ...(formData.domain === key ? componentStyles.domainCardSelected : {})
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{domain.icon || '🏢'}</span>
                        <span style={{ fontWeight: '500' }}>{domain.label || key}</span>
                      </div>
                    </button>
                  );
                }).filter(Boolean)}
              </div>
            </div>

            {/* Role Selection */}
            <div style={componentStyles.configPanel}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} className="text-green-400" />
                Role Selection
              </h3>
              <div>
                {(enhancedRoles || []).slice(0, 3).map(role => {
                  // Safety check for role object
                  if (!role || typeof role !== 'object') {
                    console.warn(`Invalid role object:`, role);
                    return null;
                  }
                  
                  return (
                    <button
                      key={role.id}
                      onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
                      style={{
                        ...componentStyles.roleCard,
                        ...(formData.role === role.id ? componentStyles.roleCardSelected : {})
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>{role.icon || '👤'}</span>
                        <div>
                          <div style={{ fontWeight: '500' }}>{role.label || role.id}</div>
                          <div style={{ fontSize: '14px', opacity: 0.75 }}>{role.focus || 'System architecture'}</div>
                        </div>
                      </div>
                    </button>
                  );
                }).filter(Boolean)}
              </div>
            </div>

            {/* System Requirements */}
            <div style={componentStyles.configPanel}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} className="text-purple-400" />
                System Requirements
              </h3>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="Describe your system requirements in detail..."
                rows={8}
                style={componentStyles.textarea}
              />
              <div style={{ marginTop: '12px', fontSize: '14px', color: '#94a3b8' }}>
                💡 Be specific about functionality, scalability, security, and integration requirements
              </div>
              
              {/* Template Buttons */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>Quick Templates:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    'AI-Powered Healthcare Platform',
                    'Smart Manufacturing Ecosystem',
                    'Next-Gen E-commerce Platform',
                    'Aerospace Mission Control'
                  ].map(template => (
                    <button
                      key={template}
                      onClick={() => {
                        const templateText = getTemplateText(template);
                        setFormData(prev => ({ ...prev, prompt: templateText }));
                      }}
                      style={componentStyles.templateBtn}
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Technology Selection */}
            <div style={componentStyles.configPanel}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={20} className="text-purple-400" />
                Technology Stack ({formData.selectedTech.length})
              </h3>
              
              {Object.entries(enhancedTechStack || {}).slice(0, 3).map(([category, techs]) => (
                <div key={category} style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#cbd5e1', margin: '0 0 8px 0', textTransform: 'capitalize' }}>
                    {category.replace('_', ' ')}
                  </h4>
                  <div style={componentStyles.techGrid}>
                    {(techs || []).slice(0, 6).map(tech => {
                      // Safety check for tech object
                      if (!tech || typeof tech !== 'object') {
                        console.warn(`Invalid tech object:`, tech);
                        return null;
                      }
                      
                      const isSelected = formData.selectedTech.includes(tech.id);
                      return (
                        <button
                          key={tech.id}
                          onClick={() => handleTechChange(tech.id, !isSelected)}
                          style={{
                            ...componentStyles.techCard,
                            ...(isSelected ? componentStyles.techCardSelected : {})
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>{tech.fallbackIcon || '🔧'}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tech.label || tech.id}
                            </span>
                          </div>
                        </button>
                      );
                    }).filter(Boolean)}
                  </div>
                </div>
              ))}
            </div>

            {/* Generate Button */}
            <button
              onClick={generateArchitecture}
              disabled={isLoading || systemHealth === 'error'}
              style={{
                ...componentStyles.generateBtn,
                ...(isLoading || systemHealth === 'error' ? componentStyles.generateBtnDisabled : {})
              }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  <span>🧬 AI is Designing Architecture...</span>
                </>
              ) : (
                <>
                  <Brain size={20} />
                  <span>🚀 Generate AI Architecture</span>
                  <Zap size={20} />
                </>
              )}
            </button>

            {systemHealth === 'error' && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                  <AlertCircle size={16} />
                  <span style={{ fontSize: '14px' }}>AI models may be offline. System will use fallback generation.</span>
                </div>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div style={componentStyles.configPanel}>
            <div style={{ padding: '0 0 16px 0', borderBottom: '1px solid #334155', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Network size={20} className="text-cyan-400" />
                  🧬 AI Architecture Results
                </h3>
                {result && (
                  <button
                    onClick={exportArchitecture}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: '#475569',
                      color: '#cbd5e1',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <ExternalLink size={16} />
                    <span>Export</span>
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <X size={20} className="text-red-400" />
                  <div>
                    <h4 style={{ color: '#f87171', fontWeight: '500', margin: '0 0 4px 0' }}>Generation Error</h4>
                    <p style={{ color: '#fca5a5', fontSize: '14px', margin: 0 }}>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', color: '#22d3ee' }}>
                  <RefreshCw size={32} className="animate-spin" />
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>🧬 AI Architecture Generation</h4>
                    <p style={{ color: '#94a3b8', margin: '0 0 12px 0' }}>Ensuring ALL components have connections...</p>
                    <div style={{ fontSize: '14px' }}>
                      <div style={{ color: '#64748b' }}>• Analyzing requirements with AI</div>
                      <div style={{ color: '#64748b' }}>• Including all selected technologies</div>
                      <div style={{ color: '#64748b' }}>• Generating smart connections for ALL components</div>
                      <div style={{ color: '#64748b' }}>• Running 4-layer connection validation</div>
                      <div style={{ color: '#22d3ee', fontWeight: '500' }}>• Emergency bridging for orphaned components</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div>
                {/* Architecture Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: '0 0 4px 0' }}>{result.title}</h4>
                  <p style={{ color: '#94a3b8', margin: '0 0 16px 0' }}>{result.subtitle}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Database size={16} className="text-blue-400" />
                      <span style={{ color: '#cbd5e1' }}>{Object.keys(result.components || {}).length} Components</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GitBranch size={16} className="text-green-400" />
                      <span style={{ color: '#cbd5e1' }}>{(result.connections || []).length} Connections</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Cpu size={16} className="text-purple-400" />
                      <span style={{ color: '#cbd5e1' }}>{result.grid?.rows}×{result.grid?.cols} Grid</span>
                    </div>
                  </div>
                </div>

                {/* Technology Stack Used */}
                {result._internal?.technologies && result._internal.technologies.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h5 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={16} className="text-yellow-400" />
                      Technology Stack Used ({result._internal.technologies.length})
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                      {result._internal.technologies.map((tech, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '6px',
                            textAlign: 'center'
                          }}
                        >
                          <div style={{ fontSize: '16px', marginBottom: '4px' }}>{tech.fallbackIcon}</div>
                          <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '500' }}>{tech.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DEBUG: Force show connection info */}
                <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255, 255, 0, 0.1)', border: '1px solid rgba(255, 255, 0, 0.3)', borderRadius: '8px' }}>
                  <h5 style={{ color: '#fbbf24', fontWeight: '600', marginBottom: '8px' }}>
                    🐛 COMPREHENSIVE CONNECTION VERIFICATION
                  </h5>
                  <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
                    <div>Result object exists: {result ? '✅ Yes' : '❌ No'}</div>
                    <div>Connections exist: {result?.connections ? '✅ Yes' : '❌ No'}</div>
                    <div>Connections length: <strong>{result?.connections?.length || 'undefined'}</strong></div>
                    <div>Components count: <strong>{Object.keys(result?.components || {}).length}</strong></div>
                    {result?.connections && (
                      <>
                        <div style={{ marginTop: '8px', fontSize: '13px' }}>
                          <div>• Single connections: <strong>{result.connections.filter(c => c.type === 'single').length}</strong></div>
                          <div>• Bidirectional connections: <strong>{result.connections.filter(c => c.type === 'bidirectional').length}</strong></div>
                          <div>• Data flow connections: <strong>{result.connections.filter(c => c.type === 'dataFlow').length}</strong></div>
                          <div>• Emergency connections: <strong>{result.connections.filter(c => c.style === 'emergency').length}</strong></div>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '12px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Sample Connections:</div>
                          {result.connections.slice(0, 5).map((conn, idx) => (
                            <div key={idx}>{conn.from} → {conn.to}: {conn.label}</div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* FORCED CONNECTIONS DISPLAY - Always show if result exists */}
                {result && (
                  <div style={{ marginBottom: '24px' }}>
                    <h5 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GitBranch size={18} className="text-green-400" />
                      🔗  CONNECTIONS ({result.connections?.length || 0}) - All Connectors
                    </h5>
                    
                    {/* FORCE Show connection count even if 0 */}
                    <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '14px', color: '#34d399', fontWeight: '600', marginBottom: '8px' }}>
                        📊 Connection Status: {result.connections?.length > 0 ? `✅ ${result.connections.length} connections found!` : '❌ No connections - Debug needed'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        <div>Total: <strong>{result.connections?.length || 0}</strong></div>
                        <div>Components: <strong>{Object.keys(result.components || {}).length}</strong></div>
                        <div>Expected Min: <strong>{Object.keys(result.components || {}).length * 2}</strong></div>
                        <div>Status: <strong>{result.connections?.length >= Object.keys(result.components || {}).length ? '✅ Good' : '❌ Low'}</strong></div>
                      </div>
                    </div>
                    
                    {/* Connection Type Summary with ALL TYPES */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        <div style={{ color: '#60a5fa', fontSize: '12px', fontWeight: '500' }}>→ Single</div>
                        <div style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 'bold' }}>{result.connections?.filter(c => c.type === 'single').length || 0}</div>
                      </div>
                      <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <div style={{ color: '#34d399', fontSize: '12px', fontWeight: '500' }}>↔ Bidirectional</div>
                        <div style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 'bold' }}>{result.connections?.filter(c => c.type === 'bidirectional').length || 0}</div>
                      </div>
                      <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        <div style={{ color: '#fbbf24', fontSize: '12px', fontWeight: '500' }}>⟲ One-to-Many</div>
                        <div style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 'bold' }}>{result.connections?.filter(c => c.type === 'oneToMany').length || 0}</div>
                      </div>
                      <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                        <div style={{ color: '#a78bfa', fontSize: '12px', fontWeight: '500' }}>⟿ Data Flow</div>
                        <div style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 'bold' }}>{result.connections?.filter(c => c.type === 'dataFlow').length || 0}</div>
                      </div>
                    </div>
                    
                    {/* FORCE DISPLAY ALL CONNECTIONS - Even if conditional fails */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                        📋 Connection Details ({result.connections?.length || 0} total):
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '8px', maxHeight: '250px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                        {result.connections && result.connections.length > 0 ? 
                          result.connections.map((connection, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 10px',
                                background: 'rgba(51, 65, 85, 0.4)',
                                borderRadius: '6px',
                                border: '1px solid #475569',
                                fontSize: '11px',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div style={{ 
                                minWidth: '24px', 
                                height: '18px', 
                                background: 'linear-gradient(135deg, #475569, #64748b)', 
                                borderRadius: '3px', 
                                fontSize: '9px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: '#cbd5e1',
                                fontWeight: 'bold'
                              }}>
                                {connection.from}
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
                                {connection.type === 'single' && <span style={{ color: '#60a5fa', fontSize: '12px' }}>→</span>}
                                {connection.type === 'bidirectional' && <span style={{ color: '#34d399', fontSize: '12px' }}>↔</span>}
                                {connection.type === 'oneToMany' && <span style={{ color: '#fbbf24', fontSize: '12px' }}>⟲</span>}
                                {connection.type === 'dataFlow' && <span style={{ color: '#a78bfa', fontSize: '12px' }}>⟿</span>}
                                
                                <span style={{ 
                                  color: '#e2e8f0', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  fontWeight: '500',
                                  fontSize: '10px'
                                }}>
                                  {connection.label}
                                </span>
                              </div>
                              
                              <div style={{ 
                                minWidth: '24px', 
                                height: '18px', 
                                background: 'linear-gradient(135deg, #475569, #64748b)', 
                                borderRadius: '3px', 
                                fontSize: '9px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: '#cbd5e1',
                                fontWeight: 'bold'
                              }}>
                                {connection.to}
                              </div>
                            </div>
                          )) 
                          : 
                          <div style={{ 
                            padding: '16px', 
                            textAlign: 'center', 
                            color: '#fca5a5', 
                            fontSize: '14px' 
                          }}>
                            ❌ No connections found - Check connection generation logic
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                )}

                {/* ===================================================================
                    FIX 5: React Component - Connection Rendering Debug Panel
                    =================================================================== */}
                {result && (() => {
                  const ConnectionDebugPanel = ({ connections, components }) => {
                    const [showDetails, setShowDetails] = React.useState(false);
                    
                    if (!connections || !Array.isArray(connections)) {
                      return (
                        <div style={{ 
                          padding: '16px', 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          border: '1px solid rgba(239, 68, 68, 0.3)', 
                          borderRadius: '8px',
                          margin: '16px 0'
                        }}>
                          <h4 style={{ color: '#f87171', margin: '0 0 8px 0' }}>🚨 CONNECTION RENDERING ERROR</h4>
                          <p style={{ color: '#fca5a5', margin: 0 }}>
                            Connections is {connections === null ? 'null' : connections === undefined ? 'undefined' : typeof connections}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div style={{ 
                        padding: '16px', 
                        background: 'rgba(34, 211, 238, 0.1)', 
                        border: '1px solid rgba(34, 211, 238, 0.3)', 
                        borderRadius: '8px',
                        margin: '16px 0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <h4 style={{ color: '#22d3ee', margin: 0 }}>
                            🔗 CONNECTION RENDER DEBUG ({connections.length})
                          </h4>
                          <button 
                            onClick={() => setShowDetails(!showDetails)}
                            style={{
                              padding: '4px 8px',
                              background: 'rgba(34, 211, 238, 0.2)',
                              border: '1px solid rgba(34, 211, 238, 0.5)',
                              borderRadius: '4px',
                              color: '#22d3ee',
                              cursor: 'pointer'
                            }}
                          >
                            {showDetails ? 'Hide' : 'Show'} Details
                          </button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                          <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px' }}>
                            <div style={{ color: '#60a5fa', fontSize: '12px' }}>Single</div>
                            <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>
                              {connections.filter(c => c.type === 'single').length}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px' }}>
                            <div style={{ color: '#34d399', fontSize: '12px' }}>Bidirectional</div>
                            <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>
                              {connections.filter(c => c.type === 'bidirectional').length}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '4px' }}>
                            <div style={{ color: '#fbbf24', fontSize: '12px' }}>OneToMany</div>
                            <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>
                              {connections.filter(c => c.type === 'oneToMany').length}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '4px' }}>
                            <div style={{ color: '#a78bfa', fontSize: '12px' }}>DataFlow</div>
                            <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>
                              {connections.filter(c => c.type === 'dataFlow').length}
                            </div>
                          </div>
                        </div>

                        {showDetails && (
                          <div style={{ 
                            maxHeight: '200px', 
                            overflowY: 'auto', 
                            background: 'rgba(0,0,0,0.3)', 
                            padding: '8px', 
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '12px'
                          }}>
                            {connections.slice(0, 10).map((conn, idx) => (
                              <div key={idx} style={{ color: '#cbd5e1', marginBottom: '2px' }}>
                                {conn.from} → {conn.to}: {conn.label} ({conn.type})
                              </div>
                            ))}
                            {connections.length > 10 && (
                              <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                ... and {connections.length - 10} more connections
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                          ✅ Connections array exists and contains {connections.length} items
                          <br />
                          📊 Components: {Object.keys(components || {}).length}
                          <br />
                          🔄 Render timestamp: {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  };

                  return <ConnectionDebugPanel connections={result.connections} components={result.components} />;
                })()}

                {/* ===================================================================
                    FIX 2: SIMPLIFIED CONNECTION DISPLAY - NO COMPLEX CONDITIONALS
                    =================================================================== */}
                {result && (() => {
                  const ConnectionDisplayFix = ({ result }) => {
                    // 🔧 CRITICAL: Always show connections, no complex conditionals
                    const connections = result?.connections || [];
                    const components = result?.components || {};
                    
                    console.log('🔍 CONNECTION DISPLAY DEBUG:', {
                      connectionsExist: !!connections,
                      connectionsLength: connections.length,
                      connectionsType: typeof connections,
                      isArray: Array.isArray(connections)
                    });

                    return (
                      <div style={{ marginBottom: '24px' }}>
                        <h5 style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          color: 'white', 
                          margin: '0 0 12px 0',
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px' 
                        }}>
                          🔗 CONNECTIONS ({connections.length}) - ALWAYS DISPLAY
                        </h5>
                        
                        {/* 🔧 FORCE DISPLAY - Remove all conditionals */}
                        <div style={{ 
                          padding: '16px', 
                          background: 'rgba(34, 211, 238, 0.1)', 
                          border: '1px solid rgba(34, 211, 238, 0.3)', 
                          borderRadius: '8px' 
                        }}>
                          <div style={{ fontSize: '14px', color: '#22d3ee', marginBottom: '12px' }}>
                            📊 Connection Status: {connections.length > 0 ? `✅ ${connections.length} connections` : '❌ No connections'}
                          </div>
                          
                          {/* Connection Type Breakdown - ALWAYS SHOW */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                            <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '4px', textAlign: 'center' }}>
                              <div style={{ color: '#60a5fa', fontSize: '12px' }}>Single</div>
                              <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>
                                {connections.filter(c => c.type === 'single').length}
                              </div>
                            </div>
                            <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '4px', textAlign: 'center' }}>
                              <div style={{ color: '#34d399', fontSize: '12px' }}>Bidirectional</div>
                              <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>
                                {connections.filter(c => c.type === 'bidirectional').length}
                              </div>
                            </div>
                            <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '4px', textAlign: 'center' }}>
                              <div style={{ color: '#fbbf24', fontSize: '12px' }}>OneToMany</div>
                              <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>
                                {connections.filter(c => c.type === 'oneToMany').length}
                              </div>
                            </div>
                            <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '4px', textAlign: 'center' }}>
                              <div style={{ color: '#a78bfa', fontSize: '12px' }}>DataFlow</div>
                              <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>
                                {connections.filter(c => c.type === 'dataFlow').length}
                              </div>
                            </div>
                          </div>
                          
                          {/* Connection List - ALWAYS SHOW, NO CONDITIONALS */}
                          <div style={{ 
                            maxHeight: '200px', 
                            overflowY: 'auto', 
                            background: 'rgba(0,0,0,0.3)', 
                            padding: '8px', 
                            borderRadius: '4px' 
                          }}>
                            <div style={{ color: '#22d3ee', fontWeight: 'bold', marginBottom: '8px' }}>
                              All {connections.length} Connections:
                            </div>
                            {connections.length > 0 ? 
                              connections.map((conn, idx) => (
                                <div key={idx} style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px', 
                                  marginBottom: '4px',
                                  fontSize: '12px',
                                  color: '#cbd5e1'
                                }}>
                                  <span style={{ 
                                    minWidth: '20px', 
                                    textAlign: 'center', 
                                    background: '#475569', 
                                    borderRadius: '3px', 
                                    padding: '2px 4px' 
                                  }}>
                                    {conn.from}
                                  </span>
                                  <span style={{ color: '#60a5fa' }}>
                                    {conn.type === 'single' ? '→' : 
                                     conn.type === 'bidirectional' ? '↔' :
                                     conn.type === 'oneToMany' ? '⟲' : '⟿'}
                                  </span>
                                  <span style={{ 
                                    minWidth: '20px', 
                                    textAlign: 'center', 
                                    background: '#475569', 
                                    borderRadius: '3px', 
                                    padding: '2px 4px' 
                                  }}>
                                    {conn.to}
                                  </span>
                                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {conn.label}
                                  </span>
                                </div>
                              )) 
                              : 
                              <div style={{ color: '#fca5a5', textAlign: 'center', padding: '16px' }}>
                                No connections found - check generation logic
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    );
                  };

                  return <ConnectionDisplayFix result={result} />;
                })()}

                {/* FALLBACK: Always show connection section if result exists */}
                {result && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.3)', borderRadius: '8px' }}>
                    <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#22d3ee', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GitBranch size={18} />
                      🔗 CONNECTION COVERAGE ANALYSIS ({result.connections?.length || 0})
                    </h5>
                    {result.connections && result.connections.length > 0 ? (
                      <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                          <div>✅ Total Connections: <strong>{result.connections.length}</strong></div>
                          <div>📊 Total Components: <strong>{Object.keys(result.components || {}).length}</strong></div>
                          <div>🎯 Coverage Ratio: <strong>{(result.connections.length / Object.keys(result.components || {}).length * 100).toFixed(1)}%</strong></div>
                          <div>🔗 Avg Connections/Component: <strong>{(result.connections.length / Object.keys(result.components || {}).length).toFixed(1)}</strong></div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px', fontSize: '12px' }}>
                          <div style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '4px', textAlign: 'center' }}>
                            <div style={{ color: '#60a5fa' }}>Single →</div>
                            <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>{result.connections.filter(c => c.type === 'single').length}</div>
                          </div>
                          <div style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '4px', textAlign: 'center' }}>
                            <div style={{ color: '#34d399' }}>Bidirectional ↔</div>
                            <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>{result.connections.filter(c => c.type === 'bidirectional').length}</div>
                          </div>
                          <div style={{ padding: '6px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '4px', textAlign: 'center' }}>
                            <div style={{ color: '#fbbf24' }}>One-to-Many ⟲</div>
                            <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>{result.connections.filter(c => c.type === 'oneToMany').length}</div>
                          </div>
                          <div style={{ padding: '6px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '4px', textAlign: 'center' }}>
                            <div style={{ color: '#a78bfa' }}>Data Flow ⟿</div>
                            <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>{result.connections.filter(c => c.type === 'dataFlow').length}</div>
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '12px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Recent Connections:</div>
                          {result.connections.slice(0, 4).map((conn, idx) => (
                            <div key={idx} style={{ fontSize: '11px' }}>{conn.from} → {conn.to}: {conn.label}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '14px', color: '#fca5a5' }}>
                        ❌ No connections found. Check connection generation logic.
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                          Components available: {Object.keys(result.components || {}).length}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div style={{ marginBottom: '24px' }}>
                  <h5 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={18} className="text-purple-400" />
                    Architecture Components ({Object.keys(result.components || {}).length})
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'normal' }}>
                      (Max 3 per row)
                    </span>
                  </h5>
                  
                  {/* Component Grid with 4 columns but max 3 components per row */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '20px',
                    maxWidth: '100%'
                  }}>
                    {Object.entries(result.components || {}).map(([position, component]) => (
                      <div
                        key={position}
                        style={{
                          padding: '20px',
                          background: 'rgba(51, 65, 85, 0.4)',
                          borderRadius: '12px',
                          border: '1px solid #475569',
                          minHeight: '220px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ 
                                width: '32px', 
                                height: '32px', 
                                background: '#475569', 
                                borderRadius: '6px', 
                                fontSize: '14px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: '#cbd5e1',
                                fontWeight: 'bold'
                              }}>
                                {position}
                              </div>
                              <div style={{ fontSize: '24px' }}>
                                {component.icon === 'database' && '🗄️'}
                                {component.icon === 'globe' && '🌐'}
                                {component.icon === 'server' && '🖥️'}
                                {component.icon === 'zap' && '⚡'}
                                {component.icon === 'activity' && '📊'}
                                {component.icon === 'shield' && '🛡️'}
                                {component.icon === 'brain' && '🧠'}
                                {component.icon === 'cpu' && '⚙️'}
                                {component.icon === 'cloud' && '☁️'}
                                {component.icon === 'settings' && '⚙️'}
                                {component.icon === 'network' && '🔗'}
                                {!component.icon && '🔧'}
                              </div>
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              padding: '4px 12px', 
                              background: `${result.styles?.[component.color]?.bg || '#475569'}20`, 
                              border: `1px solid ${result.styles?.[component.color]?.border || '#475569'}50`,
                              borderRadius: '6px', 
                              color: result.styles?.[component.color]?.border || '#cbd5e1'
                            }}>
                              {component.shape}
                            </div>
                          </div>
                          
                          <h6 style={{ 
                            fontWeight: '600', 
                            color: 'white', 
                            fontSize: '16px', 
                            margin: '0 0 8px 0',
                            lineHeight: '1.4',
                            minHeight: '40px'
                          }}>
                            {component.title}
                          </h6>
                          
                          <p style={{ 
                            color: '#94a3b8', 
                            fontSize: '14px', 
                            margin: '0 0 16px 0',
                            lineHeight: '1.5',
                            minHeight: '42px'
                          }}>
                            {component.description}
                          </p>
                        </div>
                        
                        <div>
                          {component.details && component.details.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                              {component.details.map((detail, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: '12px',
                                    padding: '4px 10px',
                                    background: 'rgba(75, 85, 99, 0.6)',
                                    color: '#cbd5e1',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(75, 85, 99, 0.8)'
                                  }}
                                >
                                  {detail}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Component metrics */}
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#64748b',
                            display: 'flex',
                            justifyContent: 'space-between',
                            paddingTop: '8px',
                            borderTop: '1px solid #374151'
                          }}>
                            <span>Size: {component.width}×{component.height}</span>
                            <span>Type: {component.color}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Grid Layout Info */}
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    background: 'rgba(75, 85, 99, 0.3)', 
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#94a3b8'
                  }}>
                    📐 Layout: {result.grid?.rows} rows × 4 columns | 
                    📊 Utilization: {result.grid?.utilization}% | 
                    📏 Cell Size: {result.grid?.cellWidth}×{result.grid?.cellHeight}px
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={generateArchitecture}
                    style={{
                      flex: 1,
                      background: '#475569',
                      color: 'white',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <RefreshCw size={16} />
                    <span>Re-generate</span>
                  </button>
                  
                  <button
                    onClick={exportArchitecture}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                      color: 'white',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <ExternalLink size={16} />
                    <span>Export Full</span>
                  </button>
                </div>
              </div>
            )}

            {!result && !isLoading && !error && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                <Brain size={48} style={{ margin: '0 auto 16px auto', color: '#64748b' }} />
                <h4 style={{ fontSize: '18px', fontWeight: '500', color: '#cbd5e1', margin: '0 0 8px 0' }}>🧬 Ready to Design</h4>
                <p style={{ margin: '0 0 16px 0' }}>Configure your requirements and generate an AI-powered architecture</p>
                <div style={{ fontSize: '14px' }}>
                  <div>• Real AI models will analyze your requirements</div>
                  <div>• All selected technologies will be included</div>
                  <div>• Smart component placement and connections</div>
                  <div>• Production-ready architecture patterns</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAIGenerator;

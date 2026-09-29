import {
  Database, Shield, FileText, Brain, Server, Zap, Globe,
  Code, Cloud, Lock, Monitor, Cpu, HardDrive,
  Network, Settings, Activity
} from 'lucide-react';

export const iconMap = {
  database: Database,
  shield: Shield,
  'file-text': FileText,
  brain: Brain,
  server: Server,
  zap: Zap,
  globe: Globe,
  code: Code,
  cloud: Cloud,
  lock: Lock,
  monitor: Monitor,
  cpu: Cpu,
  'hard-drive': HardDrive,
  network: Network,
  settings: Settings,
  activity: Activity
};

export const availableIcons = Object.keys(iconMap);

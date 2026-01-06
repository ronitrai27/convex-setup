// src/lib/types.ts

import { Node, Edge } from '@xyflow/react';

// ============================================
// ER MODEL TYPES
// ============================================

export interface ERModel {
  entities: Entity[];
  timestamp?: string;
}

export interface Entity {
  name: string;
  description?: string;
  fields: Field[];
  relations: Relation[];
}

export interface Field {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
  foreignTable?: string;
}

export interface Relation {
  from: string;
  to: string;
  type: '1-1' | '1-M' | 'M-1' | 'M-M';
  fromField?: string;
  toField?: string;
}

// ============================================
// REACT FLOW TYPES
// ============================================

export interface EntityNodeData {
  label: string;
  fields: Field[];
  relations: Relation[];
  isHighlighted?: boolean;
  isDimmed?: boolean;
  [key: string]: any;
}

export type EntityNode = Node<EntityNodeData, 'entity'>;
export type EntityEdge = Edge;

// ============================================
// PINECONE TYPES
// ============================================

export interface PineconeMetadata {
  sessionId: string;
  tableName: string;
  fields: string;
  relations: string;
  description: string;
  [key: string]: any;
}

export interface SearchResult {
  tableName: string;
  score: number;
  fields: Field[];
  relations: Relation[];
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface UploadRequest {
  schemaContent: string;
}

export interface UploadResponse {
  success: boolean;
  sessionId?: string;
  ermodel?: ERModel;
  nodes?: EntityNode[];
  edges?: EntityEdge[];
  error?: string;
}

export interface ChatRequest {
  messages: Message[];
  sessionId: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ExportRequest {
  nodes: EntityNode[];
  edges: EntityEdge[];
}

// ============================================
// SCHEMA DETECTION TYPES
// ============================================

export type SchemaFormat = 
  | 'sql'
  | 'prisma'
  | 'typescript'
  | 'convex'
  | 'mongoose'
  | 'graphql'
  | 'unknown';

export interface DetectionResult {
  format: SchemaFormat;
  confidence: 'high' | 'medium' | 'low';
  prompt: string;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface AppState {
  sessionId: string | null;
  schema: ERModel | null;
  nodes: EntityNode[];
  edges: EntityEdge[];
  selectedTables: Set<string>;
  expandedTables: Set<string>;
  isUploading: boolean;
  uploadError: string | null;
}
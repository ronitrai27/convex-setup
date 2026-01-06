"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { EntityNode as EntityNodeType } from "@/types/ERmodel";

//Custom React Flow node for displaying database tables
function EntityNodeComponent({ data, selected }: NodeProps<EntityNodeType>) {
  const { label, fields, isHighlighted, isDimmed } = data;

  return (
    <div
      className={cn(
        "min-w-[240px] bg-card rounded-lg overflow-hidden transition-all duration-200 border-2",
        selected && "ring-2 ring-primary shadow-xl border-primary",
        isHighlighted && "ring-2 ring-blue-500 shadow-xl",
        isDimmed && "opacity-40",
        !selected && !isHighlighted && "border-border"
      )}
    >
      {/* Table Name Header */}
      <div className="bg-[#1E40AF] px-4 py-3 text-center border-b-2 border-[#1a3a9e]">
        <h3 className="font-bold text-base tracking-tight text-white uppercase">
          {label}
        </h3>
      </div>

      {/* Fields Table */}
      <div className="bg-background">
        {fields && fields.length > 0 ? (
          <table className="w-full border-collapse">
            <tbody>
              {fields.map((field, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    "border-b border-border last:border-0",
                    "hover:bg-muted/50 transition-colors"
                  )}
                >
                  {/* Type Column */}
                  <td className="px-3 py-2 text-xs font-mono text-muted-foreground border-r border-border w-[30%]">
                    {field.type}
                  </td>

                  {/* Field Name Column */}
                  <td className={cn(
                    "px-3 py-2 text-sm font-medium text-foreground border-r border-border",
                    (field.isPrimary || field.isForeign) && "font-bold"
                  )}>
                    {field.name}
                  </td>

                  {/* Constraints Column */}
                  <td className="px-3 py-2 text-center w-[20%]">
                    <div className="flex items-center justify-center gap-1">
                      {field.isPrimary && (
                        <span 
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30" 
                          title="Primary Key"
                        >
                          PK
                        </span>
                      )}
                      {field.isForeign && (
                        <span 
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30" 
                          title="Foreign Key"
                        >
                          FK
                        </span>
                      )}
                      {field.isUnique && !field.isPrimary && (
                        <span 
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30" 
                          title="Unique"
                        >
                          U
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center text-muted-foreground text-xs py-6 italic">
            No fields defined
          </div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-primary border-2 border-background rounded-full"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-primary border-2 border-background rounded-full"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary border-2 border-background rounded-full"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-background rounded-full"
      />
    </div>
  );
}

// Memoized export for performance
export default memo(EntityNodeComponent);
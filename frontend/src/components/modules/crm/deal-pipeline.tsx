'use client';

import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableDealItem, Deal } from './sortable-deal-item';

interface StageColumn {
  id: string;
  title: string;
  dealIds: string[];
}

interface DealPipelineProps {
  deals: Deal[];
  onDealMove?: (result: { dealId: string; newStage: string; newIndex: number }) => void;
}

export function DealPipeline({ deals = [], onDealMove }: DealPipelineProps) {
  const initialStages: StageColumn[] = [
    { id: 'lead', title: 'Lead', dealIds: [] },
    { id: 'qualified', title: 'Qualified', dealIds: [] },
    { id: 'proposal', title: 'Proposal', dealIds: [] },
    { id: 'negotiation', title: 'Negotiation', dealIds: [] },
    { id: 'closed-won', title: 'Closed Won', dealIds: [] },
    { id: 'closed-lost', title: 'Closed Lost', dealIds: [] },
  ];

  // Organize deals by stage
  const [stages, setStages] = React.useState<StageColumn[]>(() => {
    const organized = [...initialStages];
    
    deals.forEach(deal => {
      const stageIndex = organized.findIndex(stage => stage.id === deal.stage);
      if (stageIndex !== -1) {
        organized[stageIndex].dealIds.push(deal.id);
      }
    });
    
    return organized;
  });

  // Find deal by ID
  const getDealById = (id: string): Deal | undefined => deals.find(deal => deal.id === id);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const activeStage = stages.find(stage => stage.dealIds.includes(active.id as string));
      const overStage = stages.find(stage => stage.dealIds.includes(over?.id as string));
      
      if (activeStage && overStage && activeStage.id === overStage.id) {
        // Same column reordering
        setStages(prevStages => {
          const stageIndex = prevStages.findIndex(s => s.id === activeStage.id);
          const newStages = [...prevStages];
          
          const oldIndex = activeStage.dealIds.indexOf(active.id as string);
          const newIndex = activeStage.dealIds.indexOf(over.id as string);
          
          newStages[stageIndex] = {
            ...activeStage,
            dealIds: arrayMove(activeStage.dealIds, oldIndex, newIndex)
          };
          
          return newStages;
        });
        
        if (onDealMove) {
          onDealMove({
            dealId: active.id as string,
            newStage: activeStage.id,
            newIndex: activeStage.dealIds.indexOf(over.id as string)
          });
        }
      }
    }
  };

  return (
    <div className="overflow-x-auto pb-2" role="region" aria-label="Deal Pipeline">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-4 min-w-max">
          {stages.map(stage => (
            <div key={stage.id} className="w-72 flex-shrink-0">
              <div className="mb-3">
                <h3 className="font-medium text-sm">{stage.title}</h3>
                <div className="text-xs text-gray-500 mt-1">
                  {stage.dealIds.length} deals · $
                  {stage.dealIds.reduce((sum, dealId) => {
                    const deal = getDealById(dealId);
                    return sum + (deal?.value || 0);
                  }, 0).toLocaleString()}
                </div>
              </div>
              
              <div className="min-h-[500px] rounded-md p-2 bg-gray-50 dark:bg-gray-800/50">
                <SortableContext 
                  items={stage.dealIds}
                  strategy={verticalListSortingStrategy}
                >
                  {stage.dealIds.map(dealId => {
                    const deal = getDealById(dealId);
                    if (!deal) return null;
                    
                    return (
                      <SortableDealItem 
                        key={dealId} 
                        id={dealId} 
                        deal={deal} 
                      />
                    );
                  })}
                </SortableContext>
              </div>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
}

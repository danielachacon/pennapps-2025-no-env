"use client";

import React, { useCallback } from "react";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";
import { Workflow } from "@/types/workflow";
import { ErrorProvider, useError } from "@/components/ui/ErrorProvider";

const API_BASE_URL = "http://localhost:8000";

function HomeContent() {
  const { addError, addSuccess } = useError();

  const handleWorkflowSave = useCallback(async (workflow: Workflow) => {
    try {
      // TODO: Save to backend
      const response = await fetch(`${API_BASE_URL}/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      });

      if (response.ok) {
        addSuccess(`Workflow "${workflow.name}" saved successfully!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Failed to save workflow (${response.status})`;
        addError('save', errorMessage);
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      addError('connection', 'Unable to connect to server. Please check if the backend is running.');
    }
  }, [addError, addSuccess]);

  const handleWorkflowExecute = useCallback(async (workflow: Workflow) => {
    try {
      // Validate workflow before execution
      if (!workflow.nodes || workflow.nodes.length === 0) {
        addError('validation', 'Cannot execute empty workflow');
        return;
      }

      const startNodes = workflow.nodes.filter(node => node.type === 'start');
      if (startNodes.length === 0) {
        addError('validation', 'Workflow must have a start node');
        return;
      }

      // TODO: Execute workflow via backend
      const response = await fetch(`${API_BASE_URL}/workflows/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: workflow.id,
          workflow_data: workflow,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        addSuccess(`Workflow "${workflow.name}" executed successfully!`);
        console.log('Workflow executed successfully:', result);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Workflow execution failed (${response.status})`;
        addError('execute', errorMessage);
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        addError('connection', 'Unable to connect to server. Please check if the backend is running.');
      } else {
        addError('execute', `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // For demo purposes, simulate execution
      console.log('Simulating workflow execution for:', workflow.name);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }, [addError, addSuccess]);

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-50">
      <WorkflowBuilder
        initialWorkflow={undefined}
        onWorkflowSave={handleWorkflowSave}
        onWorkflowExecute={handleWorkflowExecute}
        className="h-full"
      />
    </div>
  );
}

export default function Home() {
  return (
    <ErrorProvider>
      <HomeContent />
    </ErrorProvider>
  );
}
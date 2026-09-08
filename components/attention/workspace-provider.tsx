"use client";

import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import { createWorkspaceState, workspaceReducer, type WorkspaceAction, type WorkspaceState } from "@/lib/attention/workspace";

type WorkspaceContextValue = { state: WorkspaceState; dispatch: Dispatch<WorkspaceAction> };
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // 初始化只用記憶體；唔讀 localStorage，亦冇自動儲存 effect。
  const [state, dispatch] = useReducer(workspaceReducer, undefined, createWorkspaceState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("Attention Lab must be inside WorkspaceProvider.");
  return value;
}

"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type { Islander, BonusQuestion } from "@/types/database";

// ─── Types ───

export interface CoupleSlot {
  islander_1_id: number;
  islander_2_id: number;
}

type Step = "couples" | "dumpings" | "bonus" | "review";

interface BracketState {
  step: Step;
  islanders: Islander[];
  couples: CoupleSlot[];
  singleIds: number[];
  selectedId: number | null;
  dumpedIds: number[];
  bonusQuestions: BonusQuestion[];
  bonusAnswers: Record<number, boolean>;
  weekId: number;
  deadline: string;
  isLocked: boolean;
  isSubmitted: boolean;
  isSubmitting: boolean;
}

type BracketAction =
  | { type: "SET_STEP"; step: Step }
  | { type: "SELECT_ISLANDER"; id: number }
  | { type: "UNPAIR_COUPLE"; index: number }
  | { type: "TOGGLE_SINGLE"; id: number }
  | { type: "TOGGLE_DUMPED"; id: number }
  | { type: "SET_BONUS_ANSWER"; questionId: number; answer: boolean }
  | { type: "SET_SUBMITTING"; value: boolean }
  | { type: "SET_SUBMITTED" };

// ─── Helpers ───

function getPairedIds(couples: CoupleSlot[]): Set<number> {
  const ids = new Set<number>();
  for (const c of couples) {
    ids.add(c.islander_1_id);
    ids.add(c.islander_2_id);
  }
  return ids;
}

// ─── Reducer ───

function bracketReducer(state: BracketState, action: BracketAction): BracketState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };

    case "SELECT_ISLANDER": {
      const id = action.id;
      const pairedIds = getPairedIds(state.couples);

      // If already paired, do nothing (user must unpair first)
      if (pairedIds.has(id)) return state;

      // If in singles, remove from singles when selecting
      const newSingles = state.singleIds.filter((s) => s !== id);

      if (state.selectedId === null) {
        // First selection
        return { ...state, selectedId: id, singleIds: newSingles };
      }

      if (state.selectedId === id) {
        // Deselect
        return { ...state, selectedId: null };
      }

      // Pair them
      const newCouple: CoupleSlot = {
        islander_1_id: state.selectedId,
        islander_2_id: id,
      };
      return {
        ...state,
        couples: [...state.couples, newCouple],
        selectedId: null,
        singleIds: newSingles.filter((s) => s !== state.selectedId),
      };
    }

    case "UNPAIR_COUPLE":
      return {
        ...state,
        couples: state.couples.filter((_, i) => i !== action.index),
      };

    case "TOGGLE_SINGLE": {
      const id = action.id;
      if (state.singleIds.includes(id)) {
        return { ...state, singleIds: state.singleIds.filter((s) => s !== id) };
      }
      return {
        ...state,
        singleIds: [...state.singleIds, id],
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    }

    case "TOGGLE_DUMPED": {
      const id = action.id;
      if (state.dumpedIds.includes(id)) {
        return { ...state, dumpedIds: state.dumpedIds.filter((d) => d !== id) };
      }
      if (state.dumpedIds.length >= 3) return state;
      return { ...state, dumpedIds: [...state.dumpedIds, id] };
    }

    case "SET_BONUS_ANSWER":
      return {
        ...state,
        bonusAnswers: {
          ...state.bonusAnswers,
          [action.questionId]: action.answer,
        },
      };

    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.value };

    case "SET_SUBMITTED":
      return { ...state, isSubmitted: true, isSubmitting: false };

    default:
      return state;
  }
}

// ─── Context ───

interface BracketContextValue {
  state: BracketState;
  dispatch: React.Dispatch<BracketAction>;
  unpairedIslanders: Islander[];
  pairedCount: number;
  totalCount: number;
  allAssigned: boolean;
}

const BracketContext = createContext<BracketContextValue | null>(null);

export function useBracket() {
  const ctx = useContext(BracketContext);
  if (!ctx) throw new Error("useBracket must be used within BracketProvider");
  return ctx;
}

export function BracketProvider({
  children,
  islanders,
  weekId,
  deadline,
  isLocked,
  bonusQuestions,
  initialCouples,
  initialDumpedIds,
  initialBonusAnswers,
  isSubmitted,
}: {
  children: ReactNode;
  islanders: Islander[];
  weekId: number;
  deadline: string;
  isLocked: boolean;
  bonusQuestions: BonusQuestion[];
  initialCouples?: CoupleSlot[];
  initialDumpedIds?: number[];
  initialBonusAnswers?: Record<number, boolean>;
  isSubmitted?: boolean;
}) {
  const [state, dispatch] = useReducer(bracketReducer, {
    step: "couples",
    islanders,
    couples: initialCouples || [],
    singleIds: [],
    selectedId: null,
    dumpedIds: initialDumpedIds || [],
    bonusQuestions,
    bonusAnswers: initialBonusAnswers || {},
    weekId,
    deadline,
    isLocked,
    isSubmitted: isSubmitted || false,
    isSubmitting: false,
  });

  const pairedIds = getPairedIds(state.couples);

  const unpairedIslanders = islanders.filter(
    (i) => !pairedIds.has(i.id) && !state.singleIds.includes(i.id)
  );

  const assignedCount =
    state.couples.length * 2 + state.singleIds.length;
  const totalCount = islanders.length;
  const allAssigned = assignedCount === totalCount;

  const value: BracketContextValue = {
    state,
    dispatch,
    unpairedIslanders,
    pairedCount: assignedCount,
    totalCount,
    allAssigned,
  };

  return (
    <BracketContext.Provider value={value}>{children}</BracketContext.Provider>
  );
}

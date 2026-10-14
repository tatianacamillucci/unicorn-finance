"use client";

import { StepList, type Step } from "@/components/ui/step-list";
import { segnaIncassoSpostato } from "@/app/actions/incassi";

/** Wrapper client: solo l'ultimo passo ("Fatto") scrive sul database. */
export function IncassoSteps({ incassoId, steps }: { incassoId: string; steps: Step[] }) {
  return (
    <StepList
      steps={steps}
      onDone={async (id) => {
        if (id !== "fine") return;
        return segnaIncassoSpostato(incassoId);
      }}
    />
  );
}

import {
  resolveEnergyBlueprint,
  type EnergyBlueprintInput,
} from "../../domain/chronotype/blueprint";
import "./energy-blueprint.css";

export interface EnergyPeakSentenceProps extends EnergyBlueprintInput {
  className?: string;
}

export function EnergyPeakSentence({ className, ...input }: EnergyPeakSentenceProps) {
  const model = resolveEnergyBlueprint(input);
  const classNames = className ? `ebv-sentence ${className}` : "ebv-sentence";
  return <p className={classNames}>{model.sentence}</p>;
}

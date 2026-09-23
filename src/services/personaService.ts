import { PERSONAS, getPersona } from "@/data/personas";
import type { Persona } from "@/types";

export const personaService = {
  list(): Persona[] {
    return PERSONAS;
  },
  get(id: string): Persona | undefined {
    return getPersona(id);
  },
};

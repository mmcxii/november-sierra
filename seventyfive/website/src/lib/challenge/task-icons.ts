import { BookOpen, Camera, Droplets, Dumbbell, Trees, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const TASK_ICONS: Record<string, LucideIcon> = {
  diet: Utensils,
  outdoorWorkout: Trees,
  progressPhoto: Camera,
  reading: BookOpen,
  water: Droplets,
  workout: Dumbbell,
};

import { z } from "zod";

export const mileageInputSchema = z.object({
  vehicleId: z.string().min(1),
  odometerKm: z.coerce.number().int().positive(),
});

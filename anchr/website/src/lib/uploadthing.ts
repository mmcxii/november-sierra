import type { UploadRouter } from "@/app/api/uploadthing/core";
import { generateReactHelpers } from "@uploadthing/react";

export const { useUploadThing } = generateReactHelpers<UploadRouter>();

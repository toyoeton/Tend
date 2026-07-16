import { ServiceType } from "@prisma/client";

const serviceTypes = new Set<string>(Object.values(ServiceType));

export function parseServiceType(value: string | null | undefined): ServiceType | undefined {
  if (!value) return undefined;
  return serviceTypes.has(value) ? (value as ServiceType) : undefined;
}

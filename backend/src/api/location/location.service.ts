import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllLocations = async (organizationId: number) => {
  // Get all locations with asset counts
  const locations = await prisma.location.findMany({
    where: {
      organizationId,
    },
    include: {
      assets: {
        select: { id: true }
      }
    }
  });

  // Build hierarchy
  const locationMap = new Map();
  const rootLocations: any[] = [];

  // First pass: create location objects with asset counts
  locations.forEach(loc => {
    const location = {
      ...loc,
      assetCount: loc.assets?.length || 0,
      children: []
    };
    locationMap.set(loc.id, location);
  });

  // Second pass: build hierarchy
  locationMap.forEach(location => {
    if (location.parentId) {
      const parent = locationMap.get(location.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(location);
      } else {
        // Parent not found, treat as root
        rootLocations.push(location);
      }
    } else {
      rootLocations.push(location);
    }
  });

  return rootLocations;
};

export const getLocationById = async (id: number, organizationId: number) => {
  return prisma.location.findFirst({ 
    where: { 
      id,
      organizationId 
    } 
  });
};

export const createLocation = async (data: any, organizationId: number) => {
  return prisma.location.create({ 
    data: {
      ...data,
      organizationId
    }
  });
};

export const updateLocation = async (id: number, data: any, organizationId: number) => {
  return prisma.location.update({
    where: { id, organizationId },
    data,
  });
};

export const deleteLocation = async (id: number, organizationId: number) => {
  return prisma.location.delete({ 
    where: { id, organizationId } 
  });
};

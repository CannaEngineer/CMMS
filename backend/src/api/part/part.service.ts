import { PrismaClient, Part } from '@prisma/client';

const prisma = new PrismaClient();

export class PartService {
  async getAllParts(organizationId: number) {
    return prisma.part.findMany({
      where: { organizationId },
      include: {
        supplier: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getPartById(id: number, organizationId: number) {
    return prisma.part.findFirst({
      where: { 
        id,
        organizationId 
      },
      include: {
        supplier: true,
      },
    });
  }

  async createPart(data: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>) {
    // Check for duplicates and merge if found
    const result = await this.createOrMergePart(data);
    return result;
  }

  async createOrMergePart(data: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>) {
    // Find potential duplicates based on key identifying fields
    const existingPart = await this.findDuplicate(data);
    
    if (existingPart) {
      console.log(`🔄 Duplicate part found: ${data.name} (SKU: ${data.sku}). Merging with existing part ID: ${existingPart.id}`);
      
      // Merge the data - combine stock levels and update other fields
      const mergedData = this.mergeParts(existingPart, data);
      
      return prisma.part.update({
        where: { id: existingPart.id },
        data: {
          ...mergedData,
          updatedAt: new Date(),
        },
        include: {
          supplier: true,
        },
      });
    } else {
      // No duplicate found, create new part
      console.log(`✅ Creating new part: ${data.name} (SKU: ${data.sku})`);
      return prisma.part.create({
        data,
        include: {
          supplier: true,
        },
      });
    }
  }

  private async findDuplicate(data: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>) {
    // Check for duplicates using multiple criteria in order of priority
    
    // 1. Exact SKU match (highest priority)
    if (data.sku && data.sku.trim()) {
      const skuMatch = await prisma.part.findFirst({
        where: {
          organizationId: data.organizationId,
          sku: data.sku.trim(),
        },
        include: { supplier: true },
      });
      if (skuMatch) return skuMatch;
    }

    // 2. Legacy ID match (for imports)
    if (data.legacyId) {
      const legacyMatch = await prisma.part.findFirst({
        where: {
          organizationId: data.organizationId,
          legacyId: data.legacyId,
        },
        include: { supplier: true },
      });
      if (legacyMatch) return legacyMatch;
    }

    // 3. Exact name and description match
    const exactMatch = await prisma.part.findFirst({
      where: {
        organizationId: data.organizationId,
        name: data.name.trim(),
        description: data.description ? data.description.trim() : null,
      },
      include: { supplier: true },
    });
    
    return exactMatch;
  }

  private mergeParts(existingPart: any, newData: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>) {
    return {
      // Keep the most complete data
      name: newData.name || existingPart.name,
      description: newData.description || existingPart.description,
      sku: newData.sku || existingPart.sku,
      
      // Add stock levels together
      stockLevel: (existingPart.stockLevel || 0) + (newData.stockLevel || 0),
      
      // Take the higher reorder point for safety
      reorderPoint: Math.max(existingPart.reorderPoint || 0, newData.reorderPoint || 0),
      
      // Keep financial data if available
      unitCost: newData.unitCost || existingPart.unitCost,
      totalCost: newData.totalCost || existingPart.totalCost,
      
      // Keep physical properties
      barcode: newData.barcode || existingPart.barcode,
      location: newData.location || existingPart.location,
      
      // Keep supplier info (prefer new if provided)
      supplierId: newData.supplierId || existingPart.supplierId,
      
      // Keep organization and legacy ID
      organizationId: existingPart.organizationId,
      legacyId: existingPart.legacyId || newData.legacyId,
    };
  }

  async updatePart(id: number, organizationId: number, data: Partial<Part>) {
    // First verify the part belongs to the organization for security
    const existingPart = await prisma.part.findFirst({
      where: { id, organizationId }
    });
    
    if (!existingPart) {
      throw new Error('Part not found or access denied');
    }
    
    return prisma.part.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        supplier: true,
      },
    });
  }

  async deletePart(id: number, organizationId: number) {
    // First verify the part belongs to the organization for security
    const existingPart = await prisma.part.findFirst({
      where: { id, organizationId }
    });
    
    if (!existingPart) {
      throw new Error('Part not found or access denied');
    }
    
    return prisma.part.delete({
      where: { id },
    });
  }

  async getLowStockParts(organizationId: number) {
    return prisma.part.findMany({
      where: {
        organizationId,
        stockLevel: {
          lte: prisma.part.fields.reorderPoint,
        },
      },
      include: {
        supplier: true,
      },
      orderBy: { stockLevel: 'asc' },
    });
  }

  async updateStockLevel(id: number, organizationId: number, quantity: number) {
    // First verify the part belongs to the organization for security
    const existingPart = await prisma.part.findFirst({
      where: { id, organizationId }
    });
    
    if (!existingPart) {
      throw new Error('Part not found or access denied');
    }
    
    return prisma.part.update({
      where: { id },
      data: {
        stockLevel: {
          increment: quantity,
        },
        updatedAt: new Date(),
      },
    });
  }

  async batchCreateOrMergeParts(partsData: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>[]) {
    const results = {
      created: 0,
      merged: 0,
      total: partsData.length,
      details: [] as { action: 'created' | 'merged', part: any }[],
    };

    for (const partData of partsData) {
      try {
        const existingPart = await this.findDuplicate(partData);
        
        if (existingPart) {
          // Merge with existing part
          const mergedData = this.mergeParts(existingPart, partData);
          const updatedPart = await prisma.part.update({
            where: { id: existingPart.id },
            data: {
              ...mergedData,
              updatedAt: new Date(),
            },
            include: { supplier: true },
          });
          
          results.merged++;
          results.details.push({ action: 'merged', part: updatedPart });
          console.log(`🔄 Merged: ${partData.name} with existing part ID: ${existingPart.id}`);
        } else {
          // Create new part
          const newPart = await prisma.part.create({
            data: partData,
            include: { supplier: true },
          });
          
          results.created++;
          results.details.push({ action: 'created', part: newPart });
          console.log(`✅ Created: ${partData.name} with ID: ${newPart.id}`);
        }
      } catch (error) {
        console.error(`❌ Error processing part ${partData.name}:`, error);
        // Continue with other parts even if one fails
      }
    }

    console.log(`📊 Batch processing complete: ${results.created} created, ${results.merged} merged out of ${results.total} parts`);
    return results;
  }

  async cleanupDuplicates(organizationId: number) {
    console.log(`🧹 Starting duplicate cleanup for organization ${organizationId}`);
    
    const allParts = await prisma.part.findMany({
      where: { organizationId },
      include: { supplier: true },
      orderBy: { createdAt: 'asc' }, // Keep the oldest part as primary
    });

    const processedSKUs = new Set<string>();
    const processedNames = new Set<string>();
    const duplicatesFound: { primary: any, duplicates: any[] }[] = [];

    // Group duplicates by SKU first (highest priority)
    for (const part of allParts) {
      if (part.sku && part.sku.trim() && !processedSKUs.has(part.sku.trim())) {
        const duplicates = allParts.filter(p => 
          p.id !== part.id && 
          p.sku && 
          p.sku?.trim() === part.sku?.trim()
        );
        
        if (duplicates.length > 0) {
          duplicatesFound.push({ primary: part, duplicates });
          processedSKUs.add(part.sku?.trim() || '');
        }
      }
    }

    // Group remaining duplicates by name and description
    for (const part of allParts) {
      const nameKey = `${part.name.trim()}_${part.description || ''}`;
      if (!processedNames.has(nameKey) && !processedSKUs.has(part.sku || '')) {
        const duplicates = allParts.filter(p => 
          p.id !== part.id && 
          p.name.trim() === part.name.trim() &&
          (p.description || '') === (part.description || '') &&
          !processedSKUs.has(p.sku || '') // Don't process SKU duplicates again
        );
        
        if (duplicates.length > 0) {
          duplicatesFound.push({ primary: part, duplicates });
          processedNames.add(nameKey);
        }
      }
    }

    // Merge duplicates
    const mergeResults = {
      groupsProcessed: 0,
      partsMerged: 0,
      partsDeleted: 0,
      errors: 0
    };

    for (const group of duplicatesFound) {
      try {
        // Merge all duplicates into the primary part
        let mergedData = group.primary;
        
        for (const duplicate of group.duplicates) {
          mergedData = this.mergeParts(mergedData, duplicate);
        }

        // Update the primary part with merged data
        await prisma.part.update({
          where: { id: group.primary.id },
          data: {
            ...mergedData,
            id: undefined, // Remove ID from update data
            createdAt: undefined, // Keep original createdAt
            updatedAt: new Date(),
          },
        });

        // Delete the duplicate parts
        for (const duplicate of group.duplicates) {
          await prisma.part.delete({
            where: { id: duplicate.id },
          });
        }

        console.log(`🔄 Merged ${group.duplicates.length} duplicates into part "${group.primary.name}" (ID: ${group.primary.id})`);
        mergeResults.groupsProcessed++;
        mergeResults.partsMerged += group.duplicates.length;
        mergeResults.partsDeleted += group.duplicates.length;
        
      } catch (error) {
        console.error(`❌ Error merging group for part "${group.primary.name}":`, error);
        mergeResults.errors++;
      }
    }

    console.log(`🧹 Cleanup complete: ${mergeResults.groupsProcessed} groups processed, ${mergeResults.partsMerged} parts merged, ${mergeResults.partsDeleted} duplicates removed, ${mergeResults.errors} errors`);
    return mergeResults;
  }

  async getRecentActivity(organizationId: number, limit: number = 10) {
    return prisma.part.findMany({
      where: { organizationId },
      include: {
        supplier: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }
}
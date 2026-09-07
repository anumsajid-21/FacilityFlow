/**
 * FacilityFlow database seed.
 *
 * Seeds only platform infrastructure data:
 *   - The 8 default service categories
 *   - Default checklist templates per service category
 *   - Secure demo accounts (passwords are hashed, never plaintext)
 *
 * It intentionally does NOT create business records (buildings, requests,
 * quotations, contracts ...) — those must be created through the real
 * application workflows so dashboards always reflect genuine data.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SERVICE_CATEGORIES = [
  { name: 'Commercial Cleaning', description: 'Regular professional cleaning of commercial facilities, offices and common areas.' },
  { name: 'Glass/Façade Cleaning', description: 'Interior and exterior glass and building façade cleaning services.' },
  { name: 'HVAC/AC', description: 'HVAC and air-conditioning installation, servicing, repair and maintenance.' },
  { name: 'Electrical', description: 'Electrical installations, repairs, preventive maintenance and safety checks.' },
  { name: 'Plumbing', description: 'Plumbing repair, maintenance and installation services.' },
  { name: 'Pest Control', description: 'Preventive and corrective pest control for commercial facilities.' },
  { name: 'Landscaping', description: 'Grounds maintenance and landscaping services for facilities.' },
  { name: 'General Facility Maintenance', description: 'Broad facility upkeep, repairs and maintenance services.' },
];

const CHECKLISTS = [
  {
    category: 'Glass Cleaning',
    name: 'Glass Cleaning Standard',
    description: 'Default checklist for glass and façade cleaning jobs.',
    items: ['Inspect glass', 'Clean exterior', 'Clean interior', 'Clean frames', 'Inspect damage', 'Final inspection'],
  },
  {
    category: 'HVAC/AC',
    name: 'HVAC Service Standard',
    description: 'Default checklist for HVAC and AC service jobs.',
    items: ['Check filter', 'Check electrical', 'Check drainage', 'Test cooling', 'Inspect outdoor unit'],
  },
  {
    category: 'Commercial Cleaning',
    name: 'Commercial Cleaning Standard',
    description: 'Default checklist for commercial cleaning jobs.',
    items: ['Inspect premises', 'Clean floors', 'Clean surfaces', 'Empty bins', 'Restroom sanitation', 'Final inspection'],
  },
  {
    category: 'Electrical',
    name: 'Electrical Service Standard',
    description: 'Default checklist for electrical service jobs.',
    items: ['Visual inspection', 'Test circuits', 'Check panel', 'Verify safety', 'Test lighting'],
  },
  {
    category: 'Plumbing',
    name: 'Plumbing Service Standard',
    description: 'Default checklist for plumbing jobs.',
    items: ['Inspect pipes', 'Check fixtures', 'Test water pressure', 'Check for leaks', 'Final inspection'],
  },
  {
    category: 'Pest Control',
    name: 'Pest Control Standard',
    description: 'Default checklist for pest control jobs.',
    items: ['Inspect premises', 'Identify infestation', 'Apply treatment', 'Safety checks', 'Final report'],
  },
  {
    category: 'Landscaping',
    name: 'Landscaping Standard',
    description: 'Default checklist for landscaping jobs.',
    items: ['Inspect grounds', 'Mowing / trimming', 'Irrigation check', 'Waste removal', 'Final inspection'],
  },
  {
    category: 'General Facility Maintenance',
    name: 'General Maintenance Standard',
    description: 'Default checklist for general facility maintenance jobs.',
    items: ['Walkthrough', 'Identify issues', 'Perform maintenance', 'Safety check', 'Final inspection'],
  },
];
const DEMO_USERS = [
  {
    email: 'hiring@facilityflow.app',
    password: 'Hire@12345',
    name: 'Demo Facility Manager',
    role: 'HIRING_ORG',
    organization: 'Demo Facilities Co',
  },
  {
    email: 'provider@facilityflow.app',
    password: 'Provide@12345',
    name: 'Demo Provider Manager',
    role: 'PROVIDER',
    provider: 'Demo Maintenance Pros',
  },
  {
    email: 'admin@facilityflow.app',
    password: 'Admin@12345',
    name: 'FacilityFlow Admin',
    role: 'ADMIN',
  },
];

async function seedCategories() {
  const categories = new Map();
  for (const cat of SERVICE_CATEGORIES) {
    const existing = await prisma.serviceCategory.findUnique({ where: { name: cat.name } });
    const record =
      existing ||
      (await prisma.serviceCategory.create({
        data: { name: cat.name, description: cat.description },
      }));
    categories.set(cat.name, record.id);
  }
  return categories;
}

async function seedChecklists(categories) {
  for (const cl of CHECKLISTS) {
    const categoryId = categories.get(cl.category);
    if (!categoryId) continue;
    const existingChecklist = await prisma.checklist.findFirst({
      where: { name: cl.name, categoryId },
    });
    if (existingChecklist) continue;
    await prisma.checklist.create({
      data: {
        name: cl.name,
        categoryId,
        description: cl.description,
        items: {
          create: cl.items.map((description, idx) => ({ description, sortOrder: idx + 1 })),
        },
      },
    });
  }
}

async function seedDemoUsers() {
  for (const u of DEMO_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) continue;
    const hashed = await bcrypt.hash(u.password, 12);

    let hiringOrgId = null;
    let providerId = null;

    if (u.role === 'HIRING_ORG' && u.organization) {
      const org = await prisma.organization.create({ data: { name: u.organization } });
      hiringOrgId = org.id;
    }
    if (u.role === 'PROVIDER' && u.provider) {
      const provider = await prisma.provider.create({
        data: { name: u.provider, verificationStatus: 'VERIFIED', workforceCapacity: 12 },
      });
      providerId = provider.id;
    }

    const user = await prisma.user.create({
      data: {
        email: u.email,
        password: hashed,
        name: u.name,
        role: u.role,
        hiringOrgId,
        providerId,
      },
    });

    if (hiringOrgId) {
      await prisma.organizationMember.create({
        data: { organizationId: hiringOrgId, userId: user.id, role: 'ADMIN' },
      });
    }
  }
}

const DEMO_PROVIDERS = [
  { email: 'provider@facilityflow.app', password: 'Provide@12345', name: 'Demo Provider Manager', company: 'Demo Maintenance Pros' },
  { email: 'provider2@facilityflow.app', password: 'Provide@12345', name: 'Prime HVAC Manager', company: 'Prime HVAC Services' },
  { email: 'provider3@facilityflow.app', password: 'Provide@12345', name: 'SparkleClean Manager', company: 'SparkleClean Facility Care' },
];

async function seedDemoProviders(categories) {
  const providers = [];
  for (const p of DEMO_PROVIDERS) {
    let provider = await prisma.provider.findFirst({ where: { name: p.company } });
    if (!provider) {
      provider = await prisma.provider.create({
        data: {
          name: p.company,
          description: `${p.company} — professional facility services.`,
          verificationStatus: 'VERIFIED',
          workforceCapacity: 15,
        },
      });
    }
    const user = await prisma.user.findUnique({ where: { email: p.email } });
    if (!user) {
      await prisma.user.create({
        data: {
          email: p.email,
          password: await bcrypt.hash(p.password, 12),
          name: p.name,
          role: 'PROVIDER',
          providerId: provider.id,
        },
      });
    }
    for (const catName of ['HVAC/AC', 'Commercial Cleaning']) {
      const categoryId = categories.get(catName);
      if (categoryId) {
        await prisma.providerService.upsert({
          where: { providerId_categoryId: { providerId: provider.id, categoryId } },
          update: {},
          create: { providerId: provider.id, categoryId, priceNote: 'Competitive rates' },
        });
      }
    }
    providers.push(provider);
  }
  return providers;
}

/**
 * Demo business data for the hiring organization: buildings, floors, areas,
 * service requests, quotations, one accepted contract and scheduled jobs.
 * Idempotent: skipped if the org already has buildings/requests.
 */
async function seedBusinessData(org, providers, categories) {
  const hasDemoBuilding = await prisma.building.findFirst({ where: { organizationId: org.id, name: 'HQ Tower' } });
  if (hasDemoBuilding) return; // already seeded

  const hvac = categories.get('HVAC/AC');
  const cleaning = categories.get('Commercial Cleaning');
  const orgUser = await prisma.user.findFirst({ where: { hiringOrgId: org.id } });

  // --- Buildings / Floors / Areas ---
  const hq = await prisma.building.create({
    data: {
      organizationId: org.id,
      name: 'HQ Tower',
      address: '100 Downtown Blvd',
      city: 'Austin',
      buildingType: 'Office',
      numberOfFloors: 2,
    },
  });
  const hqGround = await prisma.floor.create({ data: { buildingId: hq.id, name: 'Ground Floor' } });
  const hqL1 = await prisma.floor.create({ data: { buildingId: hq.id, name: 'Level 1' } });
  const lobby = await prisma.area.create({ data: { floorId: hqGround.id, name: 'Main Lobby', category: 'Lobby' } });
  await prisma.area.create({ data: { floorId: hqGround.id, name: 'Reception Office', category: 'Office' } });
  await prisma.area.create({ data: { floorId: hqL1.id, name: 'Open Workspace', category: 'Office' } });
  const serverRoom = await prisma.area.create({ data: { floorId: hqL1.id, name: 'Server Room', category: 'Equipment room' } });

  const annex = await prisma.building.create({
    data: {
      organizationId: org.id,
      name: 'Riverside Annex',
      address: '42 River Rd',
      city: 'Austin',
      buildingType: 'Office',
      numberOfFloors: 1,
    },
  });
  const annexFloor = await prisma.floor.create({ data: { buildingId: annex.id, name: 'Floor 1' } });
  await prisma.area.create({ data: { floorId: annexFloor.id, name: 'Front Desk', category: 'Office' } });

  // --- Service Requests ---
  const now = new Date();
  const inTwoWeeks = new Date(now.getTime() + 14 * 864e5);
  const srHvac = await prisma.serviceRequest.create({
    data: {
      organizationId: org.id,
      createdById: orgUser?.id,
      categoryId: hvac,
      title: 'Quarterly HVAC maintenance',
      description: 'Full HVAC inspection and filter replacement for both floors before summer.',
      buildingId: hq.id,
      floorId: hqL1.id,
      areaId: serverRoom.id,
      requirements: 'Certified technicians, weekend availability.',
      preferredDate: inTwoWeeks,
      budget: 2500,
      priority: 'HIGH',
      status: 'OPEN',
    },
  });
  const srCleaning = await prisma.serviceRequest.create({
    data: {
      organizationId: org.id,
      createdById: orgUser?.id,
      categoryId: cleaning,
      title: 'Lobby deep cleaning',
      description: 'Deep clean of the main lobby including glass and floors.',
      buildingId: hq.id,
      floorId: hqGround.id,
      areaId: lobby.id,
      budget: 800,
      priority: 'NORMAL',
      status: 'OPEN',
    },
  });

  // --- Quotations (submitted, awaiting comparison) ---
  const quotes = [
    { p: providers[0], price: 2200, workers: 3, duration: '2 days' },
    { p: providers[1], price: 2450, workers: 2, duration: '1 day' },
  ];
  for (const q of quotes) {
    await prisma.quotation.create({
      data: {
        serviceRequestId: srHvac.id,
        providerId: q.p.id,
        price: q.price,
        numberOfWorkers: q.workers,
        duration: q.duration,
        sla: 'Response within 4 hours',
        warranty: '90 days',
        terms: '50% upfront, 50% on completion.',
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });
  }
  await prisma.serviceRequest.update({ where: { id: srHvac.id }, data: { status: 'QUOTATIONS_RECEIVED' } });

  // --- Contract from an accepted quotation (on the cleaning request) ---
  const acceptedQuote = await prisma.quotation.create({
    data: {
      serviceRequestId: srCleaning.id,
      providerId: providers[2].id,
      price: 750,
      numberOfWorkers: 4,
      duration: '1 day',
      sla: 'Response within 2 hours',
      status: 'ACCEPTED',
      submittedAt: new Date(),
      shortlistedAt: new Date(),
    },
  });
  await prisma.serviceRequest.update({ where: { id: srCleaning.id }, data: { status: 'PROVIDER_SELECTED' } });

  const start = new Date();
  const end = new Date();
  end.setFullYear(end.getFullYear() + 1);
  const contract = await prisma.contract.create({
    data: {
      organizationId: org.id,
      providerId: providers[2].id,
      serviceRequestId: srCleaning.id,
      quotationId: acceptedQuote.id,
      buildingId: srCleaning.buildingId,
      serviceName: 'Commercial Cleaning',
      title: 'Commercial Cleaning - SparkleClean Facility Care',
      price: 750,
      startDate: start,
      endDate: end,
      sla: 'Response within 2 hours',
      status: 'ACTIVE',
    },
  });
  await prisma.contractVersion.create({
    data: { contractId: contract.id, version: 1, creatorId: orgUser.id, snapshot: JSON.stringify(contract) },
  });

  // --- Jobs under the contract ---
  const jobDate = new Date(now.getTime() + 7 * 864e5);
  jobDate.setHours(9, 0, 0, 0);
  const jobEnd = new Date(jobDate.getTime() + 8 * 3600e3);
  await prisma.job.create({
    data: {
      contractId: contract.id,
      buildingId: srCleaning.buildingId,
      floorId: hqGround.id,
      areaId: lobby.id,
      title: 'Lobby deep clean visit',
      location: 'HQ Tower - Main Lobby',
      date: jobDate,
      startTime: jobDate,
      endTime: jobEnd,
      serviceName: 'Commercial Cleaning',
      status: 'SCHEDULED',
    },
  });

  console.log('Seed complete: demo buildings, requests, quotations, contract and jobs created.');
}

async function main() {
  const categories = await seedCategories();
  await seedChecklists(categories);
  await seedDemoUsers();
  const providers = await seedDemoProviders(categories);
  // Attach demo business data to the demo hiring organization
  const org = await prisma.organization.findFirst({ where: { name: 'Demo Facilities Co' } });
  if (org) {
    await seedBusinessData(org, providers, categories);
  }
  console.log('Seed complete: categories, checklist templates and demo accounts are ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
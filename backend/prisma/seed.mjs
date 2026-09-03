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

async function main() {
  const categories = await seedCategories();
  await seedChecklists(categories);
  await seedDemoUsers();
  console.log('Seed complete: categories, checklist templates and demo accounts are ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
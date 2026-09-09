/**
 * FacilityFlow database seed.
 *
 * Seeds platform infrastructure plus a realistic, repeatable demo workspace.
 * Passwords are hashed before persistence; the credential table printed at the
 * end is intended for local/demo environments only.
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

const DEMO_WORKERS = [
  { email: 'worker1@facilityflow.app', password: 'Worker123!', name: 'Alex Rivera', skills: 'Commercial cleaning, floor care', certifications: 'OSHA 10', providerIndex: 2 },
  { email: 'worker2@facilityflow.app', password: 'Worker123!', name: 'Jordan Lee', skills: 'HVAC, preventive maintenance', certifications: 'EPA 608', providerIndex: 1 },
  { email: 'worker3@facilityflow.app', password: 'Worker123!', name: 'Sam Patel', skills: 'Electrical, safety inspections', certifications: 'Licensed electrician', providerIndex: 0 },
  { email: 'worker4@facilityflow.app', password: 'Worker123!', name: 'Taylor Morgan', skills: 'Plumbing, general maintenance', certifications: 'OSHA 10', providerIndex: 0 },
];

async function seedWorkers(providers) {
  const workers = [];
  for (const w of DEMO_WORKERS) {
    const provider = providers[w.providerIndex % providers.length];
    let worker = await prisma.worker.findUnique({ where: { email: w.email } });
    if (!worker) {
      worker = await prisma.worker.create({
        data: { providerId: provider.id, name: w.name, email: w.email, skills: w.skills, certifications: w.certifications, availability: 'Mon-Fri 08:00-17:00', inviteStatus: 'ACCEPTED' },
      });
    }
    let user = await prisma.user.findUnique({ where: { email: w.email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: w.email, password: await bcrypt.hash(w.password, 12), name: w.name, role: 'WORKER', providerId: provider.id, isActive: true },
      });
      await prisma.worker.update({ where: { id: worker.id }, data: { userId: user.id } });
    } else if (worker.userId !== user.id) {
      await prisma.worker.update({ where: { id: worker.id }, data: { userId: user.id } });
    }
    workers.push(worker);
  }
  return workers;
}

async function seedExtendedBusiness(org, providers, workers) {
  const contract = await prisma.contract.findFirst({ where: { organizationId: org.id, title: { contains: 'Commercial Cleaning' } }, include: { jobs: true } });
  if (!contract) return;
  const jobs = contract.jobs;
  const job = jobs[0];
  if (job && workers[0]) {
    await prisma.workerAssignment.upsert({
      where: { jobId_workerId: { jobId: job.id, workerId: workers[0].id } },
      update: {},
      create: { jobId: job.id, workerId: workers[0].id },
    });
  }
  const policyByProvider = new Map();
  for (const provider of providers) {
    let policy = await prisma.slaPolicy.findFirst({ where: { providerId: provider.id, name: 'Standard demo SLA' } });
    if (!policy) policy = await prisma.slaPolicy.create({ data: { providerId: provider.id, name: 'Standard demo SLA', responseHours: 4, resolutionHours: 48, warningHours: 8 } });
    policyByProvider.set(provider.id, policy);
  }
  for (const j of jobs) {
    const policy = policyByProvider.get(contract.providerId);
    await prisma.jobSla.upsert({ where: { jobId: j.id }, update: { policyId: policy?.id }, create: { jobId: j.id, policyId: policy?.id, deadline: new Date(j.startTime.getTime() + 48 * 3600000) } });
  }
  // A second provider contract gives the demo dashboard a useful comparison.
  const hvacRequest = await prisma.serviceRequest.findFirst({ where: { organizationId: org.id, title: 'Quarterly HVAC maintenance' } });
  if (hvacRequest && providers[0]) {
    const hvacQuote = await prisma.quotation.findFirst({ where: { serviceRequestId: hvacRequest.id, providerId: providers[0].id } });
    if (hvacQuote) {
      await prisma.quotation.update({ where: { id: hvacQuote.id }, data: { status: 'ACCEPTED' } });
      let hvacContract = await prisma.contract.findFirst({ where: { quotationId: hvacQuote.id } });
      if (!hvacContract) {
        hvacContract = await prisma.contract.create({ data: { organizationId: org.id, providerId: providers[0].id, serviceRequestId: hvacRequest.id, quotationId: hvacQuote.id, buildingId: hvacRequest.buildingId, serviceName: 'HVAC/AC', title: 'HVAC Preventive Maintenance - Demo', price: 2200, startDate: new Date(), endDate: new Date(Date.now() + 365 * 864e5), sla: 'Resolution within 48 hours', status: 'ACTIVE' } });
      }
      const hvacJob = await prisma.job.findFirst({ where: { contractId: hvacContract.id } }) || await prisma.job.create({ data: { contractId: hvacContract.id, buildingId: hvacRequest.buildingId, floorId: hvacRequest.floorId, areaId: hvacRequest.areaId, title: 'Quarterly HVAC inspection', location: 'HQ Tower - Server Room', date: new Date(Date.now() + 10 * 864e5), startTime: new Date(Date.now() + 10 * 864e5), endTime: new Date(Date.now() + 10 * 864e5 + 4 * 3600000), serviceName: 'HVAC/AC', status: 'SCHEDULED' } });
      const hvacPolicy = policyByProvider.get(providers[0].id);
      await prisma.jobSla.upsert({ where: { jobId: hvacJob.id }, update: { policyId: hvacPolicy?.id }, create: { jobId: hvacJob.id, policyId: hvacPolicy?.id, deadline: new Date(hvacJob.startTime.getTime() + 48 * 3600000) } });
      await prisma.invoice.upsert({ where: { invoiceNumber: 'DEMO-0002' }, update: {}, create: { invoiceNumber: 'DEMO-0002', providerId: providers[0].id, organizationId: org.id, contractId: hvacContract.id, jobId: hvacJob.id, amount: 2200, tax: 220, discount: 0, total: 2420, dueDate: new Date(Date.now() + 21 * 864e5), status: 'PENDING' } });
    }
  }
  await prisma.contractSchedule.upsert({
    where: { contractId: contract.id },
    update: {},
    create: { contractId: contract.id, frequency: 'MONTHLY', startsAt: new Date(Date.now() + 30 * 864e5), nextRunAt: new Date(Date.now() + 30 * 864e5), occurrencesLimit: 12 },
  });
  if (job) {
    await prisma.invoice.upsert({
      where: { invoiceNumber: 'DEMO-0001' },
      update: {},
      create: { invoiceNumber: 'DEMO-0001', providerId: contract.providerId, organizationId: org.id, contractId: contract.id, jobId: job.id, amount: 750, tax: 75, discount: 0, total: 825, dueDate: new Date(Date.now() + 14 * 864e5), status: 'ISSUED' },
    });
    await prisma.review.upsert({
      where: { organizationId_providerId_jobId: { organizationId: org.id, providerId: contract.providerId, jobId: job.id } },
      update: {},
      create: { organizationId: org.id, providerId: contract.providerId, jobId: job.id, quality: 5, timeliness: 4, professionalism: 5, value: 4, overallRating: 4.5, comments: 'Reliable team with excellent communication and finish quality.' },
    });
  }

  async function seedSecondOrganization(categories) {
    const categoryId = categories.get('Electrical');
    let org = await prisma.organization.findFirst({ where: { name: 'Enterprise Campus Group' } });
    if (!org) org = await prisma.organization.create({ data: { name: 'Enterprise Campus Group', description: 'Multi-site corporate campus demo tenant', contactEmail: 'ops@enterprise-campus.test' } });
    let user = await prisma.user.findUnique({ where: { email: 'ops@facilityflow.app' } });
    if (!user) {
      user = await prisma.user.create({ data: { email: 'ops@facilityflow.app', password: await bcrypt.hash('Hire@12345', 12), name: 'Enterprise Operations Lead', role: 'HIRING_ORG', hiringOrgId: org.id } });
      await prisma.organizationMember.create({ data: { organizationId: org.id, userId: user.id, role: 'ADMIN' } });
    }
    let building = await prisma.building.findFirst({ where: { organizationId: org.id, name: 'Campus One' } });
    if (!building) {
      building = await prisma.building.create({ data: { organizationId: org.id, name: 'Campus One', address: '500 Innovation Way', city: 'Austin', buildingType: 'Campus', numberOfFloors: 3 } });
      const floor = await prisma.floor.create({ data: { buildingId: building.id, name: 'Main Level' } });
      const area = await prisma.area.create({ data: { floorId: floor.id, name: 'Electrical Room', category: 'Equipment room' } });
      await prisma.serviceRequest.create({ data: { organizationId: org.id, createdById: user.id, categoryId, title: 'Campus electrical safety inspection', description: 'Annual inspection of panels and emergency lighting.', buildingId: building.id, floorId: floor.id, areaId: area.id, budget: 1800, priority: 'NORMAL', status: 'OPEN' } });
    }
    return org;
  }
  const providerUser = await prisma.user.findFirst({ where: { providerId: contract.providerId, role: 'PROVIDER' } });
  const orgUser = await prisma.user.findFirst({ where: { hiringOrgId: org.id } });
  if (providerUser && orgUser) {
    const existing = await prisma.messageThread.findFirst({ where: { organizationId: org.id, providerId: contract.providerId, subject: 'Demo contract coordination' } });
    if (!existing) {
      await prisma.messageThread.create({
        data: { organizationId: org.id, providerId: contract.providerId, contractId: contract.id, subject: 'Demo contract coordination', createdById: orgUser.id, messages: { create: [{ senderId: orgUser.id, body: 'Welcome! Please confirm the next lobby cleaning date.' }, { senderId: providerUser.id, body: 'Confirmed. Our team will arrive at 9:00 AM.' }] } },
      });
    }
  }
}

async function main() {
  const categories = await seedCategories();
  await seedChecklists(categories);
  await seedDemoUsers();
  const providers = await seedDemoProviders(categories);
  const workers = await seedWorkers(providers);
  // Attach demo business data to the demo hiring organization
  const org = await prisma.organization.findFirst({ where: { name: 'Demo Facilities Co' } });
  if (org) {
    await seedBusinessData(org, providers, categories);
    await seedExtendedBusiness(org, providers, workers);
  }
  await seedSecondOrganization(categories);
  console.log('\nDemo credentials');
  console.table([
    ...DEMO_USERS.map(({ email, password, role }) => ({ role, email, password })),
    { role: 'HIRING_ORG', email: 'ops@facilityflow.app', password: 'Hire@12345' },
    ...DEMO_PROVIDERS.filter((p, i) => i > 0).map(({ email, password }) => ({ role: 'PROVIDER', email, password })),
    ...DEMO_WORKERS.map(({ email, password }) => ({ role: 'WORKER', email, password })),
  ]);
  console.log('Seed complete: categories, checklists, demo organizations/providers/workers and business workflows are ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
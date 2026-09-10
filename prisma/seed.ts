import { PrismaClient, Role, ServiceType } from "@prisma/client";

const prisma = new PrismaClient();

const weekdayHours = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  openTime: dayOfWeek === 0 ? "10:00" : "08:00",
  closeTime: dayOfWeek === 0 ? "14:00" : "18:00",
  isClosed: dayOfWeek === 6
}));

async function main() {
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.openHour.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.user.deleteMany();

  const providers = [
    {
      email: "clean@tend.local",
      name: "Amina Bello",
      googleId: "seed-google-clean",
      businessName: "Amina Home Care",
      bio: "Detailed apartment cleaning with eco-friendly supplies.",
      latitude: 6.5244,
      longitude: 3.3792,
      address: "Yaba, Lagos",
      services: [
        { type: ServiceType.CLEANING, name: "Standard cleaning", price: 1200000, durationMins: 120 },
        { type: ServiceType.CLEANING, name: "Deep cleaning", price: 2200000, durationMins: 240 }
      ]
    },
    {
      email: "laundry@tend.local",
      name: "Chinedu Okoro",
      googleId: "seed-google-laundry",
      businessName: "QuickFold Laundry",
      bio: "Pickup, wash, fold, and next-day delivery.",
      latitude: 6.6018,
      longitude: 3.3515,
      address: "Ikeja, Lagos",
      services: [
        { type: ServiceType.LAUNDRY, name: "Wash and fold", price: 650000, durationMins: 60 },
        { type: ServiceType.LAUNDRY, name: "Express laundry", price: 950000, durationMins: 45 }
      ]
    },
    {
      email: "dispatch@tend.local",
      name: "Tayo Adeyemi",
      googleId: "seed-google-dispatch",
      businessName: "Tayo Errands",
      bio: "Fast dispatch and local errands across Lagos mainland.",
      latitude: 6.455,
      longitude: 3.3841,
      address: "Victoria Island, Lagos",
      services: [
        { type: ServiceType.DISPATCH, name: "Local errand", price: 500000, durationMins: 60 },
        { type: ServiceType.DISPATCH, name: "Priority dispatch", price: 850000, durationMins: 45 }
      ]
    },
    {
      email: "glow@tend.local",
      name: "Ngozi Eze",
      googleId: "seed-google-glow",
      businessName: "Glow Beauty Studio",
      bio: "At-home beauty treatments and event-ready styling.",
      latitude: 6.5158,
      longitude: 3.3677,
      address: "Surulere, Lagos",
      services: [{ type: ServiceType.OTHER, name: "Makeup session", price: 1800000, solPrice: 0.03, durationMins: 90 }]
    },
    {
      email: "fixit@tend.local",
      name: "Bassey Udo",
      googleId: "seed-google-fixit",
      businessName: "FixIt Home Repairs",
      bio: "Reliable plumbing, electrical, and small home repairs.",
      latitude: 6.5486,
      longitude: 3.3764,
      address: "Ilupeju, Lagos",
      services: [{ type: ServiceType.OTHER, name: "Home repair visit", price: 1500000, solPrice: 0.025, durationMins: 120 }]
    },
    {
      email: "fresh@tend.local",
      name: "Kemi Adeola",
      googleId: "seed-google-fresh",
      businessName: "FreshBox Groceries",
      bio: "Fresh produce and pantry essentials delivered to your door.",
      latitude: 6.6012,
      longitude: 3.3513,
      address: "Maryland, Lagos",
      services: [{ type: ServiceType.DISPATCH, name: "Grocery delivery", price: 700000, solPrice: 0.012, durationMins: 60 }]
    },
    {
      email: "tutor@tend.local",
      name: "David Okafor",
      googleId: "seed-google-tutor",
      businessName: "BrightPath Tutors",
      bio: "Patient one-on-one tutoring for school and exam preparation.",
      latitude: 6.5249,
      longitude: 3.3798,
      address: "Gbagada, Lagos",
      services: [{ type: ServiceType.OTHER, name: "Private tutoring", price: 1000000, solPrice: 0.018, durationMins: 60 }]
    },
    {
      email: "petcare@tend.local",
      name: "Femi Adebayo",
      googleId: "seed-google-petcare",
      businessName: "Paws & Care",
      bio: "Friendly pet sitting, walking, and basic grooming services.",
      latitude: 6.4474,
      longitude: 3.3903,
      address: "Lekki, Lagos",
      services: [{ type: ServiceType.OTHER, name: "Pet care visit", price: 900000, solPrice: 0.015, durationMins: 60 }]
    }
  ];

  for (const provider of providers) {
    await prisma.user.create({
      data: {
        email: provider.email,
        googleId: provider.googleId,
        name: provider.name,
        role: Role.PROVIDER,
        providerProfile: {
          create: {
            businessName: provider.businessName,
            bio: provider.bio,
            latitude: provider.latitude,
            longitude: provider.longitude,
            address: provider.address,
            avgRating: 4.7,
            ratingCount: 12,
            openHours: { create: weekdayHours },
            services: { create: provider.services }
          }
        }
      }
    });
  }

  await prisma.user.create({
    data: {
      email: "customer@tend.local",
      googleId: "seed-google-customer",
      name: "Demo Customer",
      role: Role.CUSTOMER
    }
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

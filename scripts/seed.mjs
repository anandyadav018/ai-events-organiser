import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load .env.local manually if process.env is missing MONGODB_URI
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env.local");

if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join("=").trim();
      }
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai-events-organiser";

// Define Schemas
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    imageUrl: { type: String },
    hasCompletedOnBoarding: { type: Boolean, default: true },
    location: {
      city: { type: String },
      state: { type: String },
      country: { type: String, default: "India" },
    },
    interests: [String],
    freeEventsCreated: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    organizerName: { type: String, required: true },
    category: { type: String, required: true },
    tags: [String],
    startDate: { type: Number, required: true },
    endDate: { type: Number, required: true },
    timezone: { type: String, default: "Asia/Kolkata" },
    locationType: { type: String, enum: ["physical", "online"], default: "physical" },
    venue: { type: String },
    address: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, default: "India" },
    capacity: { type: Number, required: true },
    ticketType: { type: String, enum: ["free", "paid"], default: "free" },
    ticketPrice: { type: Number },
    registrationCount: { type: Number, default: 0 },
    coverImage: { type: String },
    themeColor: { type: String, default: "#1e3a8a" },
  },
  { timestamps: true }
);

const registrationSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attendeeName: { type: String, required: true },
    attendeeEmail: { type: String, required: true },
    qrCode: { type: String, required: true, unique: true },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Number },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
    registeredAt: { type: Number, required: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);
const Registration = mongoose.models.Registration || mongoose.model("Registration", registrationSchema);

// Helper for relative timestamps in milliseconds
const daysInFuture = (days, hours = 0) => {
  return Date.now() + (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000);
};

async function seed() {
  console.log("🌱 Connecting to MongoDB:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  console.log("🧹 Clearing existing data...");
  await User.deleteMany({});
  await Event.deleteMany({});
  await Registration.deleteMany({});

  console.log("👤 Creating demo user accounts...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  const organizer = await User.create({
    name: "Alex Rivera",
    email: "organizer@spott.com",
    password: hashedPassword,
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    hasCompletedOnBoarding: true,
    location: { city: "Bengaluru", state: "Karnataka", country: "India" },
    interests: ["AI", "Tech", "Startup", "Networking"],
    freeEventsCreated: 6,
  });

  const attendee = await User.create({
    name: "Priya Sharma",
    email: "user@spott.com",
    password: hashedPassword,
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    hasCompletedOnBoarding: true,
    location: { city: "Mumbai", state: "Maharashtra", country: "India" },
    interests: ["Design", "Music", "Tech"],
    freeEventsCreated: 0,
  });

  console.log("✨ Demo users created:");
  console.log("   Organizer: organizer@spott.com / password123");
  console.log("   User: user@spott.com / password123");

  const eventsData = [
    {
      title: "India AI & GenAI Summit 2026",
      description: "Join leading AI engineers, researchers, and founders discussing LLMs, multimodal AI, autonomous agents, and enterprise AI adoption in India.",
      slug: "india-ai-genai-summit-2026",
      category: "tech",
      tags: ["AI", "Generative AI", "LLM", "Tech Summit"],
      startDate: daysInFuture(7, 10),
      endDate: daysInFuture(7, 18),
      locationType: "physical",
      venue: "KTPO Convention Centre",
      address: "EPIP Zone, Whitefield",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      capacity: 350,
      ticketType: "paid",
      ticketPrice: 999,
      coverImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
      themeColor: "#3b82f6",
    },
    {
      title: "Bengaluru Founders & VC Networking Mixer",
      description: "An exclusive evening of high-impact networking connecting seed-stage startup founders with top angel investors and venture capitalists.",
      slug: "bengaluru-founders-vc-networking-mixer",
      category: "networking",
      tags: ["Startup", "Venture Capital", "Networking", "Founders"],
      startDate: daysInFuture(10, 18),
      endDate: daysInFuture(10, 22),
      locationType: "physical",
      venue: "Social Indiranagar",
      address: "100 Feet Road, Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      capacity: 150,
      ticketType: "free",
      ticketPrice: 0,
      coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
      themeColor: "#8b5cf6",
    },
    {
      title: "Mumbai Fintech & Web3 Conclave",
      description: "Explore the intersection of digital banking, decentralized finance, tokenomics, and regulatory frameworks driving the future of Indian fintech.",
      slug: "mumbai-fintech-web3-conclave",
      category: "business",
      tags: ["Fintech", "Web3", "Crypto", "Finance"],
      startDate: daysInFuture(14, 9),
      endDate: daysInFuture(14, 17),
      locationType: "physical",
      venue: "Jio World Convention Centre",
      address: "Bandra Kurla Complex, BKC",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      capacity: 500,
      ticketType: "paid",
      ticketPrice: 1499,
      coverImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80",
      themeColor: "#06b6d4",
    },
    {
      title: "Sunburn Electronic & Indie Music Night",
      description: "Experience an unforgettable night featuring electrifying beats from international DJs, indie bands, laser light shows, and food pop-ups.",
      slug: "sunburn-electronic-indie-music-night",
      category: "music",
      tags: ["Music", "EDM", "Concert", "Nightlife"],
      startDate: daysInFuture(18, 19),
      endDate: daysInFuture(18, 23),
      locationType: "physical",
      venue: "Mahalaxmi Racecourse Arena",
      address: "Mahalaxmi",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      capacity: 800,
      ticketType: "paid",
      ticketPrice: 799,
      coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
      themeColor: "#ec4899",
    },
    {
      title: "Delhi CyberSecurity & Cloud Native Expo",
      description: "Master zero-trust security architecture, Kubernetes governance, and cloud-native resilience strategies with senior DevOps engineers.",
      slug: "delhi-cybersecurity-cloud-native-expo",
      category: "tech",
      tags: ["DevOps", "Cloud", "Security", "Kubernetes"],
      startDate: daysInFuture(21, 10),
      endDate: daysInFuture(21, 17),
      locationType: "physical",
      venue: "Pragati Maidan Expo Hall 4",
      address: "Mathura Road",
      city: "Delhi",
      state: "Delhi",
      country: "India",
      capacity: 400,
      ticketType: "free",
      ticketPrice: 0,
      coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
      themeColor: "#10b981",
    },
    {
      title: "Capital Pitch Fest: North India Startup Showcase",
      description: "20 shortlisted early-stage tech startups pitch live to leading VC firms and angel networks for up to $2M in seed capital.",
      slug: "capital-pitch-fest-north-india-startup-showcase",
      category: "startup",
      tags: ["Pitching", "Funding", "Investors", "Startups"],
      startDate: daysInFuture(25, 11),
      endDate: daysInFuture(25, 16),
      locationType: "physical",
      venue: "India Habitat Centre",
      address: "Lodhi Road",
      city: "Delhi",
      state: "Delhi",
      country: "India",
      capacity: 250,
      ticketType: "paid",
      ticketPrice: 499,
      coverImage: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80",
      themeColor: "#f59e0b",
    },
    {
      title: "Hyderabad Cybercity AI & Robotics League",
      description: "A hands-on hackathon and exhibition featuring autonomous drones, computer vision systems, and edge computing innovations.",
      slug: "hyderabad-cybercity-ai-robotics-league",
      category: "tech",
      tags: ["Robotics", "AI", "Hardware", "Hackathon"],
      startDate: daysInFuture(28, 9),
      endDate: daysInFuture(29, 18),
      locationType: "physical",
      venue: "HITEX Exhibition Center",
      address: "Izzat Nagar, Kondapur",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      capacity: 300,
      ticketType: "free",
      ticketPrice: 0,
      coverImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
      themeColor: "#6366f1",
    },
    {
      title: "Hyderabad GameDev & eSports Championship",
      description: "Immerse yourself in indie game demos, Unreal Engine 5 masterclasses, and an adrenaline-fueled FIFA & Valorant esports tournament.",
      slug: "hyderabad-gamedev-esports-championship",
      category: "gaming",
      tags: ["Gaming", "eSports", "Unreal Engine", "GameDev"],
      startDate: daysInFuture(32, 14),
      endDate: daysInFuture(32, 22),
      locationType: "physical",
      venue: "T-Hub 2.0 Auditorium",
      address: "Raidurgam, Gachibowli",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      capacity: 450,
      ticketType: "paid",
      ticketPrice: 299,
      coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
      themeColor: "#a855f7",
    },
    {
      title: "Pune UI/UX Design & Product Systems Conference",
      description: "Learn modern design systems, micro-interactions, accessibility guidelines, and AI-powered design workflows from industry design leaders.",
      slug: "pune-ui-ux-design-product-systems-conference",
      category: "design",
      tags: ["UI/UX", "Product Design", "Design Systems", "Figma"],
      startDate: daysInFuture(35, 10),
      endDate: daysInFuture(35, 17),
      locationType: "physical",
      venue: "JW Marriott Grand Ballroom",
      address: "Senapati Bapat Road",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      capacity: 200,
      ticketType: "paid",
      ticketPrice: 699,
      coverImage: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=1200&q=80",
      themeColor: "#f43f5e",
    },
    {
      title: "Pune Open Source & DevOps Hackday",
      description: "Collaborate on popular open-source repositories, build custom CI/CD pipelines, and earn swags and mentorship from core maintainers.",
      slug: "pune-open-source-devops-hackday",
      category: "tech",
      tags: ["OpenSource", "GitHub", "DevOps", "Community"],
      startDate: daysInFuture(40, 9),
      endDate: daysInFuture(40, 19),
      locationType: "physical",
      venue: "VTP Trade Centre",
      address: "Viman Nagar",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      capacity: 180,
      ticketType: "free",
      ticketPrice: 0,
      coverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
      themeColor: "#14b8a6",
    },
    {
      title: "Global SaaS & Product Growth Masterclass",
      description: "A virtual workshop covering Product-Led Growth (PLG), customer retention benchmarks, dynamic pricing models, and SaaS metric scaling.",
      slug: "global-saas-product-growth-masterclass",
      category: "business",
      tags: ["SaaS", "PLG", "Growth", "Online Masterclass"],
      startDate: daysInFuture(45, 15),
      endDate: daysInFuture(45, 18),
      locationType: "online",
      venue: "Google Meet Live Stream",
      address: "Online Event",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      capacity: 1000,
      ticketType: "free",
      ticketPrice: 0,
      coverImage: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
      themeColor: "#3b82f6",
    },
    {
      title: "Women in Tech & Leadership Conclave",
      description: "Empowering female technologists, engineering managers, and startup founders with panel discussions, mentorship circles, and keynotes.",
      slug: "women-in-tech-leadership-conclave",
      category: "community",
      tags: ["WomenInTech", "Leadership", "Diversity", "Mentorship"],
      startDate: daysInFuture(50, 11),
      endDate: daysInFuture(50, 16),
      locationType: "physical",
      venue: "The Leela Palace Ballroom",
      address: "HAL Old Airport Road",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      capacity: 250,
      ticketType: "free",
      ticketPrice: 0,
      coverImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80",
      themeColor: "#ec4899",
    },
  ];

  console.log("📌 Inserting 12 realistic upcoming events...");
  const createdEvents = [];
  for (const item of eventsData) {
    const ev = await Event.create({
      ...item,
      organizerId: organizer._id,
      organizerName: organizer.name,
      registrationCount: 0,
    });
    createdEvents.push(ev);
  }

  console.log("🎫 Creating registrations and live check-in data...");
  let totalRegistrationsCreated = 0;

  // Create registrations for Priya (user@spott.com) across 4 events
  const priyaEventIndices = [0, 1, 3, 8];
  for (let i = 0; i < priyaEventIndices.length; i++) {
    const eventIndex = priyaEventIndices[i];
    const targetEvent = createdEvents[eventIndex];
    const isCheckedIn = i % 2 === 0; // check in half of them

    await Registration.create({
      eventId: targetEvent._id,
      userId: attendee._id,
      attendeeName: attendee.name,
      attendeeEmail: attendee.email,
      qrCode: `SPOTT-${targetEvent._id.toString().slice(-4)}-PRIYA-${i + 101}`,
      checkedIn: isCheckedIn,
      checkedInAt: isCheckedIn ? Date.now() - (i * 3600000) : undefined,
      status: "confirmed",
      registeredAt: Date.now() - ((i + 1) * 86400000),
    });

    await Event.findByIdAndUpdate(targetEvent._id, { $inc: { registrationCount: 1 } });
    totalRegistrationsCreated++;
  }

  // Create realistic extra sample registrations for the Organizer's dashboard testing
  const dummyNames = [
    { name: "Rahul Verma", email: "rahul.v@gmail.com" },
    { name: "Ananya Iyer", email: "ananya.i@tech.co" },
    { name: "Karan Mehta", email: "karan.m@startup.in" },
    { name: "Sneha Patel", email: "sneha.p@design.io" },
    { name: "Vikram Malhotra", email: "vikram@fintech.org" },
    { name: "Rohan Kapoor", email: "rohan.k@dev.net" },
  ];

  for (let idx = 0; idx < createdEvents.length; idx++) {
    const ev = createdEvents[idx];
    const extraCount = (idx % 3) + 2; // 2 to 4 extra registrations per event

    for (let j = 0; j < extraCount; j++) {
      const dummy = dummyNames[(idx + j) % dummyNames.length];
      const checkedIn = (j % 2 === 0);

      await Registration.create({
        eventId: ev._id,
        userId: organizer._id, // placeholder user ref for dummy data
        attendeeName: dummy.name,
        attendeeEmail: dummy.email,
        qrCode: `SPOTT-${ev._id.toString().slice(-4)}-REG-${idx * 10 + j}`,
        checkedIn: checkedIn,
        checkedInAt: checkedIn ? Date.now() - (j * 1800000) : undefined,
        status: "confirmed",
        registeredAt: Date.now() - ((j + 2) * 43200000),
      });

      await Event.findByIdAndUpdate(ev._id, { $inc: { registrationCount: 1 } });
      totalRegistrationsCreated++;
    }
  }

  console.log(`✅ Seed successfully completed!`);
  console.log(`   - 2 Users created`);
  console.log(`   - 12 Events created across 5 cities`);
  console.log(`   - ${totalRegistrationsCreated} Registrations & Check-in records inserted`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

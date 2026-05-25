export interface CoreCapability {
  id: string;
  title: string;
  operationalValue: string;
  technicalBrief: string;
  iconName: string;
}

export interface SecuritySystemProduct {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  status: "Active" | "Prototype" | "Deployment Ready" | "Research System";
  imagePath: string;
  specifications: string[];
  deploymentSector: string;
}

export interface ResearchField {
  id: string;
  title: string;
  description: string;
  operationalImpact: string;
}

export interface OperationalSector {
  id: string;
  name: string;
  description: string;
  code: string;
}

export interface ContactSubmission {
  name: string;
  organization: string;
  email: string;
  inquiryType: string;
  message: string;
}

// Simplified Content for better readability
export const CAPABILITIES_DATA: CoreCapability[] = [
  {
    id: "ai-surveillance",
    title: "AI Cameras & Video Analytics",
    operationalValue: "Smart cameras that track targets in real-time, detect unusual activities, and monitor wide areas with ease.",
    technicalBrief: "Handles video feeds locally on a private network, keeping all data secure without using the cloud.",
    iconName: "Eye"
  },
  {
    id: "autonomous-monitoring",
    title: "Drone & Ground Monitoring",
    operationalValue: "Drones and ground units that run long-term patrols to watch over borders and hard-to-reach areas.",
    technicalBrief: "Built-in safety backups, secure data transfer, and pre-planned flight paths for autonomous systems.",
    iconName: "Compass"
  },
  {
    id: "secure-comms",
    title: "Encrypted Networks & Comms",
    operationalValue: "Hardened, encrypted networks that keep teams and systems connected even in the most remote locations.",
    technicalBrief: "Highly secure data encryption, smart cellular backup, and long-range radio signals.",
    iconName: "ShieldAlert"
  },
  {
    id: "situational-awareness",
    title: "Real-Time Control Dashboards",
    operationalValue: "Saves time and effort by presenting complex sensor data in clean, easy-to-read local dashboards.",
    technicalBrief: "Live map systems, combined camera feeds, and real-time visual alerts.",
    iconName: "Tv"
  },
  {
    id: "critical-infra",
    title: "Key Infrastructure Protection",
    operationalValue: "Monitors valuable power lines, cell towers, and pipelines to prevent damage or interference.",
    technicalBrief: "Sound sensors, ground vibration trackers, and heat cameras working together.",
    iconName: "Activity"
  },
  {
    id: "tech-integration",
    title: "System Upgrades & Modernization",
    operationalValue: "Upgrades older hardware with modern computing, better cameras, and secure digital links.",
    technicalBrief: "Flexible designs built to match international standards so different systems can work together.",
    iconName: "Cpu"
  },
  {
    id: "operational-platforms",
    title: "Remote Diagnostics & Health",
    operationalValue: "Checks system health automatically to prevent equipment failures and ensure 100% uptime.",
    technicalBrief: "Secure physical sensors combined with private, local databases.",
    iconName: "Layers"
  }
];

export const OPERATIONAL_SECTORS_DATA: OperationalSector[] = [
  { id: "defense", name: "Defense & Military", description: "National border security, state asset protection, and digital defense networks.", code: "SEC-DEF-WEST" },
  { id: "government", name: "Government Agencies", description: "Secure routing between government departments and dependable emergency response hubs.", code: "SEC-GOV-NAT" },
  { id: "energy", name: "Energy & Pipelines", description: "Vibration alert systems for pipeline safety and heat-monitoring for energy substations.", code: "INF-ENG-NET" },
  { id: "maritime", name: "Ports & Harbors", description: "Coastal radar setups, ship-tracking systems, and secure port boundary monitors.", code: "MAR-SEC-POR" },
  { id: "industrial", name: "Factories & Warehouses", description: "Automatic security for logistics hubs, remote mining sites, and processing plants.", code: "IND-SEC-RES" },
  { id: "border", name: "Border Control", description: "Long-range drone routes, underground sensors, and thermal watch posts on national borders.", code: "BOR-MON-STA" },
  { id: "critical-infra", name: "Public Communication Links", description: "Protection for main internet transit centers, cell towers, and high-security data lines.", code: "INF-COM-TEC" }
];

export const RESEARCH_INNOVATION_DATA: ResearchField[] = [
  {
    id: "computer-vision",
    title: "Smart Local Target Detection",
    description: "Building custom smart-tracking software that runs directly on small, low-power field devices.",
    operationalImpact: "Identifies objects instantly with no cloud or internet needed, keeping important data completely private."
  },
  {
    id: "geospatial",
    title: "Live Map & Camera Combining",
    description: "Combining satellite photos, radar, and ground camera feeds into a single live map.",
    operationalImpact: "Shows high-quality, up-to-date maps to local teams to highlight movement and physical changes."
  },
  {
    id: "predictive-analytics",
    title: "Early Structural Warnings",
    description: "A smart system that monitors changes in pressure, vibration, sound, and heat across your assets.",
    operationalImpact: "Alerts teams to pipe leaks, structural issues, or machine failures hours before they happen, keeping operations running."
  }
];

// Product listings featuring our custom generated image assets
export const PRODUCTS_DATA = (
  droneImg: string,
  commsImg: string,
  thermalImg: string
): SecuritySystemProduct[] => [
  {
    id: "gt-800-sentinel",
    name: "GT-800 Sentinel Quadcopter",
    description: "A tough, lightweight carbon-fiber patrol drone built for quiet monitoring over land and water.",
    longDescription: "The GT-800 is an automated quadcopter with a strong carbon-fiber frame. It comes with secure radio signals, local smart-tracking computer systems, and interchangeable regular or thermal cameras. It is dustproof and waterproof, making it reliable in heavy rain, dust storms, or extreme heat.",
    status: "Deployment Ready",
    imagePath: droneImg,
    specifications: [
      "Fly Range: Up to 15 km",
      "Flight Time: Up to 55 minutes with camera",
      "Local AI: Smart Target Detection v2",
      "Signals: Securely encrypted connection",
      "Camera Weight Capacity: 2.2 kg max"
    ],
    deploymentSector: "Border Patrol & Infrastructure Monitoring"
  },
  {
    id: "nexus-comms-node",
    name: "Nexus-4 Secure Router",
    description: "A tough communications unit that builds secure, private networks in areas with no phone service.",
    longDescription: "The Nexus-4 creates a secure, private communication network anywhere on earth. Housed in a tough aluminum shell, it connects cameras, ground sensors, and control screens. It automatically switches between satellite, radio, and mobile signals to keep your connection active and stable.",
    status: "Active",
    imagePath: commsImg,
    specifications: [
      "Security: Strong end-to-end data encryption",
      "Networks: Satellite, Radio, and Cellular support",
      "Battery: 18 hours per charge",
      "Build: Fully shockproof, dustproof, and waterproof",
      "Works In: All weather (-10°C to +55°C)"
    ],
    deploymentSector: "Tactical Communications & Emergency Centers"
  },
  {
    id: "sentry-thermal-pod",
    name: "Sentry-X Thermal Camera",
    description: "A 360-degree heat-sensing camera tracker that automatically identifies movement day or night.",
    longDescription: "The Sentry-X automatically guards high-value properties like pipelines and factories. It scans continuously to find people up to 2 km and cars up to 4 km away, even in total darkness or heavy smoke. Its local AI system recognizes intruders and instantly sends encrypted alerts.",
    status: "Active",
    imagePath: thermalImg,
    specifications: [
      "Camera: Advanced heat-sensing lens",
      "Accuracy: Precision thermal tracking",
      "Range: Detects humans at 2km, vehicles at 4km",
      "Rotation: Full 360-degree motion tracking",
      "Data Link: Secure high-speed cable connection"
    ],
    deploymentSector: "Critical Infrastructure & Industrial Compounds"
  },
  {
    id: "apex-sensor-enclosure",
    name: "Aegis-7 Pipeline Ground Sensor",
    description: "Underground vibration sensors that detect digging or heavy vehicles near critical pipelines.",
    longDescription: "The Aegis-7 is a ground sensor that buries near critical pipelines. It listens to sound waves and vibrations in the dirt, warning teams of underground digging, heavy traffic, or pipe interference with high accuracy.",
    status: "Prototype",
    imagePath: "https://images.unsplash.com/photo-1581092334651-4091e102f6ef?auto=format&fit=crop&w=800&q=80",
    specifications: [
      "Sensor Core: Ground vibration and sound tracker",
      "Internal Memory: 48 hours of secure storage",
      "Coverage: Monitors in a 250-meter circle",
      "Power Source: Small high-durability solar panel",
      "Signals: Secure long-distance radio antenna"
    ],
    deploymentSector: "Energy & Pipeline Protection"
  },
  {
    id: "glint-vision-dashboard",
    name: "Glint Command Hub Dashboard",
    description: "A secure local control screen that combines camera feeds, drone maps, and fence sensors.",
    longDescription: "Our main control software. It runs locally on tough computer consoles and shows all camera feeds, live drone directions, and sensor warnings on one clean map. Since it runs completely offline, it keeps your sensitive details private and safe from outside attacks.",
    status: "Deployment Ready",
    imagePath: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    specifications: [
      "Runs On: Secure local computer consoles",
      "Capacity: Holds up to 128 cameras or drones",
      "Maps: Works 100% offline with offline maps",
      "Logs: Automatically logs security events",
      "Standards: Fits global communications rules"
    ],
    deploymentSector: "State Defense & Multi-Sensor Complexes"
  },
  {
    id: "aurora-tactical-workstation",
    name: "Zenith Rugged Server Box",
    description: "A powerful portable server that runs smart AI programs and maps in remote locations.",
    longDescription: "A complete, powerful computer server built inside a shockproof flight-safe case. It is dustproof and handles extreme heat easily. It runs smart local software and local mapping tools, keeping your data safe during any remote trip.",
    status: "Research System",
    imagePath: "https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&w=800&q=80",
    specifications: [
      "Processor: Fast energy-saving computer chip",
      "Case: Shockproof, dustproof weather-safe shell",
      "Safety: Erases data instantly if physically opened",
      "Cooling: Fanless design that stays cool in hot fields",
      "Power: Works with standard outlets or batteries"
    ],
    deploymentSector: "Frontier Border Security & Research Units"
  }
];

export const TRUST_PRINCIPLES = [
  {
    title: "Strong Cyber Security",
    description: "We follow strict security rules with strong data encryption. We build all software from scratch to make sure there are no hidden logins or private tracking backdoor setups."
  },
  {
    title: "Extremely Tough Hardware",
    description: "Our devices are tested to work reliably 24/7 in harsh weather, heavy tropical rain, extreme summer heat, and on unstable power setups."
  },
  {
    title: "Local Data Ownership",
    description: "We help you keep physical control of your equipment and data. None of your systems rely on distant servers, giving you 100% ownership of your security network."
  },
  {
    title: "Safeguarding Operations",
    description: "We build solutions to safeguard structures, track activity, send emergency alerts, and keep systems ready to protect the public."
  }
];

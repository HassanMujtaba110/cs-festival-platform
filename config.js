/**
 * ============================================================================
 * CS FESTIVAL 2026 - PLATFORM CONFIGURATION
 * ============================================================================
 * Central configuration object containing event data, validation patterns,
 * backend API endpoints, and festival scheduling constants.
 */

export const CONFIG = {
  FESTIVAL: {
    NAME: "CSF '26",
    FULL_TITLE: "Annual Computer Science & Tech Festival 2026",
    EDITION: "11th Edition",
    DATES: "October 16–18, 2026",
    START_DATE: "2026-10-16T09:00:00+05:00",
    VENUE: "Faculty of Computing & IT Complex, Block 4",
    ORGANIZER: "Department of Computer Science & ACM Student Chapter",
    CONTACT_EMAIL: "festival@cs-department.edu",
    HELPLINE: "+1 (555) 438-2026",
    PRIZE_POOL: "$12,500+",
    PARTICIPANT_TARGET: 1200
  },

  BACKEND: {
    // Set to your deployed Google Apps Script Web App URL (ending in /exec)
    APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycby-CSF2026-MOCK-URL/exec",
    // When true, uses localStorage mock API with realistic seed data
    // When false, makes live requests to Google Apps Script
    USE_MOCK_API: true,
    REQUEST_TIMEOUT_MS: 12000
  },

  ADMIN: {
    DEFAULT_PASSKEY: "csf2026admin"
  },

  CATEGORIES: [
    { id: "all", label: "All Competitions", icon: "terminal" },
    { id: "coding", label: "Coding & Algorithms", icon: "code" },
    { id: "hackathon", label: "Development & AI", icon: "cpu" },
    { id: "security", label: "Cyber Security", icon: "shield" },
    { id: "robotics", label: "Hardware & Robotics", icon: "radio" },
    { id: "gaming", label: "Esports & Gaming", icon: "gamepad" },
    { id: "creative", label: "Design & Quiz", icon: "compass" }
  ],

  EVENTS: [
    {
      id: "code-sprint",
      name: "Algorithmic CodeSprint",
      shortDesc: "Speed competitive programming battle testing DSA mastery and optimized runtime efficiency under extreme time pressure.",
      category: "coding",
      registrationType: "INDIVIDUAL",
      minTeamSize: 1,
      maxTeamSize: 1,
      status: "OPEN",
      venue: "Computer Lab 1 & 2 (Main IT Wing)",
      scheduleTime: "Day 1 • 10:00 AM - 1:00 PM",
      rounds: "3 Progressive Elimination Rounds",
      eligibility: "Open to all enrolled CS/IT undergraduates",
      prizePool: "$2,000 + Tech Vouchers",
      coordinator: "Dr. Ayesha & ACM ICPC Leads",
      rules: [
        "Individual participation only; no collaboration permitted during live rounds.",
        "Permitted languages: C++, Java, Python 3, Rust, Go.",
        "Evaluation criteria: Correctness, runtime complexity, and submission timestamp penalty.",
        "Strict anti-plagiarism automated similarity check applied on all submissions."
      ]
    },
    {
      id: "hack-matrix",
      name: "HackMatrix 36h Hackathon",
      shortDesc: "36-hour sprint to build full-stack web, mobile, or AI-powered solutions addressing real-world campus & civic challenges.",
      category: "hackathon",
      registrationType: "TEAM",
      minTeamSize: 2,
      maxTeamSize: 4,
      status: "OPEN",
      venue: "Innovation Hub & Collaborative Lounge",
      scheduleTime: "Day 1 (12:00 PM) to Day 2 (11:59 PM)",
      rounds: "Sprint -> Mentor Checkpoint -> Final Pitch",
      eligibility: "Teams of 2-4 students (inter-department allowed)",
      prizePool: "$4,500 + Cloud Credits",
      coordinator: "Prof. Farhan & DevSoc Leads",
      rules: [
        "All code must be authored during the hackathon period on a newly initialized GitHub repo.",
        "Use of public open-source libraries and APIs is fully permitted; boilerplate skeletons must be declared.",
        "Final deliverables require a live deployed URL and a 4-minute prototype presentation.",
        "Mentors will conduct 2 mandatory progress check-ins."
      ]
    },
    {
      id: "cyber-siege",
      name: "Capture The Flag: CyberSiege",
      shortDesc: "Hands-on jeopardy-style CTF covering web exploitation, reverse engineering, binary analysis, cryptography, and forensics.",
      category: "security",
      registrationType: "TEAM",
      minTeamSize: 1,
      maxTeamSize: 3,
      status: "OPEN",
      venue: "Cyber Defense Arena (Lab 4)",
      scheduleTime: "Day 2 • 9:30 AM - 4:30 PM",
      rounds: "7-Hour Continuous Live Scoreboard",
      eligibility: "Solo or teams up to 3 members",
      prizePool: "$2,200 + Security Certifications",
      coordinator: "Security SIG & WhiteHat Leads",
      rules: [
        "Flags follow the standard format: CSF2026{flag_string}.",
        "Denial of service attacks against scoring infrastructure or other teams results in immediate disqualification.",
        "Sharing flags or solution vectors between rival teams is strictly prohibited.",
        "Bring your own configured Kali Linux or penetration testing VM setup."
      ]
    },
    {
      id: "neuro-vibe",
      name: "NeuroVibe: GenAI Innovation Challenge",
      shortDesc: "Develop cutting-edge autonomous agents, multi-modal LLM workflows, or computer vision pipelines for real-time edge devices.",
      category: "hackathon",
      registrationType: "BOTH",
      minTeamSize: 1,
      maxTeamSize: 3,
      status: "OPEN",
      venue: "AI Research Center (Room 302)",
      scheduleTime: "Day 2 • 11:00 AM - 5:00 PM",
      rounds: "Dataset Baseline -> Model Architecture -> Evaluation",
      eligibility: "Solo or teams up to 3 members",
      prizePool: "$2,000 + GPU Compute Pass",
      coordinator: "AI/ML Club Lead Mentors",
      rules: [
        "Pre-trained weights and foundation models (OpenAI, Claude, Llama, Hugging Face) are permitted.",
        "Judging is heavily weighted on latency, practical utility, UI execution, and novel agentic integration.",
        "Source code must be submitted with a clear requirements.txt and reproducible setup instructions."
      ]
    },
    {
      id: "robo-clash",
      name: "RoboClash: Autonomous Maze & Line Tracer",
      shortDesc: "High-speed line tracking and obstacle-avoiding autonomous micro-robotics arena competition.",
      category: "robotics",
      registrationType: "TEAM",
      minTeamSize: 2,
      maxTeamSize: 4,
      status: "OPEN",
      venue: "Main Gymnasium Arena B",
      scheduleTime: "Day 3 • 10:00 AM - 2:00 PM",
      rounds: "Time Trial Qualifiers -> Final Circuit Run",
      eligibility: "Teams of 2 to 4 students",
      prizePool: "$1,800 + Hardware Toolkits",
      coordinator: "Robotics & Embedded Systems Society",
      rules: [
        "Bot dimensions must not exceed 25cm x 25cm x 25cm; weight limit: 2.0 kg.",
        "Robot must be fully autonomous once the start switch is engaged (no RF/Bluetooth control).",
        "Penalties apply if the robot strays off the track course or makes unauthorized contact with arena bounds."
      ]
    },
    {
      id: "pixel-craft",
      name: "PixelCraft: UI/UX & Rapid Game Jam",
      shortDesc: "Design intuitive digital interfaces or prototype a 2D indie micro-game based on an unannounced secret festival prompt.",
      category: "creative",
      registrationType: "BOTH",
      minTeamSize: 1,
      maxTeamSize: 2,
      status: "OPEN",
      venue: "Multimedia Studio (Audi-2)",
      scheduleTime: "Day 1 • 2:00 PM - 7:00 PM",
      rounds: "Theme Reveal -> 4hr Design Sprint -> Critique",
      eligibility: "Solo or pairs",
      prizePool: "$1,200 + Design Software Subs",
      coordinator: "Creative Media & UI Lead",
      rules: [
        "Theme will be revealed 15 minutes before the competition timer starts.",
        "Submissions can be interactive Figma/Penpot prototypes or Godot/Unity web builds.",
        "Original asset creation earns bonus points over generic stock templates."
      ]
    },
    {
      id: "tech-trivia",
      name: "TechTrivia: CS & Geek Culture SuperBowl",
      shortDesc: "Buzzer-round quiz covering computing history, kernel architectures, silicon trivia, internet lore, and pop-culture easter eggs.",
      category: "creative",
      registrationType: "TEAM",
      minTeamSize: 2,
      maxTeamSize: 2,
      status: "OPEN",
      venue: "Main Auditorium",
      scheduleTime: "Day 3 • 3:00 PM - 5:30 PM",
      rounds: "Written Prelims -> Top 6 Live Stage Finale",
      eligibility: "Pairs (2 members per team)",
      prizePool: "$800 + Geek Trophy",
      coordinator: "Debating & Quiz Society",
      rules: [
        "Strictly 2 participants per squad.",
        "No electronic devices permitted once inside the stage enclosure.",
        "Negative points apply for erroneous answers in the rapid-fire buzzer phase."
      ]
    }
  ],

  VALIDATION: {
    // Accepts clean student roll numbers like 2026-CS-042 or CS24-102
    ROLL_NUMBER_REGEX: /^[A-Za-z0-9\-_]{4,15}$/,
    EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    PHONE_REGEX: /^\+?[0-9\s\-()]{7,20}$/,
    NAME_REGEX: /^[a-zA-Z\s.'-]{2,50}$/,
    TEAM_NAME_REGEX: /^[a-zA-Z0-9\s._'-]{3,40}$/
  }
};
